'use strict';

/**
 * @ngdoc component
 * @name mcp.component:app-download-url
 * @description
 * # app-download-url
 */
angular.module('mobileControlPanelApp').component('appDownloadUrl', {
  template: `<div class="app-download-url">
                <div class="url-controls" ng-hide=url>
                  <button ng-disabled="$ctrl.build.status.phase !== 'Complete'" ng-click="generateUrl()" class="btn btn-success btn-xs" type="button">Generate Download URL</button>
                  <div ng-show="$ctrl.build.status.phase === 'Complete'" class="help-block">Download URL will last 30 mins before expiring</div>
                </div>
                <div ng-hide=!url>
                  <label>Download URL: </label><a ng-if=url href="{{url}}">{{url}}</a>
                  <modal modal-class="'app-download'" class="btn-primary btn-xs" launch="'QR Code'" modal-open=modalOpen>
                    <p class="help-block" >Scan the QR code to install this build directly onto a device</p>
                    <qr-code content=url></qr-code>
                  </modal>
                </div>
              </div>`,
  bindings: {
    build: '<'
  },
  controller: [
    '$scope',
    'mcpApi',
    '$timeout',
    '$window',
    function($scope, mcpApi, $timeout, $window) {
      let storedValue = $window.localStorage.getItem(
        $scope.$ctrl.build.metadata.name
      );
      storedValue = JSON.parse(storedValue);
      let timeoutPromise = null;
      $scope.modalOpen = false;

      function timeoutFn(scope) {
        scope.url = '';
        scope.modalOpen = false;
        $window.localStorage.removeItem($scope.$ctrl.build.metadata.name);
      }

      let dateNow = Date.now();
      if (!storedValue || dateNow > storedValue.expires) {
        $window.localStorage.removeItem($scope.$ctrl.build.metadata.name);
        $scope.url = '';
      } else {
        timeoutPromise = $timeout(
          timeoutFn.bind(null, $scope),
          storedValue.expires - dateNow
        );
        $scope.url = storedValue.url;
      }

      $scope.generateUrl = function() {
        mcpApi
          .mobileAppDownloadUrl($scope.$ctrl.build.metadata.name)
          .then(res => {
            $scope.url = res.url;
            $window.localStorage.setItem(
              $scope.$ctrl.build.metadata.name,
              JSON.stringify(res)
            );
            timeoutPromise = $timeout(
              timeoutFn.bind(null, $scope),
              res.expires - Date.now()
            );
          });
      };

      $scope.$on('$destroy', () => {
        timeoutPromise && $timeout.cancel(timeoutPromise);
      });
    }
  ]
});
