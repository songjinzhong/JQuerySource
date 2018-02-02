## jQuery 总体架构

首先，jQuery 是一个开发框架，它的火爆程度已经无法用言语来形容，当你随便打开一个网站，一半以上直接使用了 jQuery。或许，早几年，一个前端工程师，只要会写 jQuery，就可以无忧工作。虽说最近 react、vue 很火，但 jQuery 中许多精彩的方法和逻辑值得每一个前端人员学习。

和其众多的框架一样，总要把接口放到外面来调用，内部往往是一个闭包，避免环境变量的污染。

先来看看 jQuery 使用上的几大特点：

1. $('#id') 函数方式直接生成 jQuery 对象
2. $('#id').css().html().hide() 链式调用

关于链式调用，我想有点基础都很容易实现，函数结尾 return this 即可，主要来介绍一下无 new 实现创建对象。

## 无 new 函数实现

下面是一个普通的函数，很显然，会陷入死循环：

```javascript
var jQuery = function(){
  return new jQuery();
}
jQuery.prototype = {
  ...
}
```

这个死循环来的太突然，jQuery() 会创建一个 new jQuery，new jQuery 又会创建一个 new jQuery...

jQuery 用一个 init 函数来代替直接 new 函数名的方式，还要考虑到 jQuery 中分离作用域：

```javascript
var jQuery = function(){
  return new jQuery.prototype.init();
}
jQuery.prototype = {
  constructor: jQuery,
  init: function(){
    this.jquery = 1.0;
    return this;
  },
  jquery: 2.0,
  each: function(){
    console.log('each');
    return this;
  }
}
jQuery().jquery //1.0
jQuery.prototype.jquery //2.0

jQuery().each() // error
```

上面看似运行正常，但是问题出在 `jQuery().each() // error`，访问不到 each 函数。实际上，`new jQuery.prototype.init()` 返回到是谁的实例？是 init 这个函数的实例，所以 init 函数中的 this 就没了意义。

那么，如果：

```javascript
var jq = jQuery();
jq.__proto__ === jQuery.prototype;
jq.each === jQuery.prototype.each;
```

如果可以实现上面的 proto 的指向问题，原型函数调用问题就解决了，**但实际上**：

```javascript
var jq = jQuery();
jq.__proto__ === jQuery.prototype.init.prototype; //true
```

实际上，jq 的 proto 是指向 init 函数的原型，**所以**，我们可以把 `jQuery.prototype.init.prototype = jQuery.prototype`，这个时候，函数调用就顺理成章了，而且使用的都是引用，指向的都是同一个 prototype 对象，也不需要担心循环问题。实际上，jQuery 就是这么干的。

```javascript
var jQuery = function(){
  return new jQuery.prototype.init();
}
jQuery.prototype = {
  constructor: jQuery,
  init: function(){
    this.jquery = 1.0;
    return this;
  },
  jquery: 2.0,
  each: function(){
    console.log('each');
    return this;
  }
}
jQuery.prototype.init.prototype = jQuery.prototype;
jQuery().each() //'each'
```

## jQuery 内部结构图

在说内部图之前，先说下 `jQuery.fn`，它实际上是 prototype 的一个引用，指向 jQuery.prototype 的，

```javascript
var jQuery = function(){
  return new jQuery.prototype.init();
}
jQuery.fn = jQuery.prototype = {
  ...
}
```

那么为什么要用 fn 指向 prototype？我本人查阅了一些资料，貌似还是下面的回答比较中肯：简洁。你不觉得 fn 比 prototype 好写多了吗。

借用网上的一张图：

![jquery 内部结构图](http://ww1.sinaimg.cn/mw690/e3dde130gw1fb6m6ofr3aj20j60feabe.jpg)

从这张图中可以看出，window 对象上有两个公共的接口，分别是 $ 和 jQuery：

```javascript
window.jQuery = window.$ = jQuery;
```

`jQuery.extend` 方法是一个对象拷贝的方法，包括深拷贝，后面会详细讲解源码，暂时先放一边。

下面的关系可能会有些乱，但是仔细看了前面的介绍，应该能看懂。fn 就是 prototype，所以 jQuery 的 fn 和 prototype 属性指向 fn 对象，而 init 函数本身就是 jQuery.prototype 中的方法，且 init 函数的 prototype 原型指向 fn。

## 链式调用

链式调用的好处，就是写出来的代码非常简洁，而且代码返回的都是同一个对象，提高代码效率。

前面已经说了，在没有返回值的原型函数后面添加 return this：

```javascript
var jQuery = function(){
  return new jQuery.fn.init();
}
jQuery.fn = jQuery.prototype = {
  constructor: jQuery,
  init: function(){
    this.jquery = 3.0;
    return this;
  },
  each: function(){
    console.log('each');
    return this;
  }
}
jQuery.fn.init.prototype = jQuery.fn;
jQuery().each().each();
// 'each'
// 'each'
```

## extend 

jQuery 中一个重要的函数便是 extend，既可以对本身 jQuery 的属性和方法进行扩张，又可以对原型的属性和方法进行扩展。

先来说下 extend 函数的功能，大概有两种，如果参数只有一个 object，即表示将这个对象扩展到 jQuery 的命名空间中，也就是所谓的 jQuery 的扩展。如果函数接收了多个 object，则表示一种属性拷贝，将后面多个对象的属性全拷贝到第一个对象上，这其中，还包括深拷贝，即非引用拷贝，第一个参数如果是 true 则表示深拷贝。

```javascript
jQuery.extend(target);// jQuery 的扩展
jQuery.extend(target, obj1, obj2,..);//浅拷贝 
jQuery.extend(true, target, obj1, obj2,..);//深拷贝 
```

一下是 jQuery 3 之后的 extend 函数源码，自己做了注释：

```javascript
jQuery.extend = jQuery.fn.extend = function () {
  var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {},
    i = 1,
    length = arguments.length,
    deep = false;

  // 判断是否为深拷贝
  if (typeof target === "boolean") {
    deep = target;

    // 参数后移
    target = arguments[i] || {};
    i++;
  }

  // 处理 target 是字符串或奇怪的情况，isFunction(target) 可以判断 target 是否为函数
  if (typeof target !== "object" && !jQuery.isFunction(target)) {
    target = {};
  }

  // 判断是否 jQuery 的扩展
  if (i === length) {
    target = this; // this 做一个标记，可以指向 jQuery，也可以指向 jQuery.fn
    i--;
  }

  for (; i < length; i++) {

    // null/undefined 判断
    if ((options = arguments[i]) != null) {

      // 这里已经统一了，无论前面函数的参数怎样，现在的任务就是 target 是目标对象，options 是被拷贝对象
      for (name in options) {
        src = target[name];
        copy = options[name];

        // 防止死循环，跳过自身情况
        if (target === copy) {
          continue;
        }

        // 深拷贝，且被拷贝对象是 object 或 array
        // 这是深拷贝的重点
        if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
          // 说明被拷贝对象是数组
          if (copyIsArray) {
            copyIsArray = false;
            clone = src && Array.isArray(src) ? src : [];
          // 被拷贝对象是 object
          } else {
            clone = src && jQuery.isPlainObject(src) ? src : {};
          }

          // 递归拷贝子属性
          target[name] = jQuery.extend(deep, clone, copy);

          // 常规变量，直接 =
        } else if (copy !== undefined) {
            target[name] = copy;
        }
      }
    }
  }

  // Return the modified object
  return target;
}
```

extend 函数符合 jQuery 中的参数处理规范，算是比较标准的一个。jQuery 对于参数的处理很有一套，总是喜欢错位来使得每一个位置上的变量和它们的名字一样，各司其职。比如 target 是目标对象，如果第一个参数是 boolean 型的，就对 deep 赋值 target，并把 target 向后移一位；如果参数对象只有一个，即对 jQuery 的扩展，就令 target 赋值 this，当前指针 i 减一。

这种方法逻辑虽然很复杂，但是带来一个非常大的优势：后面的处理逻辑只需要一个就可以。target 就是我们要拷贝的目标，options 就是要拷贝的对象，逻辑又显得非常的清晰。

extend 函数还需要主要一点，`jQuery.extend = jQuery.fn.extend`，不仅 jQuery 对象又这个函数，连原型也有，那么如何区分对象是扩展到哪里了呢，又是如何实现的？

其实这一切都要借助与 javascript 中 this 的动态性，`target = this`，代码就放在那里，谁去执行，this 就会指向谁，就会在它的属性上扩展。

## 由 extend 衍生的函数

再看 extend 源码，里面有一些函数，只是看名字知道了它是干什么的，我专门挑出来，找到它们的源码。

### jQuery.isFunction 源码

```javascript
jQuery.isFunction = function (obj) {
    return jQuery.type(obj) === "function";
}
```

这也太简单了些。这里又要引出 jQuery 里一个重要的函数 `jQuery.type`，这个函数用于类型判断。

首先，为什么传统的 typeof 不用？因为不好用（此处应有一个哭脸）：

```javascript
// Numbers
typeof 37 === 'number';
typeof 3.14 === 'number';
typeof(42) === 'number';
typeof Math.LN2 === 'number';
typeof Infinity === 'number';
typeof NaN === 'number'; // Despite being "Not-A-Number"
typeof Number(1) === 'number'; // but never use this form!

// Strings
typeof "" === 'string';
typeof "bla" === 'string';
typeof (typeof 1) === 'string'; // typeof always returns a string
typeof String("abc") === 'string'; // but never use this form!

// Booleans
typeof true === 'boolean';
typeof false === 'boolean';
typeof Boolean(true) === 'boolean'; // but never use this form!

// Symbols
typeof Symbol() === 'symbol'
typeof Symbol('foo') === 'symbol'
typeof Symbol.iterator === 'symbol'

// Undefined
typeof undefined === 'undefined';
typeof declaredButUndefinedVariable === 'undefined';
typeof undeclaredVariable === 'undefined'; 

// Objects
typeof {a:1} === 'object';

// use Array.isArray or Object.prototype.toString.call
// to differentiate regular objects from arrays
typeof [1, 2, 4] === 'object';

typeof new Date() === 'object';

// The following is confusing. Don't use!
typeof new Boolean(true) === 'object'; 
typeof new Number(1) === 'object'; 
typeof new String("abc") === 'object';

// Functions
typeof function(){} === 'function';
typeof class C {} === 'function';
typeof Math.sin === 'function';

// This stands since the beginning of JavaScript
typeof null === 'object';
```

可以看得出来，对于一些 new 对象，比如 `new Number(1)`，也会返回 object。具体请参考[typeof MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof)。

网上有两种解决方法（有效性未经考证，请相信 jQuery 的方法），一种是用 `constructor.name`[Object.prototype.constructor MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/constructor)，一种是用 `Object.prototype.toString.call()`[Object.prototype.toString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString)，最终 jQuery 选择了后者。

```javascript
var n1 = 1;
n1.constructor.name;//"Number"
var n2 = new Number(1);
n2.constructor.name;//"Number"

var toString = Object.prototype.toString;
toString.call(n1);//"[object Number]"
toString.call(n2);//"[object Number]"
```

以上属于科普，原理不多阐述，接下来继续看源码 `jQuery.type`：

```javascript
// 这个对象是用来将 toString 函数返回的字符串转成
var class2type = {
    "[object Boolean]": "boolean",
    "[object Number]": "number",
    "[object String]": "string",
    "[object Function]": "function",
    "[object Array]": "array",
    "[object Date]": "date",
    "[object RegExp]": "regexp",
    "[object Object]": "object",
    "[object Error]": "error",
    "[object Symbol]": "symbol"
}
var toString = Object.prototype.toString;

jQuery.type = function (obj) {
    if (obj == null) {
        return obj + "";
    }
    return 
      typeof obj === "object" || typeof obj === "function" ? 
        class2type[toString.call(obj)] || "object" : 
        typeof obj;
}
```

因为 jQuery 用的是 toString 方法，所以需要有一个 class2type 的对象用来转换。

### jQuery.isPlainObject

这个函数用来判断对象是否是一个纯粹的对象，：

```javascript
var getProto = Object.getPrototypeOf;//获取父对象
var hasOwn = class2type.hasOwnProperty;
var fnToString = hasOwn.toString;
var ObjectFunctionString = fnToString.call( Object );

jQuery.isPlainObject = function (obj) {
    var proto, Ctor;

    // 排除 underfined、null 和非 object 情况
    if (!obj || toString.call(obj) !== "[object Object]") {
        return false;
    }

    proto = getProto(obj);

    // Objects with no prototype (e.g., `Object.create( null )`) are plain
    if (!proto) {
        return true;
    }

    // Objects with prototype are plain iff they were constructed by a global Object function
    Ctor = hasOwn.call(proto, "constructor") && proto.constructor;
    return typeof Ctor === "function" && fnToString.call(Ctor) === ObjectFunctionString;
}
```

看一下效果：

```javascript
jQuery.isPlainObject({});// true
jQuery.isPlainObject({ a: 1 });// true
jQuery.isPlainObject(new Object());// true

jQuery.isPlainObject([]);// false
jQuery.isPlainObject(new String('a'));// false
jQuery.isPlainObject(function(){});// false
```

除了这几个函数之外，还有个 `Array.isArray()`，这个真的不用介绍了吧。

## 总结

总结还是多说一点的好，现在已经基本理清 jQuery 内部的情况了？no，还差一点，看下面的代码：

```javascript
(function(window) {
  // jQuery 变量，用闭包避免环境污染
  var jQuery = (function() {
    var jQuery = function(selector, context) {
        return new jQuery.fn.init(selector, context, rootjQuery);
    };

    // 一些变量声明

    jQuery.fn = jQuery.prototype = {
        constructor: jQuery,
        init: function(selector, context, rootjQuery) {
          // 下章会重点讨论
        }

        // 原型方法
    };

    jQuery.fn.init.prototype = jQuery.fn;

    jQuery.extend = jQuery.fn.extend = function() {};//已介绍

    jQuery.extend({
        // 一堆静态属性和方法
        // 用 extend 绑定，而不是直接在 jQuery 上写
    });

    return jQuery;
  })();

  // 工具方法 Utilities
  // 回调函数列表 Callbacks Object
  // 异步队列 Defferred Object
  // 浏览器功能测试 Support
  // 数据缓存 Data
  // 队列 Queue
  // 属性操作 Attributes
  // 事件系统 Events
  // 选择器 Sizzle
  // DOM遍历 Traversing
  // 样式操作 CSS（计算样式、内联样式）
  // 异步请求 Ajax
  // 动画 Effects
  // 坐标 Offset、尺寸 Dimensions

  window.jQuery = window.$ = jQuery;
})(window);
```

可以看出 jQuery 很巧妙的整体布局思路，对于属性方法和原型方法等区分，防止变量污染等，都做的非常好。阅读框架源码只是开头，有趣的还在后面。

## 参考

>[jQuery 2.0.3 源码分析core - 整体架构](http://www.cnblogs.com/aaronjs/p/3278578.html)

>[《jQuery源码解析》读书笔记（第二章：构造jQuery对象）](http://www.cnblogs.com/yiyang/p/4959373.html)

>[jQuery.isPlainObject() 函数详解](http://www.365mini.com/page/jquery_isplainobject.htm)
