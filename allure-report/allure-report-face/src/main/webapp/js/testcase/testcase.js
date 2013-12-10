/*global angular:true */
angular.module('allure.testcase', [])
    .provider('testcase', function($stateProvider) {
        function processResponse(response) {
            return response.data;
        }
        return {
            attachStates: function(baseState) {
                var viewName = 'testcase@'+baseState.split('.')[0],
                    state = {
                    url: '/:testcaseUid',
                    views: {},
                    data: {
                        baseState: baseState
                    },
                    resolve: {
                        testcase: function($http, $stateParams) {
                            return $http.get('data/'+$stateParams.testcaseUid+'-testcase.json').then(processResponse);
                        }
                    }

                };
                state.views[viewName] = {
                    templateUrl: 'templates/testcase/testcaseView.html',
                    controller: 'TestcaseCtrl'
                };
                $stateProvider.state(baseState+'.testcase', state)
                .state(baseState+'.testcase.expanded', {
                    url: '/expanded'
                })
                .state(baseState+'.testcase.attachment', {
                    url: '/:attachmentUid'
                })
                .state(baseState+'.testcase.attachment.expanded', {
                    url: '/expanded'
                })
            },
            $get: [function() {}]
        }
    })
    .controller('TestcaseCtrl', function($scope, $state, testcase, treeUtils) {
        function setAttachment(source) {
            var attachment;
            treeUtils.walkAround($scope.testcase, 'steps', function(item) {
                attachment = item.attachments.filter(function(attachment) {
                    return attachment.source === source;
                })[0];
                return !attachment;
            });
            //noinspection JSUnusedAssignment
            $scope.attachment = attachment;
        }
        var baseState = $state.current.data.baseState;
        $scope.testcase = testcase;
        $scope.isState = function(state) {
            return $state.is(baseState+'.'+state);
        };
        $scope.closeTestcase = function() {
            $state.go(baseState);
        };
        $scope.go = function(state) {
            $state.go(baseState+'.'+state);
        };
        $scope.setAttachment = function(attachmentUid) {
            $state.go(baseState+'.testcase.attachment', {attachmentUid: attachmentUid});
        };
        $scope.$on('$stateChangeSuccess', function(event, state, params) {
            delete $scope.attachment;
            if(params.attachmentUid) {
                setAttachment(params.attachmentUid);
            }
        });
    })
    .controller('StepCtrl', function($scope) {
        "use strict";
        $scope.expanded = false;
        $scope.hasContent = $scope.step.summary.steps > 0 || $scope.step.attachments.length > 0;
    })

    .controller('AttachmentPreviewCtrl', function ($scope, $http, $state) {
        "use strict";
        function fileGetContents(url) {
            //get raw file content without parsing
            $http.get(url, {transformResponse: []}).then(function(resonse) {
                $scope.attachText = resonse.data;
            });
        }
        $scope.getSourceUrl = function(attachment) {
            return 'data/'+attachment.source;
        };
        $scope.isExpanded = function() {
            return $state.is('home.testsuite.testcase.attachment.expanded');
        };
        $scope.toggleExpanded = function() {
            $state.go('home.testsuite.testcase.attachment'+
                ($scope.isExpanded() ? '' : '.expanded')
            );
        };
        //noinspection FallthroughInSwitchStatementJS
        switch ($scope.attachment.type) {
            case 'JPG':
            case 'PNG':
                $scope.type = "image";
            break;
            case 'TXT':
                $scope.type = "text";
                fileGetContents($scope.getSourceUrl($scope.attachment));
            break;
            case 'XML':
            case 'JSON':
                $scope.type = "code";
                fileGetContents($scope.getSourceUrl($scope.attachment));
            break;
        }
    });
