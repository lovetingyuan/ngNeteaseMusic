/**
 * tingyuan
 */
(function(ng) {
    'use strict';
    if (!ng) return;
    ng.module('neteaseMusic', [])
        .factory('styleService', ['$templateCache', '$q', function($templateCache, $q) {

            function parseViewsClassName(viewName, namespace) {
                var htmlStr = $templateCache.get(viewName);
                htmlStr && $templateCache.put(viewName, htmlStr.replace(/class="([\s\S]*?)"/g, function(v, group) {
                    group = group.split(' ');
                    var result = [];
                    angular.forEach(group, function(v) {
                        if (v.indexOf('@') === 0) { // @表示不处理该class
                            result.push('class="' + v.substr(1) + '"');
                        } else {
                            result.push('class="' + namespace + '-' + v + '"');
                        }
                    });
                    return result.join(' ');
                }));
            }

            function parseClassName(styleObj, namespace) {
                var temp, key, i;

                function getNewClassName(className, namespace) {
                    var result = [];
                    namespace = namespace ? (namespace + '-') : '';
                    angular.forEach(className.split('$'), function(v) {
                        result.push(namespace + v.replace(/[A-Z]/g, function(v) {
                            return '-' + v.toLowerCase();
                        }));
                    });
                    return namespace ? result : result[0];
                }
                for (key in styleObj) {
                    if (styleObj.hasOwnProperty(key)) {
                        temp = styleObj[key];
                        delete styleObj[key];
                        if (angular.isObject(temp)) {
                            angular.forEach(getNewClassName(key, namespace), function(v) {
                                styleObj[v] = angular.merge(temp, styleObj[v] || {});
                            });
                            parseClassName(temp, namespace);
                        } else {
                            styleObj[getNewClassName(key)] = temp;
                        }
                    }
                }
            }

            function getStyleStr(styleObj, namespace) {
                var result = [];

                function getOne(obj, pre) {
                    var re = pre + '{';
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            if (angular.isObject(obj[key])) {
                                result.push(getOne(obj[key], pre + ' .' + key))
                            } else {
                                re += (key + ':' + obj[key] + ';');
                            }
                        }
                    }
                    re += '}';
                    return re;
                }
                result.unshift(getOne(styleObj, '.' + namespace));
                return result.join('');
            }

            function appendStyleNode(styleStr, namespace) {
                var styleNode = document.getElementById(namespace);
                if (styleNode) {
                    styleNode.innerHTML += styleStr;
                } else {
                    styleNode = angular.element('<style type="text/css" id="' + namespace + '">' + styleStr + '</style>')[0];
                    document.getElementsByTagName('head')[0].appendChild(styleNode);
                }
            }
            return {
                setStyle: function(styleObj, namespace, viewName) {
                    parseViewsClassName(viewName, namespace);
                    parseClassName(styleObj, namespace);
                    appendStyleNode(getStyleStr(styleObj, namespace), namespace);
                }
            };
        }])

    .run(['$templateCache', '$sce', 'styleService', function($templateCache, $sce, styleService) {

            var namespace = 'netease-' + (+new Date) + (Math.random() + '').substr(2);
            $templateCache.put('player.html', ' \
        <div class="@' + namespace + '"> \
            <div>\
                <iframe ng-src={{other.firstItem}} ng-show="!!other.firstItem" class="main-iframe" ></iframe> \
                <div style="padding: 0 10px;" ng-show="other.showBar"> \
                    <ul class="option-bar">\
                        <li class="option-bar-title">\
                            <a ng-href="{{other.currentSong}}" target="_blank" \
                            ng-show="!other.addMode" style="text-decoration:none;">网易云音乐</a> \
                            <span style="color: red;" ng-show="other.isError">(刚刚的输入有误)</span> \
                            <span ng-show="other.isLoading">正在加载...</span> \
                            <input name="addSongInput" type="url" autofocus placeholder="请输入网易云音乐链接" ng-model="other.theAddSongLink" ng-show="other.addMode" class="option-bar-input"/> \
                        </li> \
                        <li ng-click="addSong()" title="添加歌曲" class="option-bar-btn">{{other.addMode ? \'&#10004;\' : \'&#10010;\'}}</li>\
                        <li ng-click="other.showList = !other.showList" class="option-bar-btn" title="{{other.showList ? \'收起列表\' : \'展开列表\'}}">&#8801;</li>\
                    </ul>\
                </div> \
            </div> \
            <div ng-show="other.showList" class="play-list"></div> \
        </div>');
            var playerHtmlStyle = {
                mainIframe: {
                    margin: 0,
                    padding: 0,
                    border: '0 none',
                    width: '100%',
                    marginBottom: '-12px'
                },
                optionBar: {
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    fontSize: '18px',
                    height: '25px',
                    lineHeight: '25px',
                    color: '#898989',
                    backgroundColor: 'white',
                    boxShadow: '0 0 10px #ccc',
                    borderRadius: '2px',
                    optionBarTitle: {
                        float: 'left',
                        marginLeft: '10px',
                        fontSize: '13px',
                        optionBarInput: {
                            height: '25px',
                            border: '0 none',
                            outline: 'none',
                            width: '95%'
                        }
                    },
                    optionBarBtn: {
                        float: 'right',
                        marginRight: '10px',
                        cursor: 'pointer'
                    }
                },
                playList: {
                    position: 'relative',
                    top: '-8px'
                }
            };

            $templateCache.put('song.item.html', '\
        <div class="item" ng-show="iframeReady">\
            <iframe ng-src="{{safeSongLink}}" class="item-frame"></iframe> \
            <div ng-click="deleteTheSong()" title="删除该歌曲"   \
                class="item-delete-btn">&#215;</div> \
            <div ng-click="setTheSong()" title="播放该歌曲"\
                class="item-play-btn">&#9835;</div> \
            <!-- <div style="position: absolute; background:white;height: 8px; left: 45px; right: 45px; top: 32px;"></div> -->  \
        </div> \
    ');
            var songItemHtmlStyle = {
                item: {
                    position: 'relative'
                },
                itemFrame: {
                    margin: 0,
                    padding: 0,
                    border: '0 none',
                    height: '52px',
                    width: '100%',
                    marginBottom: '-23px'
                },
                itemDeleteBtn$itemPlayBtn: {
                    position: 'absolute',
                    top: '10px',
                    width: '32px',
                    height: '32px',
                    lineHeight: '32px',
                    textAlign: 'center',
                    cursor: 'pointer'
                },
                itemDeleteBtn: {
                    right: '10px',
                    backgroundColor: 'white',
                    color: '#898989',
                    borderRadius: '0 2px 2px 0',
                    fontSize: '25px'
                },
                itemPlayBtn: {
                    left: '10px',
                    backgroundColor: '#f3f3f3',
                    color: '#ED1C24',
                    borderRadius: '2px 0 0 2px',
                    fontSize: '20px'
                }
            };
            styleService.setStyle(playerHtmlStyle, namespace, 'player.html');
            styleService.setStyle(songItemHtmlStyle, namespace, 'song.item.html');
        }])
        .run(function() {
            var JQLite = angular.element;
            JQLite.prototype.index = function(ele) {
                var children = this.parent().children();
                for (var i = 0, len = children.length; i < len; i++) {
                    if (children[i] === this[0]) {
                        return i;
                    }
                }
            };
            JQLite.prototype.swap = function(dest) {
                var parent = this.parent();
                if (typeof dest === 'number') {
                    dest = parent.children().eq(dest);
                }
                var destAfter = dest[0].nextSibling;
                parent[0].insertBefore(dest[0], this[0]);
                if (destAfter) {
                    parent[0].insertBefore(this[0], destAfter);
                } else {
                    parent.append(this);
                }
            };
        })
        .directive('musicItem', ['$templateCache', '$sce', function($templateCache, $sce) {
            'use strict';
            return {
                restrict: 'AE',
                replace: true,
                scope: {
                    songLink: '@',
                    deleteSong: '&',
                    setSong: '&'
                },
                template: $templateCache.get('song.item.html'),
                link: function(scope, element, attr) {
                    scope.safeSongLink = $sce.trustAsResourceUrl(attr.songLink);
                    var iframe = element.find('iframe')[0];
                    scope.$emit('iframeLoading');
                    iframe.onload = function() {
                        if (iframe.src) {
                            scope.iframeReady = true;
                            scope.$digest();
                            scope.$emit('iframeLoaded');
                        }
                    };
                    scope.setTheSong = function() {
                        scope.iframeReady = false;
                        scope.$emit('iframeLoading');
                        scope.setSong({ index: element.index() });
                    };
                    scope.deleteTheSong = function() {
                        scope.$broadcast('$destroy');
                        scope.deleteSong({ index: element.index() });
                    };
                }
            };
        }])
        .directive('musicPlayer', ['$templateCache', '$sce', '$timeout', '$compile', 'styleService', function($templateCache, $sce, $timeout, $compile, styleService) {
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
                    if (!ngModelCtrl) {
                        throw Error('directive musicPlayer need ng-model!');
                        return false;
                    }
                    var playListContainer = element.children('div').eq(1);
                    scope.$on('iframeLoading', function() {
                        scope.other.isLoading = true;
                    });
                    scope.$on('iframeLoaded', function() {
                        var list = playListContainer.children(),
                            allLoad = true;
                        for (var i = 0, len = list.length; i < len; i++) {
                            if (!list.eq(i).isolateScope().iframeReady) {
                                allLoad = false;
                                break;
                            }
                        }
                        scope.other.isLoading = !allLoad;
                        scope.$digest();
                    });

                    var playConfig = {
                        autoPlay: true,
                        size: 'normal',
                        fold: false
                    };
                    ng.extend(playConfig, scope.playConfig || {});

                    scope.other = {
                        showList: !playConfig.fold, // 是否展示歌曲列表
                        addMode: false, // 是否是添加歌曲的状态，此时输入框显示出来
                        showBar: true, // 是否显示当前的控制条
                        theAddSongLink: '', // 表示要添加的歌曲的链接
                        currentSong: '', // 当前播放的歌曲的id
                        firstItem: '', // 表示当前播放的歌曲的链接
                        isError: false, //表示用户输入的链接是否有错
                        isLoading: true // 表示列表中是否有iframe还在加载中
                    };
                    var firstRender = true,
                        changeFirst = false;
                    var compileItem = function(songLink) {
                        var content = $sce.trustAsHtml('<music-item song-link="' + songLink + '" delete-song="deleteSong(index)" set-song="setCurrentSong(index)" /> ');
                        playListContainer.append($compile($sce.getTrustedHtml(content))(scope));
                    };

                    ngModelCtrl.$render = function(i) {
                        var heightValue, autoPlayFlag, listLength, modelLength;
                        if (firstRender) {
                            ngModelCtrl.$modelValue.length && element.find('iframe').attr('height', (playConfig.size === 'small' ? 32 : 66) + 20);
                            // if (ngModelCtrl.$modelValue) {
                            //     .ready(function() {
                            //         scope.other.showBar = true;
                            //         scope.$digest();
                            //     });
                            // } else {
                            //     scope.other.showBar = true;
                            // }
                            // scope.other.showBar = true;
                            ng.forEach(ngModelCtrl.$viewValue, function(v) {
                                compileItem(v);
                            });
                            autoPlayFlag = playConfig.autoPlay ? 1 : 0;
                            heightValue = playConfig.size === 'small' ? 32 : 66;
                            scope.other.firstItem = ngModelCtrl.$modelValue[0] ? $sce.trustAsResourceUrl('http://music.163.com/outchain/player?type=2&id=' + ngModelCtrl.$modelValue[0] + '&auto=' + autoPlayFlag + '&height=' + heightValue) : '';
                        } else {
                            var list = playListContainer.children('div');
                            listLength = list.length;
                            modelLength = ngModelCtrl.$modelValue.length;
                            if (listLength === modelLength) {
                                // list.eq(0).swap(i);
                                console.log(i)
                                playListContainer.prepend(list.eq(i));
                                changeFirst = true;
                            } else if (listLength < modelLength) {
                                compileItem(ngModelCtrl.$viewValue[modelLength - 1]);
                                changeFirst = modelLength === 1;
                            } else {
                                list.eq(i).remove();
                                changeFirst = i === 0;
                            }
                            if (changeFirst) {
                                if (ngModelCtrl.$modelValue[0]) {
                                    scope.other.currentSong = 'http://music.163.com/#/song?id=' + ngModelCtrl.$modelValue[0];
                                } else {
                                    scope.other.currentSong = 'http://music.163.com/';
                                }
                                heightValue = playConfig.size === 'small' ? 32 : 66;
                                scope.other.firstItem = ngModelCtrl.$modelValue[0] ? $sce.trustAsResourceUrl('http://music.163.com/outchain/player?type=2&id=' + ngModelCtrl.$modelValue[0] + '&auto=1&height=' + heightValue) : '';
                            }
                        }
                        firstRender = false;
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
                                var playerSrc = getSrc(getSongId(scope.other.theAddSongLink));
                                scope.other.theAddSongLink = '';
                                ngModelCtrl.$viewValue.push(playerSrc);
                                ngModelCtrl.$setViewValue(ngModelCtrl.$viewValue.slice());
                                ngModelCtrl.$render(null);
                            } else {
                                scope.other.isError = true;
                                $timeout(function() {
                                    scope.other.isError = false;
                                }, 2000)
                            }
                            scope.other.addMode = false;
                        } else {
                            scope.other.isError = false;
                            scope.other.addMode = true;
                            element.find('input').val('');
                            setTimeout(function() {
                                element.find('input')[0].focus();
                            });
                        }
                        return scope;
                    };
                    scope.deleteSong = function(i) {
                        ngModelCtrl.$viewValue.splice(i, 1);
                        ngModelCtrl.$setViewValue(ngModelCtrl.$viewValue.slice());
                        ngModelCtrl.$render(i);
                    };
                    scope.setCurrentSong = function(i) {
                        var selectedSong = ngModelCtrl.$viewValue[i];
                        ngModelCtrl.$viewValue.splice(i, 1);
                        ngModelCtrl.$viewValue.unshift(selectedSong);
                        ngModelCtrl.$setViewValue(ngModelCtrl.$viewValue.slice());
                        ngModelCtrl.$render(i);
                    };
                }
            };
        }]);

})(angular);
