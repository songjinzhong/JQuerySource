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

在放 jQuery 3.0 的源码之前，我们先来简单的模拟一下 Callbacks 函数，来实现其基本的功能：

```javascript
var Callbacks = function(){
  var Cb = {
    callbacks: [],
    add: function(fn){
      this.callbacks.push(fn);
      return this;
    },
    fire: function(value){
      this.callbacks.forEach(function(fn){
        fn(value);
      });
      return this;
    }  
  }
  return Cb;
}

// 测试
var callbacks = Callbacks();
callbacks.add(fn1);
callbacks.fire('test'); //'test'
```

可以看到其实一个简单的 Callbacks 函数实现起来还是非常简单的。

整个的 Callbacks 源码其实大致如下：

```javascript
jQuery.Callbacks = function(options){
  // 先对参数进行处理，比如 once、unique 等
  options = createOptions(options);

  // 参数定义，包括一些 flag 和 callbacks 数组
  var list = [], queue = [] ...

  // fire 是遍历数组，回掉函数的执行
  var fire = function(){
    ...
  }

  // self 是最终返回的对象
  var self = {
    add: function(){...},
    remove: function(){...},
    has: function(){...},
    disable: function(){...},
    fireWith: function(){...},//这个其实是 fire 函数的执行
    fire: function(){...}
    ...
  }
  return self;
}
```

因为前面已经简单的介绍过了如何实现一个基本的 Callbacks 函数，这里稍微清晰了一点，来看下 `createOptions` 函数，这个函数主要是对类似于 `$.Callbacks('once memory')`类型对 callback 进行 flag 分离：

```javascript
function createOptions(options) {
  var object = {};
  jQuery.each(options.match(rnothtmlwhite) || [], function (_, flag) {
    object[flag] = true;
  });
  return object;
}
```

其中 `rnothtmlwhite` 是一个正则表达式 `/[^\x20\t\r\n\f]+/g`，用来获得所有的 flag 标志。createOptions 的结果是一个对象，键值分别是 flag 和 boolean。

那么现在的主要的问题，就全在那些 flag 上面来，`once memory unique stopOnFalse`。

源码奉上：

```javascript
jQuery.Callbacks = function(options) {
  // flag 处理
  options = typeof options === "string" ? createOptions(options) : jQuery.extend({}, options);

  var // Flag to know if list is currently firing
  firing,
    // Last fire value for non-forgettable lists
    memory,
    // Flag to know if list was already fired
    fired,
    // Flag to prevent firing
    locked,
    // Actual callback list
    list = [],
    // Queue of execution data for repeatable lists
    queue = [],
    // Index of currently firing callback (modified by add/remove as needed)
    firingIndex = -1,
    // Fire callbacks
    fire = function() {
      // 只执行一次，以后都不执行了
      locked = locked || options.once;

      // Execute callbacks for all pending executions,
      // respecting firingIndex overrides and runtime changes
      fired = firing = true;
      for (; queue.length; firingIndex = -1) {
        memory = queue.shift();
        while (++firingIndex < list.length) {
          // 回调执行函数，并检查是否 stopOnFalse，并阻止继续运行
          if (list[firingIndex].apply(memory[0], memory[1]) === false && options.stopOnFalse) {
            // Jump to end and forget the data so .add doesn't re-fire
            firingIndex = list.length;
            memory = false;
          }
        }
      }

      // Forget the data if we're done with it
      if (!options.memory) {
        memory = false;
      }

      firing = false;

      // locked 在这里实现
      if (locked) {
        // 虽然锁住但是是 memory，保留 list 以后使用
        if (memory) {
          list = [];
          // 拜拜...
        } else {
          list = "";
        }
      }
    },
    // Actual Callbacks object
    self = {
      // Add a callback or a collection of callbacks to the list
      add: function() {
        if (list) {
          // If we have memory from a past run, we should fire after adding
          if (memory && !firing) {
            firingIndex = list.length - 1;
            queue.push(memory);
          }

          (function add(args) {
            jQuery.each(args, function(_, arg) {
              if (jQuery.isFunction(arg)) {
                if (!options.unique || !self.has(arg)) {
                  list.push(arg);
                }
              } else if (arg && arg.length && jQuery.type(arg) !== "string") {
                // Inspect recursively
                add(arg);
              }
            });
          })(arguments);

          if (memory && !firing) {
            fire();
          }
        }
        return this;
      },
      // Remove a callback from the list
      remove: function() {
        jQuery.each(arguments, function(_, arg) {
          var index;
          while ((index = jQuery.inArray(arg, list, index)) > -1) {
            list.splice(index, 1);

            // Handle firing indexes
            if (index <= firingIndex) {
              firingIndex--;
            }
          }
        });
        return this;
      },
      // Check if a given callback is in the list.
      // If no argument is given, return whether or not list has callbacks attached.
      has: function(fn) {
        return fn ? jQuery.inArray(fn, list) > -1 : list.length > 0;
      },
      // Remove all callbacks from the list
      empty: function() {
        if (list) {
          list = [];
        }
        return this;
      },
      // Disable .fire and .add
      // Abort any current/pending executions
      // Clear all callbacks and values
      disable: function() {
        locked = queue = [];
        list = memory = "";
        return this;
      },
      disabled: function() {
        return !list;
      },
      // Disable .fire
      // Also disable .add unless we have memory (since it would have no effect)
      // Abort any pending executions
      lock: function() {
        locked = queue = [];
        if (!memory && !firing) {
          list = memory = "";
        }
        return this;
      },
      locked: function() {
        return !!locked;
      },
      // Call all callbacks with the given context and arguments
      fireWith: function(context, args) {
        if (!locked) {
          args = args || [];
          args = [context, args.slice ? args.slice() : args];
          queue.push(args);
          if (!firing) {
            fire();
          }
        }
        return this;
      },
      // Call all the callbacks with the given arguments
      fire: function() {
        self.fireWith(this, arguments);
        return this;
      },
      // To know if the callbacks have already been called at least once
      fired: function() {
        return !!fired;
      }
    };

  return self;
};

```

总的来说，这种 pub/sub 模式的代码还是比较容易看懂的，有些疑问的地方，比如源码中其实有两个数组，list 是队列数组，本应该叫做 queue，但是 queue 数组已经被定义，且 queue 的作用是用来存储 fire 执行时的参数，这点不能搞混。

还有就是当整个代码 firing 这个参数，导致当函数正在运行的时候，即执行两次 fire 的时候，需要补充 queue 元素，但 `fire()` 函数只执行一次。

## 总结

jQuery.Callbacks 沿用 jQuery 一贯的套路，最后 `return self`，刚看第一遍第二遍的时候，有点模模糊糊的，主要还是 once、memory 等 flag 参数干扰我的视线，尤其是其这些 flag 标志的实现，难受。

## 参考

>[jQuery.Callbacks 中文文档](http://www.css88.com/jqapi-1.9/jQuery.Callbacks/)

>[jQuery 2.0.3 源码分析 回调对象 - Callbacks](http://www.cnblogs.com/aaronjs/p/3342344.html)