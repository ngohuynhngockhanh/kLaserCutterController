angular.module('kLaserCutterController.services', ['LocalStorageModule'])
.factory('Config', ["localStorageService", "$translate", function(localStorageService, $translate) {
	var config = localStorageService.get("config");
	if (config == null)
		config = {};
		
	var defaultConfig = localStorageService.get("defaultConfig");
	if (defaultConfig == null)
		defaultConfig = {
			socket_host	: {
				key			: 'socket_host',
				name		: 'HOST ADDRESS',
				defaultValue: 'http://192.168.1.105:90/',
				type		: 'text',
				placeholder	: 'TYPE kLaserCutter HOST ADDRESS'				
			}, 
			copiesDrawingDefault: {
				key			: 'copiesDrawingDefault',
				name		: 'DEFAULT_DRAWING_COPIES',
				defaultValue: 1,
				type		: 'text'
			},
			showMJPG	: {
				key			: 'showMJPG',
				name		: 'DISPLAY MJPG',
				defaultValue: true,
				type		: 'toggle'
			},
			renderSVG		: {
				key			: 'renderSVG',
				name		: 'RENDER SVG',
				defaultValue: ionic.Platform.isAndroid() ? false : true,
				type		: 'toggle'
			},
			rememberDevice	: {
				key			: 'rememberDevice',
				name		: 'REMEMBER DEVICE (ANDROID)',
				defaultValue: true,
				type		: 'toggle',
			},
			serverLoad	: {
				key			: 'serverLoad',
				name		: 'SERVER LOAD',
				defaultValue: '0',
				type		: 'status'
			},
			tempGalileo	: {
				key			: 'tempGalileo',
				name		: 'GALILEO TEMPERATE',
				defaultValue: '0',
				type		: 'status',
			}
		};
	
	for (var configKey in defaultConfig) {
		var _config = defaultConfig[configKey];
		if (config[configKey] == null)
			config[configKey] = _config.defaultValue;
		
	}/*
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
	if (config.socket_host == null)
		config.socket_host = 'http://192.168.1.105:90/';
	if (config.showMJPG == null)
		config.showMJPG = true;*/
	config.version = APP_VERSION;
	
	var save = function(new_config) {
		config = new_config;
		localStorageService.set("config", config);
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
			config[key] = value;
			this.save(config);
		},
		save: save,
		getList: function() {
			var list = [];
			for (var configKey in defaultConfig) {
				var _config = defaultConfig[configKey];
				var ele = defaultConfig[configKey]; //clone
				ele.value = (config[configKey] != undefined) ? config[configKey] : ele.defaultValue;
				list.push(ele);
			}
			return list;
		}
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
.factory('Socket', ['Config', 'GCode', 'Canvas', "ngProgressFactory", "$ionicPopup", "$filter", "$ionicScrollDelegate", "$ionicUser", "$ionicPush", "$rootScope", "$http", "$cordovaFile", "$cordovaFileTransfer", function(Config, GCode, Canvas, ngProgressFactory, $ionicPopup, $filter, $ionicScrollDelegate, $ionicUser, $ionicPush, $rootScope, $http, $cordovaFile, $cordovaFileTransfer) {
	//open socket
    var socket = null, uploader, scope, mjpg_default_url;
    var _machineRunning = false;
    var circle = undefined,
    	settings = {},
    	connected = false,
    	MAX_COMMAND_MONITOR_LENGTH = 100,
    	keyPressIdx = 0, identified = false,
    	token; 
    var progressbar = ngProgressFactory.createInstance(),
    	startedTime = 0,
    	commandToDoLength = 0;
    	progressbar.setHeight('3px'),
    	externalRootDirectory = "";
    var setStatus = function (status) {    	 
		scope.socket.canStart = (status >> 3) & 1;
		scope.socket.canStop = (status >> 2) & 1;
		scope.socket.canPause = (status >> 1) & 1;
		scope.socket.canUnpause = (status >> 0) & 1;
		_machineRunning = scope.socket.canStop;   		
	}
	var setStatusFromNode = function(machineRunning, machinePause) {
		_machineRunning = machineRunning;
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
		keyPressIdx = scope.socket.commandMonitor.length - 1;
		$ionicScrollDelegate.$getByHandle('commandMonitor').scrollBottom();
	}
	var commandSubmit = function() {
		var cmd = scope.socket.commandLine;
		scope.socket.commandLine = "";
		socket.emit("cmd", cmd);
		writeToCommandMonitor("> " + cmd);
	}
	var commandKeypress = function($event) {
		var keyCode = $event.keyCode;
		if (!(keyCode == 38 || keyCode == 40))
			return true;
			
		var oldPressIdx, found = false;
		oldPressIdx = keyPressIdx;
		
		while ((keyCode == 38 && keyPressIdx > 0) || (keyCode == 40 && keyPressIdx < scope.socket.commandMonitor.length - 1)) {
			keyPressIdx += (keyCode == 38) ? -1 : 1;
			if (scope.socket.commandMonitor[keyPressIdx].indexOf('> ') == 0) {
				found = true;
				break;	
			}
		}
		if (!found)
		keyPressIdx = oldPressIdx;
		
		if (scope.socket.commandMonitor[keyPressIdx] && scope.socket.commandMonitor[keyPressIdx].indexOf('> ') == 0 && scope.socket.commandMonitor[keyPressIdx])
			scope.socket.commandLine = substr(scope.socket.commandMonitor[keyPressIdx], 2, strlen(scope.socket.commandMonitor[keyPressIdx]));
	}
	
	var setToken = function(_token, remember) {
		remember = (remember != undefined) ? remember : Congit.get('rememberDevice');
		token = _token;
		socket.emit("token", token, remember);
	};
	
	$rootScope.$on('$cordovaPush:tokenReceived', function(event, data) {
    	console.log('Ionic Push: Got token ', data.token, data.platform);
    	setToken(data.token);
	});
	
	var identifyUser = function() {
	    console.log('Ionic User: Identifying with Ionic User service');
	
	    var user = $ionicUser.get();
	    if(!user.user_id) {
	      // Set your user_id here, or generate a random one.
	      user.user_id = $ionicUser.generateGUID();
	    };
	
	    // Add some metadata to your user object.
	    angular.extend(user, {
	      name: 'android',
	      bio: 'I come from android'
	    });
	
	    // Identify your user with the Ionic User Service
	    $ionicUser.identify(user).then(function(){
	      identified = true;
	      pushRegister();
	    });
  	};
	
	var pushRegister = function() {
	    console.log('Ionic Push: Registering user');
	
	    // Register with the Ionic Push service.  All parameters are optional.
	    $ionicPush.register({
	 		canShowAlert: true, //Can pushes show an alert on your screen?
	    	canSetBadge: true, //Can pushes update app icon badges?
	    	canPlaySound: true, //Can notifications play a sound?
	      	canRunActionsOnWake: true, //Can run actions outside the app,
	      	pushNotification: function() {},
	      	onNotification: function(notification) {
	      		// Handle new push notifications here
	      		console.log(notification);
	        	return true;
	      	}
	    });
	};
	
    return {
    	setStatus: setStatus,
    	setStatusFromNode: setStatusFromNode,
    	socket: function() {
    		return socket;
    	},
    	setCopies: function() {
    		var _this = this;
    		$ionicPopup.prompt({
				title: $filter("translate")("COPIES COUNT"),
				template: $filter("translate")("COPIES_OF_THIS_DRAWING"),
			    inputType: 'text',
			    inputPlaceholder: intval(Config.get("copiesDrawingDefault"))
			}).then(function(res) {
				res = intval(res);
				if (res <= 1)
					res = intval(Config.get("copiesDrawingDefault"));
			    _this.start(intval(res));
			});
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
			$scope.socket.mjpg = null;
			$scope.socket.connected = this.connected;
			$scope.socket.disconnected = this.disconnected;
			$scope.socket.commandKeypress = commandKeypress;
			$scope.socket.mjpgStyleWidth = $rootScope.minScreenWidth + 'px';	
			$scope.socket.snapshot = this.snapshot;		
			$scope.socket.setCopies = this.setCopies;
			return $scope;
    	},    	
    	disconnected: function() {
    		return !this.connected();
    	},
    	disconnect: function() {
    		connected = false;
    		mjpg_default_url = null;  
    		this.stopHalt(true);
    		Canvas.removePath();
    		startedTime = 0;
    		identified = false;
    		Canvas.removeSVG();
    		socket.disconnect();
    		socket.destroy();
    	},
    	connected: function() {
    		return socket.connected;
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
    		host = host || Config.get('socket_host');   		
    		socket = io.connect(host, {'forceNew': true});
    		if (!identified && ionic.Platform.isAndroid())
    			identifyUser();
    		
    		//setup mjpg_default_url
    		mjpg_default_url = host.split(':');
    		mjpg_default_url = mjpg_default_url[0].concat(':' + mjpg_default_url[1]) + ":%s/?action=stream&t=%d";
    		
    		
    		//setup uploader
    		setTimeout(function() {
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
			    	console.log(e);
			    	progressbar.start();
			    	
			    });
			    uploader.addEventListener('progress', function(event) {
			    	var percent = event.bytesLoaded / event.file.size * 95;
			    	if (percent <= 95)
			    		progressbar.set(percent);
			    	else
			    		progressbar.start();
			    	
			    });
    		}, 3000);
		    
		    
		    
		    //setup socket
		    socket.on("connect", function() {
		    	connected = true;
		    	waitTime = (ionic.Platform.isAndroid()) ? 2000 : 1500;		
	    		setTimeout(function() {
	    			socket.emit('requestQueue');
	    		}, waitTime);
		    });
		    socket.on("disconnect", function() {
		    	scope.socket.mjpg = null;
		    	connected = false;
		    	this.disconnect();
		    	scope.$apply();
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
		    	Canvas.removeSVG();
		    	if (index > -1)
		    		return;
		    	
				var src = 'data:image/svg+xml;base64,'+base64_encode(content);
				Canvas.addSVG(src, 0,  0, Config.get('renderSVG'));
				Canvas.render();
			    	
		    });
		    socket.on("system_log", function(log) {
		    	Config.set('serverLoad', log['serverLoad']);
		    	Config.set('tempGalileo', log['tempGalileo'] + "°C");
		    });
		    socket.on("position", function(data , machineRunning, machinePause, copiesDrawing) {
		    	
		    	if (Canvas.canvas() != undefined) {
			    	if (commandToDoLength > 0)
			    		setStatusFromNode(machineRunning, machinePause);
			    	if (!scope.machine)
			    		scope.machine = new Vec2(0, 0);
			    	scope.machine.set(round(floatval(data[1]), 5), round(floatval(data[2]), 5));
					if (!scope.work)
			    		scope.work = new Vec2(0, 0);
			    	scope.work.set(round(floatval(data[4]), 5), round(floatval(data[5]), 5));
			    	var y = scope.machine.y * Canvas.constConvert();
			    	var x = scope.machine.x * Canvas.constConvert();
			    	
			    	if (data[0] == 'Run')
			    		data[0] += '-' + copiesDrawing;
			    	scope.status = '[' + data[0] + ']';
			    	
			    	Canvas.renderOnAddRemove(true);
			    	if (circle == undefined) {
			    		circle = Canvas.drawCircle({top: y, left: x});
			    		Canvas.insertAt(circle, 10000);
			    	} else {
			    		circle.setTop(Canvas.formatY(y));
			    		circle.setLeft(Canvas.formatX(x));
			    		Canvas.render();
			    	}

			    	if (startedTime > 0)
			    		scope.startedTime = formatClock();
			    	
			    		    	
			    	//scope.$apply();
			    }
		    });
		    socket.on('stopCountingTime', function() {
		    	startedTime = 0;
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
		    		Config.set('restorePoint', nowPoint);  
		    		nowPoint.multiply(Canvas.constConvert());
	    			if (prevPoint.distance(nowPoint) > 3) {
		    			Canvas.renderOnAddRemove(true);
		    			Canvas.add(Canvas.drawLine(prevPoint.toArray().concat(nowPoint.toArray()), 'blue'));
		    			prevPoint = nowPoint.clone();
		    		}
		    	}		
		    	var percent = 99.9 - (data.length / ((commandToDoLength == 0) ? 1 : commandToDoLength) * 99.9);
		    	scope.jobPercent = sprintf("(%3.1f", percent) + '%)';
		    	progressbar.set(percent);
		    	writeToCommandMonitor('> ' + data.command);	    	
		    });
		    socket.on('AllGcode', function(list) {		    	
		    	progressbar.complete();
		    	if (list && list.length  && (list.length > 0)) {
		    		commandToDoLength = list.length;
					GCode.update(list);
					var restorePoint = Config.get('restorePoint');
					var zeroVec = new Vec2(0, 0);
					Canvas.create((!restorePoint || !restorePoint.x || !restorePoint.y || zeroVec.equal(restorePoint.x, restorePoint.y)) ? -1 : Canvas.restoreProcessedLine(restorePoint));
		    		
				} else {
					Canvas.clear();
					setStatus(0); //0000
				}
			});
			
			socket.on('mjpg_log', function(log) {
				if (log.ok == false && scope.socket.mjpg != null)
					scope.socket.mjpg = null;
				else if (log.ok)
					scope.socket.mjpg =  (log.startAgain || scope.socket.mjpg == null) ? sprintf(mjpg_default_url, log.port, intval(time())) : scope.socket.mjpg; 
				
				
			});
			
			socket.on('finish', function() {
				startedTime = 0;
				scope.jobPercent = '(100%)';
				progressbar.complete(); 
				var zeroVec = new Vec2(0, 0);
				Config.set('restorePoint', zeroVec);
			});
    	},
    	
    	start: function(copies) {
    		copies = copies || intval(Config.get("copiesDrawingDefault"));
    		socket.emit('start', copies);
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
			var stopHalt = this.stopHalt;
			confirmPopup.then(function(res) {
				$this.unpause();
				if(res)
					stopHalt();
			});
    	},
    	stopHalt: function(disconenct) {
    		progressbar.complete(); 
    		var zeroVec = new Vec2(0, 0);
			Config.set('restorePoint', zeroVec);
    		scope.jobPercent = '';
    		startedTime = 0;
			socket.emit('stop');
			setStatus(8); //1000
			if (disconenct)
				setStatus(0);
    	},
    	setScope: function($scope) {
    		scope = $scope;
    	},
    	isMachineRunning: function () {
    		return !(_machineRunning == false || _machineRunning == 0);
    	},
    	setToken: setToken,
    	takeSnapshot: function(url, targetPath) {
    		$cordovaFileTransfer.download(url, targetPath, {}, true)
		    .then(function(result) {
		    	console.log(result);
		      	$rootScope.alert($filter('translate')('SAVED_FILE'));
		   	}, function(err) {
		   		console.log(err);
		   		$rootScope.alert($filter('translate')('CANT_SAVE_FILE'));
		    });
    	},
    	setRememberDevice: function(bool) {
    		if (ionic.Platform.isAndroid()) {
	    		setTimeout(function() {
	    			setToken(token, bool);
	    		}, 2000);
    		}    		
    	},
    	snapshot: function() {
    		var _this = this;
    		var url = str_replace("?action=stream", "?action=snapshot", scope.socket.mjpg);
    		var filename = "snapshot-" + rand(1, 100) + date('-H-m-s-d-m-Y') + ".jpg";
    		externalRootDirectory = ionic.Platform.isAndroid() ? cordova.file.externalRootDirectory : cordova.file.documentsDirectory;
    		var targetPath = externalRootDirectory + "DCIM/kLaserCutterSnapshot/" + filename;
    		console.log(targetPath);
			$cordovaFile.checkDir(externalRootDirectory, "DCIM/kLaserCutterSnapshot")
		    .then(function (success) {
		         _this.takeSnapshot(url, targetPath);
		    }, function (error) {
		    	 console.log(error);
		         $cordovaFile.createDir(externalRootDirectory, "DCIM/kLaserCutterSnapshot", true).then(function(success) {
		         	_this.takeSnapshot(url, targetPath);
		         }, function(error) {
		         	console.log(error);
		         });
		    });
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
		settings.radius = settings.radius || 4;
		settings.fill = settings.fill || '#FFC900';
		settings.stroke = settings.stroke || 'green';
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
			$("#commandMonitorScrolling").attr('style', 'height:100px;');
	}
	function init(id) {		
		if (ionic.Platform.isAndroid()) {
			setTimeout(function() {
				_init(id);
			}, 1200);
		} else
			 _init(id);
		
	}
	
	
	
	
	function tryDraw(constConvert, maxPoint, processedLine) {
		if (vec_array.length == 0)
			return false;

		
		var fromPoint = new Vec2(0, 0); 
		var i = 0;
		while (i < vec_array.length) {
			toPoint = vec_array[i].multiply(constConvert);
			if (fromPoint.distance(toPoint) > 5) {
				var coords = fromPoint.toArray().concat(toPoint.toArray());
				canvas.add(drawLine(coords, (i <= processedLine) ? 'blue' : 'red'));
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
		clear: function() {
			this.removePath();
			this.removeSVG();
		},	
		restoreProcessedLine: function(point) {
			var maxPoint = GCode.getMax();
			
			var _maxPoint = new Vec2();
			_maxPoint.set(maxPoint);
			_maxPoint.multiply(mm2px);
			constConvert = (_maxPoint.x > _maxPoint.y) ? _maxPoint.x : _maxPoint.y;
			constConvert = width / constConvert;
			constConvert *= mm2px;
			var vec_array = GCode.getList();
			//point = point.multiply(constConvert);
			var i;			
			for (i = 0; i < vec_array.length; i++) {
				if (vec_array[i].distance(point) < 0.5)
					return i;	
			}
			return 0;
		},
		create: function(processedLine) {
			console.log(processedLine);
			this.renderOnAddRemove(false);
			vec_array = GCode.getList();	
			this.clear();
			var maxPoint = GCode.getMax().multiply(mm2px);
			constConvert = (maxPoint.x > maxPoint.y) ? maxPoint.x : maxPoint.y;
			constConvert = width / constConvert;
			maxPoint = maxPoint.multiply(constConvert);
			constConvert *= mm2px;
			
			
			tryDraw(constConvert, maxPoint, processedLine);
			
		},
		add: function(object) {
			if (canvas)
				canvas.add(object);
		},
		moveTo: function(object, index) {
			canvas.moveTo(object, index);
			object.moveTo(index);
		},
		insertAt: function(object, index) {
			canvas.insertAt(object, index);
		},
		removeSVG: function() {
			if (this.SVGobj != null)			
				canvas.remove(this.SVGobj);
			this.SVGobj = null;
		},
		setVisibleSVG: function(visible) {
			if (this.SVGobj != null) {
				this.SVGobj.setVisible(visible);
			}
		},
		addSVG: function(src, x, y, renderSVG) {
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
				obj.setVisible(renderSVG);
				_this.SVGobj = obj;				
				_this.insertAt(obj, 1);
			});
			
		},
		drawCircle: drawCircle,
		drawText:	drawText,
		drawLine:	drawLine,
		constConvert: function() {
			return constConvert;
		},
		render: function() {
			if (canvas)
				canvas.renderAll();
		},
		renderOnAddRemove: function(bool) {
			if (canvas)
				canvas.renderOnAddRemove = bool;
		},
		formatX: formatX,
		formatY: formatY
	}
}]);
