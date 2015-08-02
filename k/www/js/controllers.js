angular.module('kLaserCutterControoler.controllers', [])

.controller('DashCtrl', ["$scope", "Config", "Socket", "Canvas", function($scope, Config, Socket, Canvas) {
		
	//Config.set('socket_host', 'http://w.b:90/');
	$scope.machine	= new Vec2(0, 0);
	$scope.work		= new Vec2(0, 0);
    $scope.unit		= "mm";
    
	Socket.connect('http://192.168.1.103:90/', $scope);
	Canvas.init('coordsCanvas');
}])

.controller('ChatsCtrl', function($scope, Chats) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
