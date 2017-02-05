讲真，Sizzle 的源码真的太压抑了，以至于写 Sizzle 文章的这段时间里都非常的痛苦，刚开始觉得它还挺有意思的，越到后面越觉得代码很难读懂，烦。

寒假也过完了，在家里待了两周的时间，感觉不错，这期间学习的事情都抛在脑后，学得非常少，把 cctv 的《中国通史》系列节目给看完了，对于历史迷的我来说，也算是一种心安吧。

今天的主题不在时 Sizzle，停顿了两周，感觉清醒了很多，之前被 Sizzle 支配的痛苦已经消去大半，今天来介绍一下 jQuery 的 Callbacks 函数。

## Callbacks 的使用

jQuery 内部提供了很多基础功能的方法，比如 $.ajax()、$.each() 和 $.Callbacks()，这些方法既可以在内部进行使用，又可以被开发者拿到外部单独使用。

Callbacks 的支持的方法有几个主要的，add、fire、remove 和 disable，比如官方有一个例子：

```javascript
// 这两个作为 callback 函数
function fn1( value ) {
  console.log( value );
}
 
function fn2( value ) {
  fn1("fn2 says: " + value);
  return false;
}

// 调用 jQuery 的 Callbacks 生成 callbacks
var callbacks = $.Callbacks();
callbacks.add( fn1 );

callbacks.fire( "foo!" );
// 'foo!'
 
callbacks.add( fn2 );
 
callbacks.fire( "bar!" );
// 'bar!'
// 'fn2 says: bar!'
```

从基本 demo 可以看出，`$.Callbacks()` 函数生成了一个 callbacks 对象，这个对象的 `.add()` 方法是添加回调函数，而 `.fire()` 方法则是执行回调函数。

`.remove()` 方法是移除回调函数：

```javascript
var callbacks = $.Callbacks();
callbacks.add( fn1 );

callbacks.fire( "foo!" );
// 'foo!'
 
callbacks.add( fn2 );

callbacks.fire( "bar!" );
// 'bar!'
// 'fn2 says: bar!'

callbacks.remove( fn2 );

callbacks.fire( "foobar" );
// 'foobar'
```

`$.Callbacks()` 还支持几个参数，表示执行回调的几种效果，`$.Callbacks('once')`：

* once: 确保这个回调列表只执行（ .fire() ）一次(像一个递延 Deferred)
* memory: 保持以前的值，将添加到这个列表的后面的最新的值立即执行调用任何回调 (像一个递延 Deferred)
* unique: 确保一次只能添加一个回调(所以在列表中没有重复的回调)
* stopOnFalse: 当一个回调返回false 时中断调用

此方法还支持多个参数，比如`$.Callbacks('once memory')`，具体的使用请参考这个[链接](http://www.css88.com/jqapi-1.9/jQuery.Callbacks/#supported-flags)。

## Callbacks 的源码



## 参考

>[jQuery.Callbacks 中文文档](http://www.css88.com/jqapi-1.9/jQuery.Callbacks/)

>[jQuery 2.0.3 源码分析 回调对象 - Callbacks](http://www.cnblogs.com/aaronjs/p/3342344.html)