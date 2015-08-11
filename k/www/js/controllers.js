angular.module('kLaserCutterControoler.controllers', [])

.controller('DashCtrl', ["$scope", "Config", "Socket", "Canvas", "$ionicPopup", "$filter", "$ionicPosition", function($scope, Config, Socket, Canvas, $ionicPopup, $filter, $ionicPosition) {
	var socket_host = Config.get('socket_host');
	$scope.$on('$ionicView.enter', function(e) {
		var new_host = Config.get('socket_host');
		if (new_host != socket_host) {
			var update = function() {
				Socket.disconnect()
				Socket.connect(new_host, $scope);
				socket_host = new_host;
			}
			console.log(Socket.isMachineRunning());
			if (Socket.isMachineRunning()) {
				var confirmPopup = $ionicPopup.confirm({
					title: $filter('translate')('ARE_YOU_SURE'),
					template: $filter('translate')('THE MACHINE IS RUNNING. ARE YOU SURE TO CHANGE TO THE NEW SOCKET ADDRESS?')
				});
				confirmPopup.then(function(res) {
					update();
				});
			} else
				update();
		}
	});
		
	//Config.set('socket_host', 'http://w.b:90/');
	$scope.machine	= new Vec2(0, 0);
	$scope.work		= new Vec2(0, 0);
    $scope.unit		= "mm";
    
    $scope.getConfig = Config.get;
	Socket.connect(socket_host, $scope);
	Canvas.init('coordsCanvas');
	
	console.log($ionicPosition.position($("#motherCanvas")));
}])

.controller('SettingsCtrl', ["$scope", "Config", function($scope, Config) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});
  
  
  $scope.configList = Config.getList();
  $scope.update = function(config) {
	Config.set(config.key, config.value)
  }
}])

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
