不打算介绍 deferred，或者放到后面以后去介绍，因为我对于 js 的异步存在着恐惧，看了半天代码，发现，用挺好用的，一看源码，全傻眼了。

## 数据缓存

jQuery 最初以便捷 DOM 操作而流行，而 DOM 的本质其实就是对象，开发者们又习惯性的将一些标志直接扔给 DOM 本事，这会带来内存泄漏的问题。

比如对于斐波那契数列，有人说用递归，用迭代，如果用 js 来写的话有一个比较有意思的方法，就是用缓存来实现：

```javascript
function fib(n){
  if(n == 1 || n == 0)
    return n;
  if(!fib[n-1]){
    fib[n-1] = fib(n-1);
  }
  if(!fib[n-2]){
    fib[n-2] = fib(n-2);
  }
  return fib[n-1] + fib[n-2];
}
```

因为 fib 不仅是函数，而且是对象，所以才有了这种缓存的解决办法，这就是前面所说的，不过是在 DOM 上实现的。

当然这种方法也会有弊端，造成内存泄漏。现代的浏览器有自动回收内存的机制，但当出现循环引用或闭包的时候，就会产生内存泄漏问题。

就不深入去讨论了。

## jQuery 的缓存机制

来看看 jQuery 中提高的数据缓存机制，有两个函数，分别是 `jQuery.data()`和 `jQuery.fn.data()`，可以看出来，一个是在 jQuery 对象上，一个是在 jQuery 生成的对象上。

`jQuery.data()` 有两种使用，一个用于绑定，一个用于查询：

1. jQuery.data( element, key, value )
2. jQuery.data( element, key )

上面的 `element` 参数表示 DOM 元素，比如一个例子如下：

```javascript
jQuery.data(document.body, 'foo', 52);
jQuery.data(document.body, 'bar', 'test');
jQuery.data(document.body, 'foo'); // 52
jQuery.data(document.body, 'bar'); // "test"
```

还有 `.data()` 方法，[.data()](http://www.css88.com/jqapi-1.9/data/)，这个函数就直接在 jquery 对象上实行绑定 data：

```javascript
$("body").data("foo", 52);
$("body").data("bar", { myType: "test", count: 40 });
$("body").data({ baz: [ 1, 2, 3 ] });
 
$("body").data("foo"); // 52
$("body").data(); // { foo: 52, bar: { myType: "test", count: 40 }, baz: [ 1, 2, 3 ] }
```

这边有一个小细节[数据缓存接口](http://www.cnblogs.com/aaronjs/p/3370176.html)：

```javascript
var jq1 = $("body");
var jq2 = $("body");

jq1.data('a', 1);
jq2.data('a', 2);

jq1.data('a'); //2
jq2.data('a'); //2

$.data(jq1, 'b', 3);
$.data(jq2, 'b', 4);

$.data(jq1, 'b'); //3
$.data(jq2, 'b'); //4
```

可以看出来，通过这两种方法绑定的数据，其实是不一样的，前者会被覆盖，而后者不会，说明在 cache 中肯定有某种神秘的力量将他们区别开来。

## 源码

在 jQuery 中的源码，大致是这样的结构：

```javascript
function Data(){...}
Data.prototype = {
  cache: function(){...},
  set: function(){...},
  get: function(){...},
  access: function(){...},
  remove: function(){...},
  hasData: function(){...}
}

var dataUser = new Data();

jQuery.extend({
  data: function( elem, name, data ) {
    return dataUser.access( elem, name, data );
  },
  hasData: function( elem ) {
    return dataUser.hasData( elem ) || dataPriv.hasData( elem );
  },
  removeData: function( elem, name ) {
    dataUser.remove( elem, name );
  }
})

jQuery.fn.extend({
  data: function(){
    ...
    dataUser...
    ...
  },
  removeData: function(){...}
})
```

由于之前已经弄懂 jQuery 内部结构，对于这个一点也不惊讶，在 jQuery 和 jQuery 的原型上分别有一个 data 函数，用来出来各自的情况。

## 参考

>[jQuery 2.0.3 源码分析 数据缓存](http://www.cnblogs.com/aaronjs/p/3370176.html)

>[jQuery.data()](http://www.css88.com/jqapi-1.9/jQuery.data/)