# ngNeteaseMusic
引入网易云音乐外链的angular模块

使用时引入`neteaseMusic`模块然后在模板中添加指令即可

下面是一个例子，`playList`是一个存储歌曲id的数组，`playConfig`是保存着配置信息的对象

```Html
<music-player ng-model="playList" play-config="playConfig"></music-player>
```

下面是`playConfig`的选项和含义：

```Javascript
{
	autoPlay: true, // 表示是否自动播放
    size: 'normal', // 表示正在播放歌曲的面板大小，normal表示标准大小，small表示小面板
    fold: false // 表示歌曲列表是否展开
}
```