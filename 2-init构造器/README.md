## init 构造器

前面一讲[总体架构](https://github.com/songjinzhong/JQuerySource/tree/master/1-%E6%80%BB%E4%BD%93%E6%9E%B6%E6%9E%84)已经介绍了 jQuery 的基本情况，这一章主要来介绍 jQuery 的入口函数 `jQuery.fn.init`。

由于这个函数直接和 jQuery() 的参数有关，先来说下能接受什么样的参数。源码中接受 3 个参数：

```javascript
init: function (selector, context, root) {
  ...
}
```

`jQuery()`，空参数，这个会直接返回一个空的 jQuery 对象，`return this`。

`jQuery( selector [, context ] )`，这是一个标准且常用法，selector 表示一个 css 选择器，这个选择器通常是一个字符串，#id 或者 .class 等，context 表示选择范围，即限定作用，可为 DOM，jQuery 对象。

`jQuery( element|elements )`，用于将一个 DOM 对象或 DOM 数组封装成 jQuery 对象。

`jQuery( jQuery object|object )`，会把普通的对象或 jQuery 对象包装在 jQuery 对象中。

`jQuery( html [, ownerDocument ] )`，这个方法用于将 html 字符串先转成 DOM 对象后在生成 jQuery 对象。

`jQuery( html, attributes )`，和上一个方法一样，不过会将 attributes 中的方法和属性绑定到生成的 html DOM 中，比如 class 等。

`jQuery( callback )`，此方法接受一个回掉函数，相当于 window.onload 方法，只是相对于。