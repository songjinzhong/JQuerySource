样式操作也是 jQuery 比较常用的一个操作，就我本人而言，这个 css 函数用多了，感觉自己有点傻乎乎的，主要还是自己不了解 js 中 css 的真正含义。

不过现在不怕了。

开始之前，先抛开 jQuery，我们来看看一个有趣的面试题（据说是一道微信面试题）。

## 一道很有深度的面试题

用原生的 js 获得一个 HTML 元素的 `background-color`，当然，这只是一个引入，为什么不是 color，为什么不是 font-size？

### css 渲染的优先级

写过 css 样式的同学都知道，css 是有优先级区分的，`!important`优先级最高，內联优先级其次，id，类和伪类，元素和伪元素。优先级会按照顺序依次比较，同一级别相同则看下一级别，优先级相同，后面会覆盖前面。

比如，就像理科生排成绩，规定 `总分 > 数学 > 语文 > 英语`，如果 A，B 两人总分一样，就看数学成绩谁高，数学成绩一样，就看语文成绩谁高，以此类推。

记得在一家公司实习的时候（初学者），那个时候修改网站的主页样式，由于找不到样式对应，就大量使用 `!important`，并把所有样式都写在样式标的最后，估计，后面接手的人要气炸吧。

问题来了，对于任意的一个 elem，DIV 也好，P 也好，都只会保留一个 style 样式表，一般可以通过 `getComputedStyle` 函数或 IE 的 currentStyle 参数活动（万恶的 IE，现在 jQuery 已经不支持低版本 IE，连淘宝都不支持 IE8 了）。**无论这个样式表是通过前面哪个优先级获得的，但它一定是唯一且只有一个。**而且它还是只读的属性，所以通过 JS 来改变样式，如果不能修改 css 文件的情况下，只能采用內联。

內联有两种，一种是在 elem 上添加一个 style 属性，还有一种是在 HTMl 新建一个 `<style>` 标签，很显然，第一种貌似更符合 js 的特性，因为找到那个 elem 并不困难，而且还有一个 `elem.style` 可以使用。

### js 获取元素样式

`elem.style` 并不是万能的，也有很大的局限性。一般的思路就是，先看看有没有內联，如果没有內联，就走一般流程。

**內联值和 getComputedStyle 的值会不一样吗**，我自己做过测试，在 chrome 下面，內联值和样式表 getComputedStyle 的值是一样的，而且，当內联值改变，样式表也会跟着改变，除非在 css 文件中有比內联优先级还高的 important，这个时候內联是不起作用的，只能通过样式表来获取。

```javascript
var dom = document.getElementById("test");
var styleList = getComputedStyle(dom);
styleList.color; // 'black'

dom.style.color = 'red';

// 会自动刷新的
styleList.color; // 'red'
```

当 `styleList.color` 不变的时候，就知道可能有 important 样式的存在，也可以作为判断 important 的一个标准。

样式表有 `font-size`，有人写成驼峰 `fontSize`，这可以理解，统一一下就好啦，关键是有一个**超级别扭**的地方，`elem.style` 采用的是驼峰写法，而 getComputedStyle 的样式表采用的是破折号的写法，既然这样，只能借助下面这两个函数来：

```javascript
// 驼峰-破折 都变成驼峰
function camel(str){
  return str.replace(/-(\w)/g, function(m0, m1){
    return m1.toUpperCase();
  })
}

// 驼峰-破折 都变成破折
function dashes(str){
  return str.replace(/[A-Z]/g, function(m0){
    return '-' + m0.toLowerCase();
  })
}
```

样式类型你随意，驼峰也好，破折号也好，我不 care。

## 参考

>[解密jQuery内核 样式操作](http://www.cnblogs.com/aaronjs/p/3559310.html)

>[CSS并不简单--一道微信面试题的实践](http://www.jianshu.com/p/64d5cabfab89)

>[微信面试题-获取元素的最终background-color](http://www.jianshu.com/p/e94b5779f998)