/* ==================================================================
 AngularJS Datatype Editor - Icon
 A directive to choose an icon from a list of many bootstrap icons
 Specify the allowed icons in ade.js

 Usage:
 <a ade-icon='{"id":"1234"}' ng-model="data" style="{{data}}"></a>

 Config:
 "id" will be used in messages broadcast to the app on state changes.

 Messages:
 name: ADE-start
 data: id from config

 name: ADE-finish
 data: {id from config, old value, new value}

 ------------------------------------------------------------------*/

angular.module('ADE').directive('adeIcon', ['ADE', '$compile', function(ADE, $compile) {


	var len = ADE.icons.length;
	var iconsPopupTemplate = '';

	if (len > 0) iconsPopupTemplate = '<a class="icon-_clear">clear</a>';
	for (var i = 0; i < len; i++) {
		iconsPopupTemplate += '<span class="icon-' + ADE.icons[i] + '"></span>';
	}

	return {
		require: '?ngModel', //optional dependency for ngModel
		restrict: 'A', //Attribute declaration eg: <div ade-icon=""></div>

		//The link step (after compile)
		link: function(scope, element, attrs, controller) {
			var options = {};
			var value = '';
			var oldValue = '';
			var editing = false;
			var exit = 0; //0=click, 1=tab, -1= shift tab, 2=return, -2=shift return, 3=esc. controls if you exited the field so you can focus the next field if appropriate
			var input = null; //a reference to the invisible input DOM object
			var timeout = null; //the timeout for when clicks cause a blur of the popup's invisible input

			if (controller !== null && controller !== undefined) {
				controller.$render = function() { //whenever the view needs to be updated
					oldValue = value = controller.$modelValue;
					if (value === undefined || value === null) value = '';
					return controller.$viewValue;
				};
			}

			var saveEdit = function(exited, newValue) {
				//we are saving, so cancel any delayed blur saves that we might get
				window.clearTimeout(timeout);

				oldValue = value;
				value = newValue || oldValue;
				exit = exited;

				if (exit !== 3) { //don't save value on esc
					controller.$setViewValue(value);
				}
				editing = false;
				scope.ADE_hidePopup();

				ADE.done(options, oldValue, value, exit);

				scope.$digest();
			};

			//handles clicks on the read version of the data
			element.bind('click', function(e) {
				e.preventDefault();
				e.stopPropagation();

				ADE.begin(options);

				var iconPopup = angular.element('.' + ADE.popupClass);
				var clickTarget = angular.element(e.target);
				var attrClass = clickTarget.attr('class');
				var elOffset;
				var posLeft;
				var posTop;

				if (angular.isDefined(attrClass) && attrClass.match('icon') && attrClass.match('icon').length && clickTarget.parent()[0] == element[0] && (!iconPopup || !iconPopup.length)) {   //don't popup a second one
					editing = true;
					elOffset = element.offset();
					posLeft = elOffset.left - 7;  // 7px = custom offset
					posTop = elOffset.top + element[0].offsetHeight;
					$compile('<div class="' + ADE.popupClass + ' dropdown-menu open" style="left:' + posLeft + 'px;top:' + posTop + 'px"><h4>Select an Icon</h4>' + iconsPopupTemplate + '<div class="ade-hidden"><input id="invisicon" type="text" /></div></div>')(scope).insertAfter(element);
					input = angular.element('#invisicon');
					
					var nextElement = element.next('.ade-popup');
					var clearNode = nextElement.find('.icon-_clear');
					var iconNode = nextElement.find('span');

					clearNode.bind('click', function() {
						saveEdit(0, '_clear');
					});

					//handles click on an icon
					angular.forEach(iconNode, function(el) {
						var node = angular.element(el);
						node.bind('click', function() {
							window.clearTimeout(timeout);
							var iconClass =  node.attr('class');

							if (iconClass.match('icon')) {
								var iconType = iconClass.substr(5);
								saveEdit(0, iconType);
							}
						});

					});

					input.focus();

					ADE.setupKeys(input, saveEdit);

					//handles blurs of the invisible input.  This is done to respond to clicks outside the popup
					input.bind('blur', function(e) {
						//We delay the closure of the popup to give the internal icons a chance to
						//fire their click handlers and change the value.
						timeout = window.setTimeout(function() {
							saveEdit(0);
						},500);
					});
				}
			});

			// Watches for changes to the element
			return attrs.$observe('adeIcon', function(settings) { //settings is the contents of the ade-icon="" string
				options = ADE.parseSettings(settings, {});
				return element; //TODO: not sure what to return here
			});

		}
	};
}]);
