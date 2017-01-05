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

  //此部分拆分，留在后面讲

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

jQuery 大题思路如下，这是一个非常简单点实现：

```javascript
jQuery.prototype = {
  // 简单点，假设此时 selector 用 querySelectorAll
  init: function(selector){
    var ele = document.querySelectorAll(selector);
    // 把 this 当作数组，每一项都是 DOM 对象
    for(var i = 0; i < ele.length; i++){
      this[i] = ele[i];
    }
    this.length = ele.length;
    return this;
  },
  //css 若只有一个对象，则取其第一个 DOM 对象
  //若 css 有两个参数，则对每一个 DOM 对象都设置 css
  css : function(attr,val){
    for(var i = 0; i < this.length; i++){
      if(val == undefined){
        if(typeof attr === 'object'){
          for(var key in attr){
            this.css(key, attr[key]);
          }
        }else if(typeof attr === 'string'){
          return getComputedStyle(this[i])[attr];
        }
      }else{
        this[i].style[attr] = val;
      }
    }
  },
}
```

所以对于 DOMElement 的处理，直接将 DOM 赋值给数组后，return this。

`jQuery.makeArray` 是一个绑定 数组的函数，和上面的原理一样，后面会谈到。

在介绍下面的内容之前，先来介绍一个 jQuery 中一个识别 Html 字符串的正则表达式，

```javascript
var rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/;
rquickExpr.exec('<div>') //["<div>", "<div>", undefined]
rquickExpr.exec('<div></div>') //["<div></div>", "<div></div>", undefined]
rquickExpr.exec('#id') //["#id", undefined, "id"]
rquickExpr.exec('.class') //null
```

上面这一系列的正则表达式 exec，只是为了说明 `rquickExpr` 这个正则表达式执行后的结果，首先，如果匹配到，结果数组的长度是 3，如果匹配到 '<div>' 这种 html，数组的第三个元素是 underfined，如果匹配到 #id，数组的第二个元素是 underfined，如果匹配不到，则为 null。

另外还有一个正则表达式：

```javascript
var rsingleTag = ( /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i );
rsingleTag.test('<div></div>') //true
rsingleTag.test('<div ></div>') //true
rsingleTag.test('<div class="cl"></div>') //false
rsingleTag.test('<div></ddiv>') //false
```

这个正则表达式主要是对 html 的字符串进行验证，达到不出差错的效果。在这里不多介绍 exec 和正则表达式了。

下面来看下重点的处理 HTMl 字符串的情况：

```javascript
if (selector[0] === "<" && selector[selector.length - 1] === ">" && selector.length >= 3) {
  // 这个其实是强行构造了匹配 html 的情况的数组
  match = [null, selector, null];

} else {
  match = rquickExpr.exec(selector);
}

// macth[1] 限定了 html，!context 对 #id 处理
if (match && (match[1] || !context)) {

  // HANDLE: $(html) -> $(array)
  if (match[1]) {
    //排除 context 是 jQuery 对象情况
    context = context instanceof jQuery ? context[0] : context;

    // jQuery.merge 是专门针对 jQuery 合并数组的方法
    // jQuery.parseHTML 是针对 html 字符串转换成 DOM 对象
    jQuery.merge(this, jQuery.parseHTML(
    match[1], context && context.nodeType ? context.ownerDocument || context : document, true));

    // HANDLE: $(html, props)
    if (rsingleTag.test(match[1]) && jQuery.isPlainObject(context)) {
      for (match in context) {

        // 此时的 match 非彼时的 match
        if (jQuery.isFunction(this[match])) {
          this[match](context[match]);

          // ...and otherwise set as attributes
        } else {
          this.attr(match, context[match]);
        }
      }
    }

    return this;

  // 处理 match(1) 为 underfined 但 !context 的情况
  } else {
    elem = document.getElementById(match[2]);

  if (elem) {

    // this[0] 返回一个标准的 jQuery 对象
    this[0] = elem;
    this.length = 1;
  }
  return this;
}
// 处理一般的情况，find 实际上上 Sizzle，jQuery 已经将其包括进来，下章详细介绍
// jQuery.find() 为 jQuery 的选择器，性能良好
} else if (!context || context.jquery) {
  return (context || root).find(selector);
// 处理 !context 情况
} else {
  // 这里 constructor 其实是 指向 jQuery 的
  return this.constructor(context).find(selector);
}
```

关于 nodeType，这是 DOM 的一个属性，详情 [Node.nodeType MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nodeType)。nodeType 的值一般是一个数字，比如 1 表示 DOM，3 表示文字等，也可以用这个值是否存在来判断 DOM 元素，比如 context.nodeType。

整个 init 函数等构造逻辑，非常清晰，比如 `(selector, context, root)` 三个参数，分别表示选择的内容，可能存在的的限制对象或 Object，而 root 则默认的 jQuery(document)。依旧采用 jQuery 常用的方式，对每一个变量的处理都非常的谨慎。

如果仔细看上面两部分源代码，我自己也加了注释，应该可以把整个过程给弄懂。

find 函数实际上是 Sizzle，已经单独出来一个项目，被在 jQuery 中直接使用，将在下章介绍 jQuery 中的 Sizzle 选择器。通过源码，可以发现：

```javascript
jQuery.find = function Sizzle(){...}
jQuery.fn.find = function(selector){
  ...
  //引用 jQuery.find
  jQuery.find()
  ...
}
```

## 衍生的函数

init 函数仍然调用了不少 jQuery 或 jQuery.fn 的函数，下面来逐个分析。

### jQuery.merge

这个函数通过名字，就知道它是用来干什么的，合并。

```javascript
jQuery.merge = function (first, second) {
  var len = +second.length,
    j = 0,
    i = first.length;

  for (; j < len; j++) {
    first[i++] = second[j];
  }

  first.length = i;

  return first;
}
```

这样子就可以对类似于数组且有 length 参数的类型进行合并，我感觉主要还是为了方便对 jQuery 对象的合并，因为 jQuery 对象就是有 length 的。

### jQuery.parseHTML

这个函数也非常有意思，就是将一串 HTML 字符串转成 DOM 对象。

首先函数接受三个参数，第一个参数 data 即为 html 字符串，第二个参数是 document 对象，但要考虑到浏览器的兼容性，第三个参数 keepScripts 是为了删除节点里所有的 script tags，但在 parseHTML 里面没有体现，主要还是给 buildFragment 当作参数。总之返回的对象，是一个 DOM 数组或空数组。

```javascript
jQuery.parseHTML = function (data, context, keepScripts) {
  if (typeof data !== "string") {
    return [];
  }
  // 平移参数
  if (typeof context === "boolean") {
    keepScripts = context;
    context = false;
  }

  var base, parsed, scripts;

  if (!context) {

    // 下面这段话的意思就是在 context 缺失的情况下，建立一个 document 对象
    if (support.createHTMLDocument) {
      context = document.implementation.createHTMLDocument("");
      base = context.createElement("base");
      base.href = document.location.href;
      context.head.appendChild(base);
    } else {
      context = document;
    }
  }
  // 用来解析 parsed，比如对 "<div></div>" 的处理结果 parsed：["<div></div>", "div"]
  // parsed[1] = "div"
  parsed = rsingleTag.exec(data);
  scripts = !keepScripts && [];

  // Single tag
  if (parsed) {
    return [context.createElement(parsed[1])];
  }
  // 见下方解释
  parsed = buildFragment([data], context, scripts);

  if (scripts && scripts.length) {
    jQuery(scripts).remove();
  }

  return jQuery.merge([], parsed.childNodes);
}
```

`buildFragment` 函数主要是用来建立一个包含子节点的 fragment 对象，用于频发操作的添加删除节点。`parsed = buildFragment([data], context, scripts);`建立好一个 fragment 对象，用 parsed.childNodes 来获取这些 data 对应的 HTML。

### jQueyr.makeArray

jQuery 里面的函数调用，真的是一层接一层，虽然有时候光靠函数名，就能知道这函数的作用，但其中思考之逻辑还是挺参考意义的。

```javascript
jQuery.makeArray = function (arr, results) {
  var ret = results || [];

  if (arr != null) {
    if (isArrayLike(Object(arr))) {
        jQuery.merge(ret, typeof arr === "string" ? [arr] : arr);
    } else {
        push.call(ret, arr);
    }
  }

  return ret;
}
```

makeArray 把左边的数组或字符串并入到右边的数组或一个新数组，其中又简介的引用 jQuery.merge 函数。

接下来是着 isArrayLike 函数，可能需要考虑多方面的因素，比如兼容浏览器等，就有了下面这一长串：

```javascript
function isArrayLike(obj) {

  // Support: real iOS 8.2 only (not reproducible in simulator)
  // `in` check used to prevent JIT error (gh-2145)
  // hasOwn isn't used here due to false negatives
  // regarding Nodelist length in IE
  var length = !!obj && "length" in obj && obj.length,
      type = jQuery.type(obj);

  if (type === "function" || jQuery.isWindow(obj)) {
      return false;
  }

  return type === "array" || length === 0 || typeof length === "number" && length > 0 && (length - 1) in obj;
}
```

## 总结

这篇算是承上启下吧，介绍了 jQuery 中比较重要的入口函数，然后估计下章将会讲解 Sizzle，jQuery 中的选择器。

## 参考
>[jQuery 2.0.3 源码分析core - 选择器](http://www.cnblogs.com/aaronjs/p/3281911.html)

>[Node.nodeType](https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nodeType)

>[jQuery 3.0的buildFragment](http://www.cnblogs.com/snandy/p/5760742.html)