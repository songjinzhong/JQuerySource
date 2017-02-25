hooks 在英语中的意思表示钩子或挂钩，在 jQuery 中也有 hooks 这么一个概念，它的功能在考虑到一些兼容性和其它特殊情况的条件下，优先考虑这些特殊情况，而后才去用普通的方法处理，这种说法还是比较形象的。

hooks 的使用非常用技术含量，可以支撑在原来的基础上扩展，而对于接口则无需改变，举个例子，像 `fn.css()` 这个函数我们都是非常熟悉的了，拿来就用，而不需要考虑浏览器的兼容性，这里的兼容性包括 border-radius 兼容，使用的时候不需要在前面加上 -webkit- 浏览器标识。而 css 函数的内部则是借助 `$.cssHooks()`来实现这种“钩子”的效果的，扩展的时候，也是在这个对象上进行扩展。

## 先来说说 attr 和 prop

不急着上来就谈 hooks，先来看看 hooks 涉及到的应用。一个典型的应用就是 `fn.attr` 和 `fn.prop`，这两个原型函数的作用是用来给 jQuery 对象绑定元素的，如果不了解，可以参考这两个链接，[attr](http://www.css88.com/jqapi-1.9/attr/)，[prop](http://www.css88.com/jqapi-1.9/prop/)。

虽然它们都是添加属性，却是不同的方式，其中，attr 是把属性放到 html 中(实际上是 elem.attributes 属性)，而 prop 是把属性添加到 dom 对象上，可以通过 [.] 来读取。

那么什么叫做 html 中？就是我们常说的 `data-` 数据：

```javascript
var body = $('body');
body.attr('data-name','body');
// <body data-name="body"></body>
body.data('name'); //'body'
```

attr 方法是对应于 jQuery 中的方法，而内部是通过 setAttribute，getAttribute 这种低级 api 来实现的，而且在 dom 对象的 attributes 属性上是可以找到绑定值的，所以 attr 和 prop 是两种不同的方法。

这两个函数有四个功能，分别包括读取和设置，如果参数只有一个，表示读（如果参数是 Object 另外考虑），参数为两个，表示写。

当然，除此之外，还有 removeAttr 和 removeProp 方法，源码如下：

```javascript
jQuery.fn.extend({
  attr: function (name, value) {
    return access(this, jQuery.attr, name, value, arguments.length > 1);
  },
  removeAttr: function (name) {
    return this.each(function () {
      jQuery.removeAttr(this, name);
    });
  },
  prop: function (name, value) {
    return access(this, jQuery.prop, name, value, arguments.length > 1);
  },
  removeProp: function (name) {
    return this.each(function () {
      delete this[jQuery.propFix[name] || name];
    });
  }
})
```

### access 方法

先看 attr 和 prop，都是通过 `access` 函数，至少传入的参数不同，一个是 jQuery.attr，一个是 jQuery.prop。来看看 access：

```javascript
var access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
  var i = 0,
    len = elems.length,
    bulk = key == null;

  // 参数为对象，一次性设置多个值
  if ( jQuery.type( key ) === "object" ) {
    chainable = true;
    for ( i in key ) {
      access( elems, fn, i, key[ i ], true, emptyGet, raw );
    }

  // 设置一个值
  } else if ( value !== undefined ) {
    chainable = true;

    if ( !jQuery.isFunction( value ) ) {
      raw = true;
    }
    
    // key 为 null 的情况
    if ( bulk ) {

      if ( raw ) {
        fn.call( elems, value );
        fn = null;

      // value 为 function
      } else {
        bulk = fn;
        fn = function( elem, key, value ) {
          return bulk.call( jQuery( elem ), value );
        };
      }
    }

    // 函数执行在这里
    if ( fn ) {
      for ( ; i < len; i++ ) {
        fn(
          elems[ i ], key, raw ?
          value :
          value.call( elems[ i ], i, fn( elems[ i ], key ) )
        );
      }
    }
  }

  if ( chainable ) {
    // 写情况的返回值
    return elems;
  }

  // Gets
  if ( bulk ) {
    return fn.call( elems );
  }
  // 这个返回值是比较熟悉的，即 get
  return len ? fn( elems[ 0 ], key ) : emptyGet;
}
```

access 不是今天的重点，函数不是很难，源码读起来挺有意思。

### attr 和 prop 源码

来看看 jQuery.attr 和 jQuery.prop：

```javascript
jQuery.attr = function (elem, name, value) {
  var ret, hooks, nType = elem.nodeType;

  // 对于 text, comment 和 attribute nodes 不处理
  if (nType === 3 || nType === 8 || nType === 2) {
    return;
  }

  // 如果连这个函数都不支持，还是用 prop 方法吧
  if (typeof elem.getAttribute === "undefined") {
    return jQuery.prop(elem, name, value);
  }

  // 先处理 hooks，优先考虑非正常情况
  if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
    hooks = jQuery.attrHooks[name.toLowerCase()] || (jQuery.expr.match.bool.test(name) ? boolHook : undefined);
  }
  // value 为 underfined 的时候调用 remove
  if (value !== undefined) {
    if (value === null) {
      jQuery.removeAttr(elem, name);
      return;
    }
    // hooks.set
    if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined) {
      return ret;
    }
    // 非 hooks 情况，正常 set
    elem.setAttribute(name, value + "");
    return value;
  }
  // hooks.get
  if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
    return ret;
  }
  // 正常 get 方法
  ret = jQuery.find.attr(elem, name);

  // Non-existent attributes return null, we normalize to undefined
  return ret == null ? undefined : ret;
}
```

```javascript
jQuery.prop = function (elem, name, value) {
  var ret, hooks, nType = elem.nodeType;

  // Don't get/set properties on text, comment and attribute nodes
  if (nType === 3 || nType === 8 || nType === 2) {
    return;
  }

  if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
    // Fix name and attach hooks
    name = jQuery.propFix[name] || name;
    hooks = jQuery.propHooks[name];
  }

  if (value !== undefined) {
    if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined) {
      return ret;
    }

    return elem[name] = value;
  }

  if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
    return ret;
  }

  return elem[name];
}
```

可以看得出来，`jQuery.attr` 和 `jQuery.prop` 方法是真的非常像，但是如果你不懂 hooks，可能会有很不疑问，这个不急。可以总结出大致的处理流程：先判断 dom 类型，然后根据一些特殊情况，复制 hooks 参数，这里的特殊条件为 `(nType !== 1 || !jQuery.isXMLDoc(elem))`，接着对于 set 和 get 方法判断，通过 value 值是否为 underfined，如果 hooks 中有，用 hooks 中提供的方法，没有，就走正常流程。

## 初识 hooks

已经知道在哪里使用 hooks，那么 hooks 长什么样呢：

```javascript
jQuery.extend({
  attrHooks: {
    // attrHooks 兼容 type 的低版本浏览器的情况
    type: {
      set: function( elem, value ) {
        if ( !support.radioValue && value === "radio" &&
          jQuery.nodeName( elem, "input" ) ) {
          var val = elem.value;
          elem.setAttribute( "type", value );
          if ( val ) {
            elem.value = val;
          }
          return value;
        }
      }
    }
  },
  propHooks: {
    tabIndex: {
      get: function( elem ) {
        ...
      }
    }
  }
})
// jQuery 内部扩展
// 对于不支持 selected 的情况
if(!support.optSelected){
  jQuery.propHooks.selected = {
    get: function(){
      ...
    },
    set: function(){

    }
  }
}
```

在 attr 的 attrHooks 中，用来处理的特殊情况是 `name=type` 的情况，或许是这种情况，type 绑定不到 html 中。在 prop 的 propHooks 中，处理的特殊情况是 tabIndex，下面还扩展了一个 selected 方法，如果浏览器不支持 select，就建一个 hooks。

所以一个基本的 Hooks（jQuery 内部的）应该长这样：

```javascript
jQuery.extend({
  nameHooks: {
    get: function(){
      ...
    },
    set: function(){
      ...
    },
    other: function(){
      ...
    }
  }
})
```

get 和 set 是非必需的，这是因为 attr 和 prop 的特殊性造成的，在看一个例子 `jQuery.fn.val`，val 的介绍 [jQuery.val](http://www.css88.com/jqapi-1.9/val/)，val 也有一个 valHooks 与之对应：

```javascript
jQuery.extend({
  valHooks: {
    option: {
      get: function(){...}
    },
    select: {
      get: function(){...},
      set: function(){...}
    }
  }
})
```

valHooks 和之前略有不同，又多了一层，但基本思路是一致的。

## 外部扩展 Hooks

jQuery 内部的 hooks 功能是非常强大的，不过令人感觉欣慰的是可以在外部扩展。

比如有一个问题，我们之前解释 attr 的时候，知道它可以添加 html 的 attribute，但有一些固有的，比如 `class`，我们就是想在它上面添加，但又不能影响原有的 class 属性，可以这样来修改：

```javascript
jQuery.attrHooks.class = {
  // 这里的参数顺序后面两个是相反的
  set: function(elem, value){
    return $(elem).attr('class-sp', value);
  },
  get: function(elem){
    return $(elem).attr('class-sp');
  }
}

//测试
body.attr('class','test');
// <body class="body" class-sp="test"></body>
body.attr('class'); // 'test'
```

perfect！

## 总结

Hooks 讲这么多，应该就 ok 了。Hooks 算是 jQuery 中一个非常可以借鉴的用法，以前听到这个概念是非常恐惧的，当看了源码，弄懂原理之后，发现超级有意思。

仍然有不足，比如 jQuery 中一个非常有重量级的 `cssHooks` 就没有提到，还是脚踏实地吧。

## 参考

>[jQuery 2.0.3 源码分析 钩子机制 - 属性操作](http://www.cnblogs.com/aaronjs/p/3387906.html)

>[jQuery Hooks](https://blog.rodneyrehm.de/archives/11-jQuery-Hooks.html)

>[jQuery.cssHooks](http://www.css88.com/jqapi-1.9/jQuery.cssHooks/)

>[jQuery.val](http://www.css88.com/jqapi-1.9/val/)

>[jQuery hooks源码学习](http://www.cnblogs.com/zzu-han/p/3164947.html)