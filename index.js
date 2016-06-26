/**
 * tingyuan
 */
(function(ng) {
    'use strict';
    if(!ng) return;
    ng.module('neteaseMusic', [])
        .service('styleService', ['$timeout', function($timeout) {
            var scopeMap = {};
            this.setScope = function(name, scope) {
                scopeMap[name] = scope;
            };
            this.setStyleObj = function(name, styleObjInfo) {
                if (ng.isFunction(styleObjInfo)) {
                    styleObjInfo = styleObjInfo();
                }
                $timeout(function() { // 延时是为了能先获取scope，才能将styleobj注入到scope中
                    var scope, styleObjName;

                    for (var scopeName in scopeMap) {
                        if (scopeMap.hasOwnProperty(scopeName) &&
                            new RegExp('^' + name + '\\d*$').test(scopeName)) { // 这里将ng-repeat生成的scope以名字加序号的形式加入进来
                            scope = scopeMap[scopeName];
                            if (scope) {
                                for (styleObjName in styleObjInfo) {
                                    if (styleObjInfo.hasOwnProperty(styleObjName)) {
                                        if (styleObjName in scope) {
                                            console.warn('name of styleobj has existed in the scope!');
                                        }
                                        scope[styleObjName] = styleObjInfo[styleObjName];
                                    }
                                }
                            }
                        }
                    }
                });
            };
        }])
        .run(['$templateCache', '$sce', 'styleService', function($templateCache, $sce, styleService) {
            $templateCache.put('player.html', ' \
            <div> \
                <div>\
                    <iframe ng-style="::mainIframeStyle" ng-src={{other.firstItem}} ng-show="!!other.firstItem" ></iframe> \
                    <div style="padding: 0 10px;" ng-show="other.showBar"> \
                        <ul ng-style="::optionBarStyle" >\
                            <li ng-style="::optionBarStyleOne">\
                                <a ng-href="{{other.currentSong}}" target="_blank" \
                                ng-show="!other.addMode" style="text-decoration:none;">网易云音乐</a> \
                                <input name="addSongInput" type="url" ng-pattern="/^http://music\\.163\\.com/#/song\\?id=\\d+$/" autofocus placeholder="请输入网易云音乐链接" ng-model="other.theAddSongLink" ng-show="other.addMode" ng-style="::optionBarInputStyle"/> \
                            </li> \
                            <li ng-click="addSong()" title="添加歌曲" ng-style="::optionBarStyleTwo">{{other.addMode ? \'✔\' : \'✚\'}}</li>\
                            <li ng-click="other.showList = !other.showList" title="{{other.showList ? \'收起列表\' : \'展开列表\'}}" ng-style="::optionBarStyleTwo">&equiv;</li>\
                        </ul>\
                    </div> \
                </div> \
                <div ng-show="other.showList" ng-style="playListStyle"> \
                    <music-item ng-repeat="song in other.playList track by $index"  \
                        song-link="song" delete-song="deleteSong({index: $index})"\
                        set-song="setCurrentSong({index: $index})" style="position:relative;" /> \
                </div> \
            </div> \
        ');
            styleService.setStyleObj('player.html', {
                mainIframeStyle: {
                    margin: 0,
                    padding: 0,
                    border: '0 none',
                    width: '100%',
                    marginBottom: '-12px'
                },
                optionBarStyle: {
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    fontSize: '18px',
                    height: '25px',
                    lineHeight: '25px',
                    color: '#898989',
                    backgroundColor: 'white',
                    boxShadow: '0 0 10px #ccc',
                    borderRadius: '2px'
                },
                optionBarInputStyle: {
                    height: '25px',
                    border: '0 none',
                    outline: 'none',
                    width: '95%'
                },
                optionBarStyleOne: {
                    float: 'left',
                    marginLeft: '10px',
                    fontSize: '13px'
                },
                optionBarStyleTwo: {
                    float: 'right',
                    marginRight: '10px',
                    cursor: 'pointer'
                },
                playListStyle: {
                    position: 'relative',
                    top: '-8px'
                }
            });


            $templateCache.put('song.item.html', '\
            <div>\
                <iframe ng-src="{{songLink}}" ng-style="::itemFrameStyle"></iframe> \
                <div ng-show="iframeReady"> \
                    <div ng-click="deleteSong()" title="删除该歌曲" \
                        ng-style="::itemDeleteBtnStyle">×</div> \
                    <div ng-click="setTheSong()" title="播放该歌曲" \
                        ng-style="::itemPlayBtnStyle">♫</div> \
                    <!-- <div style="position: absolute; background:white;height: 8px; left: 45px; right: 45px; top: 32px;"></div> -->  \
                </div> \
            </div> \
        ');
            styleService.setStyleObj('song.item.html', function() {
                var itemBtnStyle = {
                    position: 'absolute',
                    top: '10px',
                    width: '32px',
                    height: '32px',
                    lineHeight: '32px',
                    textAlign: 'center',
                    cursor: 'pointer'
                };
                return {
                    itemFrameStyle: {
                        margin: 0,
                        padding: 0,
                        border: '0 none',
                        height: '52px',
                        width: '100%',
                        marginBottom: '-23px'
                    },
                    itemDeleteBtnStyle: ng.extend({}, itemBtnStyle, {
                        right: '10px',
                        backgroundColor: 'white',
                        color: '#898989',
                        borderRadius: '0 2px 2px 0',
                        fontSize: '25px'
                    }),
                    itemPlayBtnStyle: ng.extend({}, itemBtnStyle, {
                        left: '10px',
                        backgroundColor: '#f3f3f3',
                        color: '#ED1C24',
                        borderRadius: '2px 0 0 2px',
                        fontSize: '20px'
                    })
                };
            });
        }])
        .directive('musicItem', ['$templateCache', 'styleService', function($templateCache, styleService) {
            'use strict';
            return {
                restrict: 'AE',
                replace: true,
                scope: {
                    songLink: '=',
                    deleteSong: '&',
                    setSong: '&'
                },
                template: $templateCache.get('song.item.html'),
                link: function(scope, element, attr) {
                    styleService.setScope('song.item.html' + scope.$parent.$index, scope);
                    var iframe = element.find('iframe')[0];
                    if ('onload' in iframe) {
                        iframe.onload = function() {
                            scope.iframeReady = true;
                            scope.$digest();
                        }
                    } else {
                        iframe.onreadystatechange = function() {
                            if (iframe.readyState === 'complete') {
                                scope.iframeReady = true;
                                scope.$digest();
                            }
                        }
                    }
                    scope.$on('setSong', function() {
                        if (scope.$parent.$index === 0) {
                            scope.iframeReady = false;
                        }
                    });
                    scope.setTheSong = function() {
                        if (scope.$parent.$index === 0) return;
                        scope.iframeReady = false;
                        scope.$emit('settingSong');
                        scope.setSong();
                    };
                }
            };
        }])
        .directive('musicPlayer', ['$templateCache', '$sce', 'styleService', function($templateCache, $sce, styleService) {
            'use strict';

            return {
                restrict: 'AE',
                replace: true,
                require: '?ngModel',
                scope: {
                    playConfig: '='
                },
                template: $templateCache.get('player.html'),
                link: function(scope, element, attr, ngModelCtrl) {
                    styleService.setScope('player.html', scope);
                    scope.$on('settingSong', function() {
                        scope.$broadcast('setSong');
                    });
                    var playConfig = {
                        autoPlay: true,
                        size: 'normal',
                        fold: false
                    };
                    ng.extend(playConfig, scope.playConfig || {});
                    var iframe = element.find('iframe')[0];
                    iframe.height = (playConfig.size === 'small' ? 32 : 66) + 20;
                    if ('onload' in iframe) {
                        iframe.onload = function() {
                            scope.other.showBar = true;
                            scope.$digest();
                        }
                    } else {
                        iframe.onreadystatechange = function() {
                            if (iframe.readyState === 'complete') {
                                scope.other.showBar = true;
                                scope.$digest();
                            }
                        }
                    }
                    scope.other = {
                        showList: !playConfig.fold, // 是否展示歌曲列表
                        playList: [], // 列表
                        addMode: false, // 是否是添加歌曲的状态，此时输入框显示出来
                        showBar: false, // 是否显示当前的控制条
                        theAddSongLink: '', // 表示要添加的歌曲的链接
                        currentSong: '', // 当前播放的歌曲的id
                        firstItem: '' // 表示当前播放的歌曲的链接
                    };

                    if (!ngModelCtrl) {
                        throw Error('directive musicPlayer has no ng-model!');
                        return false;
                    }
                    ngModelCtrl.$render = function() {
                        scope.other.playList.length = 0;
                        if (ngModelCtrl.$modelValue[0]) {
                            scope.other.currentSong = 'http://music.163.com/#/song?id=' + ngModelCtrl.$modelValue[0];
                        } else {
                            scope.other.currentSong = 'http://music.163.com/';
                        }

                        var autoPlayFlag = playConfig.autoPlay ? 1 : 0;
                        var heightValue = playConfig.size === 'small' ? 32 : 66;

                        scope.other.firstItem = ngModelCtrl.$modelValue[0] ? $sce.trustAsResourceUrl('http://music.163.com/outchain/player?type=2&id=' + ngModelCtrl.$modelValue[0] + '&auto=' + autoPlayFlag + '&height=' + heightValue) : '';
                        ng.forEach(ngModelCtrl.$viewValue, function(v) {
                            scope.other.playList.push($sce.trustAsResourceUrl(v));
                        });
                    };
                    ngModelCtrl.$formatters.push(function(modelValue) {
                        var srcList = [];
                        ng.forEach(modelValue, function(v) {
                            srcList.push(getSrc(v));
                        });
                        return srcList;
                    });
                    ngModelCtrl.$parsers.push(function(viewValue) {
                        var idList = [];
                        ng.forEach(viewValue, function(v) {
                            idList.push(getSongId(v));
                        });
                        return idList;
                    });

                    function getSongId(songLink) {
                        songLink = songLink.toString();
                        var temp = +songLink;
                        if (typeof temp === 'number' && temp === temp) {
                            return temp;
                        }
                        return songLink.match(/(?:id\=)(\d+)/g) ? +RegExp.$1 : null;
                    }

                    function getSrc(id) {
                        return 'http://music.163.com/outchain/player?type=2&id=' + id + '&auto=0&height=32';
                    }

                    element.find('input').on('keydown', function(e) {
                        if (e.keyCode === 13) {
                            scope.addSong().$digest();
                        }
                    });

                    scope.addSong = function() {
                        if (scope.other.addMode) {
                            if (scope.other.theAddSongLink) {
                                debugger
                                var playerSrc = getSrc(getSongId(scope.other.theAddSongLink));
                                scope.other.theAddSongLink = '';
                                ngModelCtrl.$viewValue.push(playerSrc);
                                ngModelCtrl.$setViewValue(ngModelCtrl.$viewValue.slice());
                                ngModelCtrl.$render();
                            }
                            scope.other.addMode = false;
                        } else {
                            scope.other.addMode = true;
                            element.find('input').val('');
                            setTimeout(function() {
                                element.find('input')[0].focus();
                            });
                        }
                        return scope;
                    };
                    scope.deleteSong = function(i) {
                        ngModelCtrl.$viewValue.splice(i.index, 1);
                        ngModelCtrl.$setViewValue(ngModelCtrl.$viewValue.slice());
                        ngModelCtrl.$render();
                    };
                    scope.setCurrentSong = function(i) {
                        i = i.index;
                        var selectedSong = ngModelCtrl.$viewValue[i];
                        ngModelCtrl.$viewValue[i] = ngModelCtrl.$viewValue[0];
                        ngModelCtrl.$viewValue[0] = selectedSong;
                        ngModelCtrl.$setViewValue(ngModelCtrl.$viewValue.slice());
                        ngModelCtrl.$render();
                    };
                }
            };
        }]);

})(angular);
