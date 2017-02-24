眼看 jQuery 的源码就快到头了，后面还有几个重要的内容，包括 ajax 和动画操作，加油把它们看完，百度前端学院的新一批课程也开始了。[百度前端学院](http://ife.baidu.com/course/all)。

class 的的操作应该算是比较愉快的，因为内容不是很多，或者说，内容涉及到的原生操作不是很大，就一个 className 或 getAttribute，主要还是来看下它涉及到的一些兼容性操作。

## class 操作

先来说一个比较有趣的 class 操作，先把[链接](http://stackoverflow.com/questions/5041494/selecting-and-manipulating-css-pseudo-elements-such-as-before-and-after-usin)贴上。

js 有一个非常大的缺陷，就是无法控制伪元素的样式，比如 after 和 before，这样子会失去很多乐趣（同样也带来了很多乐趣）。上面的链接是 stackoverflow 的解答。

**1. class 方式**

通过事先定义 class 的方式来解决：

```
p:before {
  content: "c1"
}
p.click:before {
  content: "click"
}

// js
$("p").on("click", function(){
  $(this).toggleClass('click');
})
```

**2. 內联 style 方式**

这种方式不优雅，也是一种解决办法。

```javascript
var str = "click";
$('<style>p:before{content:"' + str + '""}</style>').appendTo('head');
```

**3. jQuery data-attr 来解决**

这种方式是依靠 content 的特性：

```
p:before {
  content: attr(data-click);
}

//js
var str = 'click';
$("p").on("click", function(){
  $(this).attr("data-click", str);
})
```

这种方式应该是动态改变。

jQuery 的应用还是挺广泛的。

## 参考

>[jQuery 2.0.3 源码分析 样式操作](http://www.cnblogs.com/aaronjs/p/3433358.html)

>[Selecting and manipulating CSS ..](http://stackoverflow.com/questions/5041494/selecting-and-manipulating-css-pseudo-elements-such-as-before-and-after-usin)