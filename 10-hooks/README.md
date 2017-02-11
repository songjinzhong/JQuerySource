hooks 在英语中的意思表示钩子或挂钩，在 jQuery 中也有 hooks 这么一个概念，它的功能在考虑到一些兼容性和其它特殊情况的条件下，优先考虑这些特殊情况，而后才去用普通的方法处理，这种说法还是比较形象的。

hooks 的使用非常用技术含量，可以支撑在原来的基础上扩展，而对于接口则无需改变，举个例子，像 `fn.css()` 这个函数我们都是非常熟悉的了，拿来就用，而不需要考虑浏览器的兼容性，这里的兼容性包括 border-radius 兼容，使用的时候不需要在前面加上 -webkit- 浏览器标识。而 css 函数的内部则是借助 `$.cssHooks()`来实现这种“钩子”的效果的，扩展的时候，也是在这个对象上进行扩展。

## 先来说说 attr 和 prop

不急着上来就谈 hooks，先来看看 hooks 涉及到的应用。一个典型的应用就是 `fn.attr` 和 `fn.prop`，

## 参考

>[jQuery 2.0.3 源码分析 钩子机制 - 属性操作](http://www.cnblogs.com/aaronjs/p/3387906.html)

>[jQuery Hooks](https://blog.rodneyrehm.de/archives/11-jQuery-Hooks.html)

>[jQuery.cssHooks](http://www.css88.com/jqapi-1.9/jQuery.cssHooks/)

>[jQuery.val](http://www.css88.com/jqapi-1.9/val/)

>[jQuery hooks源码学习](http://www.cnblogs.com/zzu-han/p/3164947.html)