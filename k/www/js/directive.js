angular.module('kLaserCutterController.directive', [])
.directive('onLongPress', function($timeout) {
	return {
		restrict: 'A',
		link: function($scope, $elm, $attrs) {
			var touchStart = function(evt) {
				// Locally scoped variable that will keep track of the long press
				$scope.longPress = true;
				// We'll set a timeout for 600 ms for a long press
				$timeout(function() {
					if ($scope.longPress) {
						// If the touchend event hasn't fired,
						// apply the function given in on the element's on-long-press attribute
						$scope.$apply(function() {
							$scope.$eval($attrs.onLongPress)
						});
					}
				}, 600);
			};
			var mouseDown = function(evt) {
				// Locally scoped variable that will keep track of the long press
				$scope.longPress = true;
				// We'll set a timeout for 600 ms for a long press
				$timeout(function() {
					if ($scope.longPress) {
						// If the touchend event hasn't fired,
						// apply the function given in on the element's on-long-press attribute
						$scope.$eval($attrs.onLongPress)
					}
				}, 600);
			};
			var touchEnd = function(evt) {
				// Prevent the onLongPress event from firing
				$scope.longPress = false;
				// If there is an on-touch-end function attached to this element, apply it
				if ($attrs.onTouchEnd) {
					$scope.$apply(function() {
						$scope.$eval($attrs.onTouchEnd)
					});
				}
			}
			var mouseUp = function(evt) {
				$scope.longPress = false;
				if ($attrs.onTouchEnd)
					$scope.$eval($attrs.onTouchEnd);
			}
			$elm.bind('touchstart', touchStart);
			$elm.bind('mousedown', mouseDown);
			
			$elm.bind('touchend', touchEnd);
			$elm.bind('mouseup', mouseUp);
		}
	};
});