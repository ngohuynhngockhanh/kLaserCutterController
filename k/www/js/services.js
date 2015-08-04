angular.module('kLaserCutterControoler.services', ['LocalStorageModule'])
.factory('Config', ["localStorageService", "$translate", function(localStorageService, $translate) {
	var config = localStorageService.get("config");
	if (config == null)
		config = {};
	if (config.language == null || config.language == '')
		config.language = $translate.use();	
	if (config.poolingInterval == null || intval(config.poolingInterval) < 200)
		config.poolingInterval = 1696;
	if (config.maxRequestGeneral == null || intval(config.maxRequestGeneral) < 20)
		config.maxRequestGeneral = 20;
	if (config.firstUse == null)
		config.firstUse = true;
	if (config.theme == null)
		config.theme = 'light';
	config.version = APP_VERSION;
	
	var save = function(new_config) {
		config = new_config;
		localStorageService.set("config", config);
		console.log("save config ");
	}
	
	return {
		all: function() {
			return config;
		},
		get: function(key) {
			var res = (config[key] != null) ? config[key] : "";
			return res;
		},
		set: function(key, value) {
			if (angular.isNumber(value))
				value = intval(value);
			console.log(config[key]);
			config[key] = value;
			save(config);
		},
		save: save
	}
}])

.factory('GCode', function() {
	var list,
		maxPoint,
		minPoint,
		GCodeArray;
	var init = function () {
		list = [];
		minPoint = new Vec2(1e9, 1e9),
		maxPoint = new Vec2(-1e9, -1e9);
	};
	init();
	
	function getPosFromCommand(which, command) {
		var tmp = explode(which, command);
		if (tmp.length == 1)
			return undefined;
		return floatval(tmp[1]);
	}
	return {
		init: init,
		getPosFromCommand: getPosFromCommand,
		update: function(gCodeList) {
			if (!gCodeList.length || gCodeList.length == 0)
				return false;
			GCodeArray = gCodeList;	
			this.init();
			var oldVec = new Vec2(0, 0);
			var maxX = -1e9,
				maxY = -1e9,
				minX = 1e9,
				minY = 1e9;
			for (var i = 0; i < gCodeList.length; i++) {
				var x = getPosFromCommand('X', gCodeList[i]);
				var y = getPosFromCommand('Y', gCodeList[i]);					
				var vec = oldVec;
				if (!(x == undefined && y == undefined)) {
					x = (x == undefined) ? vec.x : floatval(x);
					y = (y == undefined) ? vec.y : floatval(y);
					if (x > maxX)
						maxX = x;
					if (x < minX)
						minX = x;
					if (y > maxY)
						maxY = y;
					if (y < minY)
						minY = y;
					vec = new Vec2(x, y);
					list.push(vec);	
					oldVec = vec;
				}					
			}
			
			minPoint.set(minX, minY);
			maxPoint.set(maxX, maxY);
			return true;
		},
		getAll: function () {
			return {
				list: list,
				maxPoint: maxPoint,
				minPoint: minPoint,
				GCodeArray: GCodeArray
			}
		},
		getList: function () {
			return list;
		},
		getMin: function () {
			return minPoint;
		},
		getMax: function() {
			return maxPoint;
		}
	}
})
.factory('Socket', ['Config', 'GCode', 'Canvas', "ngProgressFactory", "$ionicPopup", "$filter", "$ionicScrollDelegate", function(Config, GCode, Canvas, ngProgressFactory, $ionicPopup, $filter, $ionicScrollDelegate) {
	//open socket
    var socket, uploader, scope;
    var machineRunning = false;
    var circle = undefined,
    	settings = {},
    	connected = false,
    	MAX_COMMAND_MONITOR_LENGTH = 100; 
    var progressbar = ngProgressFactory.createInstance(),
    	startedTime = 0,
    	commandToDoLength = 1;
    	progressbar.setHeight('3px');
    var setStatus = function (status) {
		scope.socket.canStart = (status >> 3) & 1;
		scope.socket.canStop = (status >> 2) & 1;
		scope.socket.canPause = (status >> 1) & 1;
		scope.socket.canUnpause = (status >> 0) & 1;   		
	}
	var setStatusFromNode = function(machineRunning, machinePause) {
		var status = 0;
		status = !machineRunning;
    	status <<= 1;
    	status |= machineRunning;
    	if (machineRunning) {
    		status <<= 1;
    		status |= !machinePause;
    		status <<= 1;
    		status |= machinePause;
    	} else
    		status <<= 2;
    	setStatus(status);
	}
	var formatClock = function() {
		var t = time() - startedTime;
		var s = t % 60;
		var m = intval(t / 60) % 60;
		var h = intval(t / 60 / 60);
		return sprintf("%02d:%02d:%02d", h, m, s);
	}
	var monitor = $("#commandMonitor");
	var writeToCommandMonitor = function(command) {
		if (scope.socket.commandMonitor.length > MAX_COMMAND_MONITOR_LENGTH)
			scope.socket.commandMonitor.shift();
		scope.socket.commandMonitor.push(command);
		var monitor = $("#commandMonitor");
		monitor.html(scope.socket.commandMonitor.join("<br />"));
		 $ionicScrollDelegate.$getByHandle('commandMonitor').scrollBottom();
	}
	var commandSubmit = function() {
		var cmd = scope.socket.commandLine;
		scope.socket.commandLine = "";
		socket.emit("cmd", cmd);
		writeToCommandMonitor("> " + cmd);
	}
    return {
    	setStatus: setStatus,
    	setStatusFromNode: setStatusFromNode,
    	socket: function() {
    		return socket;
    	},
    	initScope: function($scope) {
    		$scope.startedTime = '';
    		$scope.jobPercent = '';
    		$scope.socket = this;
    		$scope.socket.socket.canStart = false;
			$scope.socket.canStop = false;
			$scope.socket.canPause = false;
			$scope.socket.canUnpause = false;
			$scope.socket.commandMonitor = [];
			$scope.socket.commandSubmit = commandSubmit;
			return $scope;
    	},    	
    	connect: function(host, $scope, settings) {
    		$scope = $scope || undefined;
    		settings = settings || {};
    		settings.maxQueueElement = settings.maxQueueElement || 200;
    		//setup scope
    		if ($scope != undefined) {
	    		$scope = this.initScope($scope);
    			this.setScope($scope);
    		}
    		
    			
    		//setup host
    		host = host || Config.get('socket_host')    		
    		socket = io.connect(host);
    		
    		//setup uploader
    		
		    uploader = new SocketIOFileUpload(socket);
	    	var file_input = document.getElementById("siofu_input");
	    	uploader.listenOnInput(file_input);
	    	uploader.addEventListener('choose', function(e) {
		    	var files = e.files;
		    	for (var i = 0; i < files.length; i++) {
		    		var file = files[i];
		    		var fileSize = file.size;
		    		if (fileSize > settings.maxFileSize) {
		    			scope.alert(sprintf($filter('translate')('ERROR_UPLOAD_MAX_FILE_SIZE'), settings.maxFileSize / 1024 / 1024));
		    			return false;
		    		}
		    	}
		    });
		    uploader.addEventListener('start', function(e) {
		    	progressbar.start();
		    	
		    });
		    uploader.addEventListener('progress', function(event) {
		    	var percent = event.bytesLoaded / event.file.size * 95;
		    	if (percent <= 95)
		    		progressbar.set(percent);
		    	else
		    		progressbar.start();
		    	
		    });
		    
		    
		    //setup socket
		    socket.on("connect", function() {
		    	connected = true;
		    	waitTime = (ionic.Platform.isAndroid()) ? 2000 : 1500;		
	    		setTimeout(function() {
	    			socket.emit('requestQueue');
	    		}, waitTime);
		    });
		    socket.on("disconnection", function() {
		    	if (connected) {
		    		scope.alert($filter('translate')('CANT_CONNECT_TO_SERVER'));
		    	}
		    	connected = false;
		    });
		    
		    
		    socket.on('percent', function() {
		    	progressbar.reset();
		    	progressbar.start();
		    });
		    socket.on("error", function(error) {
		    	var print = JSON.stringify(error);
		    	writeToCommandMonitor(print);	 
		    });
		    socket.on("data", function(data) {
		    	writeToCommandMonitor(data);	 
		    });
		    socket.on("settings", function(argv) {
		    	for (k in argv) {
		    		settings[k] = argv[k];
		    	}
		    });
		    socket.on('sendSVG', function(content) {
		    	var index = content.indexOf("viewBox");
		    	if (index > -1)
		    		return;
		    	
				var src = 'data:image/svg+xml;base64,'+base64_encode(content);
				Canvas.addSVG(src, 0,  0);
				Canvas.render();
			    	
		    });
		    socket.on("position", function(data , machineRunning, machinePause) {
		    	if (Canvas.canvas() != undefined) {
			    	setStatusFromNode(machineRunning, machinePause);
			    	if (!scope.machine)
			    		scope.machine = new Vec2(0, 0);
			    	scope.machine.set(round(floatval(data[1]), 5), round(floatval(data[2]), 5));
					if (!scope.work)
			    		scope.work = new Vec2(0, 0);
			    	scope.work.set(round(floatval(data[4]), 5), round(floatval(data[5]), 5));
			    	var y = scope.machine.y * Canvas.constConvert();
			    	var x = scope.machine.x * Canvas.constConvert();
			    	
			    	scope.status = '[' + data[0] + ']';
			    	
			    	Canvas.renderOnAddRemove(true);
			    	if (circle == undefined) {
			    		circle = Canvas.drawCircle({top: y, left: x});
			    		Canvas.add(circle);	
			    	} else {
			    		circle.setTop(Canvas.formatY(y));
			    		circle.setLeft(Canvas.formatX(x));
			    		Canvas.render();
			    	}
			    	
			    	if (startedTime > 0)
			    		scope.startedTime = formatClock();
			    	
			    		    	
			    	scope.$apply();
			    }
		    });
		    
		    var prevPoint = new Vec2(0, 0);
			socket.on("gcode", function(data, timer2) {				
				startedTime = timer2;
		    	var x = GCode.getPosFromCommand('X', data.command);
		    	var y = GCode.getPosFromCommand('Y', data.command);
		    	var nowPoint = prevPoint.clone();
		    	if (!(x == undefined && y == undefined)) {
		    		if (x == undefined)
		    			x = prevPoint.x;
	    			if (y == undefined)
		    			y = prevPoint.y;
		    		
		    		nowPoint.set(floatval(x), floatval(y));
		    		nowPoint.multiply(Canvas.constConvert());
	    			if (prevPoint.distance(nowPoint) > 3) {
		    			Canvas.renderOnAddRemove(true);
		    			Canvas.add(Canvas.drawLine(prevPoint.toArray().concat(nowPoint.toArray()), 'blue'));
		    			prevPoint = nowPoint.clone();
		    		}
		    	}		
		    	var percent = 99.9 - (data.length / commandToDoLength * 99.9);
		    	scope.jobPercent = sprintf("(%3.1f", percent) + '%)';
		    	progressbar.set(percent);
		    	writeToCommandMonitor('> ' + data.command);	    	
		    });
		    socket.on('AllGcode', function(list) {		    	
		    	progressbar.complete();
		    	if (list && list.length  && list.length > 0) {
		    		commandToDoLength = list.length;
					GCode.update(list);
					Canvas.create();
				}
			});
			socket.on('finish', function() {
				startedTime = 0;
				scope.jobPercent = '(100%)';
				progressbar.complete(); 
			});
    	},
    	
    	start: function() {
    		socket.emit('start');
    		this.setStatus(6); //0110
    	},
    	pause: function() {
    		socket.emit('pause');
    		this.setStatus(5); //0101
    	},
    	unpause: function() {
    		socket.emit('unpause');
    		this.setStatus(6); //0110
    	},
    	stop: function() {
    		this.pause();
    		var $this = this;
    		var confirmPopup = $ionicPopup.confirm({
				title: $filter('translate')('ARE_YOU_SURE'),
				template: $filter('translate')('ARE_YOU_SURE_TO_STOP_THE_MACHINE')
			});
			confirmPopup.then(function(res) {
				$this.unpause();
				if(res) {
					startedTime = 0;
					socket.emit('stop');
    				setStatus(8); //1000
				}
			});
    	},
    	setScope: function($scope) {
    		scope = $scope;
    	}
    };
}])
.factory('Canvas', ['GCode', "$rootScope", function(GCode, $rootScope) {
	var minusWidth = 15,
		minusHeight = 15,
		endPointLength = 0.01,
		mm2px = 3.54330708664,
		width,
		jCanvas,
		height,
		constConvert,
		canvas = undefined,
		width,
		height
		lines = [],
		texts = [],
		circles = [],
		vec_array= [];
	function formatX(x) {
		return x + minusWidth;
	}
	function formatY(y) {
		return -y + height;
	}
	function drawLine(coords, color, width) {
		coords[0] = formatX(coords[0]);
		coords[2] = formatX(coords[2]);
		coords[1] = formatY(coords[1]);
		coords[3] = formatY(coords[3]);
		var line = new fabric.Line(coords, {
			fill: color || 'red',
			stroke: color || 'red',
			strokeWidth: width || 0.5,
			selectable: false
		});
		if (coords[4] != true)
			lines.push(line);
		return line;
	}
	
	function drawText(text, settings) {
		settings = settings || {};
		settings.top = settings.top || 0;
		settings.left = settings.left || 0;
		settings.stroke = settings.stroke || 'red';
		settings.fontSize = settings.fontSize || 12;
		settings.originX = settings.originX || 'left';
		settings.originY = settings.originY || 'top';
		settings.selectable = settings.selectable || false;
		settings.left = formatX(settings.left);
		settings.top = formatY(settings.top);
		var text = new fabric.Text(text, settings);
		texts.push(text);
		return text;
	}
	
	function drawCircle(settings) {
		settings = settings || {};
		settings.radius = settings.radius || 2;
		settings.fill = settings.fill || 'green';
		settings.left = settings.left || 0;
		settings.top = settings.top || 0;  
		settings.originX = settings.originX || 'center';
		settings.originY = settings.originY || 'center';
		settings.left = formatX(settings.left);
		settings.top = formatY(settings.top);
		var circle = new fabric.Circle(settings);
		circles.push(circle);
		return circle;
	}
	function _init(id) {
		canvas = new fabric.Canvas(id, {renderOnAddRemove: true, selectable: false});
		jCanvas = $("#" + id);
		var canvasWidth = $rootScope.minScreenWidth * .55;
		if ($rootScope.minScreenWidth <= 360)
			canvasWidth = 290;
		canvas.setWidth(canvasWidth);
		canvas.setHeight(canvasWidth);
		width = canvas.getWidth() - minusWidth - 1; //minus 1, because of betiaufull stuff
		height= canvas.getHeight() - minusHeight - 1;
		canvas.add(drawLine([0, 0, width, 0, true]));		//x coordinate
		canvas.add(drawLine([0, 0, 0, height, true]));	//y coordinate
		canvas.renderOnAddRemove = false;
		if (ionic.Platform.isAndroid())
			$("#commandMonitorScrolling").attr('style', 'height:200px;');
	}
	function init(id) {		
		if (ionic.Platform.isAndroid()) {
			setTimeout(function() {
				_init(id);
			}, 1200);
		} else
			 _init(id);
		
	}
	
	
	
	
	function tryDraw(constConvert, maxPoint) {
		if (vec_array.length == 0)
			return false;
		var fromPoint = new Vec2(0, 0); 
		var i = 0;
		while (i < vec_array.length) {
			toPoint = vec_array[i].multiply(constConvert);
			if (fromPoint.distance(toPoint) > 5) {
				var coords = fromPoint.toArray().concat(toPoint.toArray());
				canvas.add(drawLine(coords));
				fromPoint = toPoint;
			}
			i++;
		}
		
		
		//draw max Y max X
		canvas.add(drawLine([maxPoint.x - 1, endPointLength * height, maxPoint.x - 1, -endPointLength * height])); // max x 
		canvas.add(drawLine([-endPointLength * width, maxPoint.y - 1, endPointLength * width, maxPoint.y - 1]));   // max y
		
		var maxX = maxPoint.x,	
			maxY = maxPoint.y;
		
		maxPoint = maxPoint.multiply(1 / constConvert);
		
		//add text to tell user which line is x and the other is y
		canvas.add(drawText(round(maxPoint.y, 3) + "mm", {left: 5, top: height - 1}));
		canvas.add(drawText(" (Max-X: " + round(maxPoint.x, 3) + " mm; Max-Y: " + round(maxPoint.y, 3) + "mm)", {top: -1}));
		canvas.add(drawText(round(maxPoint.x, 3) + "mm", {originX: 'right', originY: 'bottom', top: 0, left: width}));
		canvas.renderAll();
		return true;
	}
	
	
	return {	
		SVGobj: null,	
		init: function (id) {
			init(id);
		},
		canvas: function() {
			return canvas;
		},
		removePath: function() {
			for (var i = 0; i < lines.length; i++)
				canvas.remove(lines[i]);
			for (var i = 0; i < texts.length; i++)
				canvas.remove(texts[i]);
		},			
		create: function() {
			this.renderOnAddRemove(false);
			vec_array = GCode.getList();	
			
			this.removePath();
			var maxPoint = GCode.getMax().multiply(mm2px);
			constConvert = (maxPoint.x > maxPoint.y) ? maxPoint.x : maxPoint.y;
			constConvert = width / constConvert;
			maxPoint = maxPoint.multiply(constConvert);
			constConvert *= mm2px;
			
			
			tryDraw(constConvert, maxPoint);
			
		},
		add: function(object) {
			canvas.add(object);
		},
		addSVG: function(src, x, y) {
			if (this.SVGobj != null)
				canvas.remove(this.SVGobj);
			var obj;// = new fabric.Image({src: src});
			var _this = this;
			fabric.Image.fromURL(src, function(oImg) {
				obj = oImg;
				x = x || 0;
				x = formatX(x);
				y = y || 0;
				y = formatY(y);
				obj.scale(constConvert / mm2px);
				//x *= constConvert / mm2px;
				//y *= constConvert / mm2px
				obj.setTop(y);
				obj.setLeft(x);
				obj.selectable = false;
				obj.setOriginY('bottom');
				obj.setOriginX('left');
				_this.SVGobj = obj;
				_this.add(obj);
			});
			
		},
		drawCircle: drawCircle,
		drawText:	drawText,
		drawLine:	drawLine,
		constConvert: function() {
			return constConvert;
		},
		render: function() {
			canvas.renderAll();
		},
		renderOnAddRemove: function(bool) {
			canvas.renderOnAddRemove = bool;
		},
		formatX: formatX,
		formatY: formatY
	}
}])
.factory('Chats', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var chats = [{
    id: 0,
    name: 'Ben Sparrow',
    lastText: 'You on your way?',
    face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'
  }, {
    id: 1,
    name: 'Max Lynx',
    lastText: 'Hey, it\'s me',
    face: 'https://avatars3.githubusercontent.com/u/11214?v=3&s=460'
  }, {
    id: 2,
    name: 'Adam Bradleyson',
    lastText: 'I should buy a boat',
    face: 'https://pbs.twimg.com/profile_images/479090794058379264/84TKj_qa.jpeg'
  }, {
    id: 3,
    name: 'Perry Governor',
    lastText: 'Look at my mukluks!',
    face: 'https://pbs.twimg.com/profile_images/598205061232103424/3j5HUXMY.png'
  }, {
    id: 4,
    name: 'Mike Harrington',
    lastText: 'This is wicked good ice cream.',
    face: 'https://pbs.twimg.com/profile_images/578237281384841216/R3ae1n61.png'
  }];

  return {
    all: function() {
      return chats;
    },
    remove: function(chat) {
      chats.splice(chats.indexOf(chat), 1);
    },
    get: function(chatId) {
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].id === parseInt(chatId)) {
          return chats[i];
        }
      }
      return null;
    }
  };
});
