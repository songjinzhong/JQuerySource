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

## jQuery.fn.init

介绍完入口，就开始来看源码。

```javascript
init: function (selector, context, root) {
  var match, elem;

  // 处理: $(""), $(null), $(undefined), $(false)
  if (!selector) {
    return this;
  }
  // rootjQuery = jQuery( document );
  root = root || rootjQuery;

  // 处理 HTML 字符串情况，包括 $("<div>")、$("#id")、$(".class")
  if (typeof selector === "string") {
  //拆分 1，留在后面讲

  // HANDLE: $(DOMElement)
  } else if (selector.nodeType) {
    this[0] = selector;
    this.length = 1;
    return this;

  // HANDLE: $(function)
  } else if (jQuery.isFunction(selector)) {
    return root.ready !== undefined ? root.ready(selector) :

    // Execute immediately if ready is not present
    selector(jQuery);
  }

  return jQuery.makeArray(selector, this);
}
```

上面有几点需要注意，`root = root || rootjQuery;`，这个参数在前面介绍用法的时候，就没有提及，这个表示 document，默认的话是 rootjQuery，而 rootjQuery = jQuery( document )。

可以看出，对于处理 `$(DOMElement)`，直接是把 jQuery 当作一个数组，this[0] = DOMElement。其实，这要从 jQuery 的基本构造讲起，我们完成一个 `$('div.span')` 之后，然后一个 jQuery 对象（this），其中会得到一组（一个）DOM 对象，jQuery 会把这组 DOM 对象当作数组元素添加过来，并给一个 length。后面就像一些链式函数操作的时候，若只能对一个 DOM 操作，比如 width、height，就只对第一个元素操作，若可以对多个 DOM 操作，则会对所有 DOM 进行操作，比如 css()。

所以我们看到的处理 $(DOMElement) 时候，直接 return this。

`jQuery.makeArray` 是一个绑定 数组的函数，和上面的原理一样，后面会谈到。

在介绍下面的内容之前，先来介绍一个 jQuery 中一个识别 Html 字符串的正则表达式，

```javascript
var reg = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,

```

下面来看下重点的处理 HTMl 字符串的情况

```javascript
if (selector[0] === "<" && selector[selector.length - 1] === ">" && selector.length >= 3) {

  // Assume that strings that start and end with <> are HTML and skip the regex check
  match = [null, selector, null];

} else {
  match = rquickExpr.exec(selector);
}

// Match html or make sure no context is specified for #id
if (match && (match[1] || !context)) {

  // HANDLE: $(html) -> $(array)
  if (match[1]) {
    context = context instanceof jQuery ? context[0] : context;

    // Option to run scripts is true for back-compat
    // Intentionally let the error be thrown if parseHTML is not present
    jQuery.merge(this, jQuery.parseHTML(
    match[1], context && context.nodeType ? context.ownerDocument || context : document, true));

    // HANDLE: $(html, props)
    if (rsingleTag.test(match[1]) && jQuery.isPlainObject(context)) {
      for (match in context) {

        // Properties of context are called as methods if possible
        if (jQuery.isFunction(this[match])) {
          this[match](context[match]);

          // ...and otherwise set as attributes
        } else {
          this.attr(match, context[match]);
        }
      }
    }

    return this;

  // HANDLE: $(#id)
} else {
  elem = document.getElementById(match[2]);

  if (elem) {

    // Inject the element directly into the jQuery object
    this[0] = elem;
    this.length = 1;
  }
  return this;
}

  // HANDLE: $(expr, $(...))
} else if (!context || context.jquery) {
  return (context || root).find(selector);

  // HANDLE: $(expr, context)
  // (which is just equivalent to: $(context).find(expr)
} else {
  return this.constructor(context).find(selector);
}
```