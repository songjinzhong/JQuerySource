## jQuery 总体架构

首先，jQuery 是一个开发框架，它的火爆程度已经无法用言语来形容，当你随便打开一个网站，一半以上直接使用了 jQuery。或许，早几年，一个前端工程师，只要会写 jQuery，就可以无忧工作。虽说最近 react、vue 很火，但 jQuery 中许多精彩的方法和逻辑值得每一个前端人员学习。

和其众多的框架一样，总要把接口放到外面来调用，内部往往是一个闭包，避免环境变量的污染。

先来看看 jQuery 使用上的几大特点：

1. $('#id') 函数方式直接生成 jQuery 对象
2. $('#id').css().html().hide() 链式调用

关于链式调用，我想有点基础都很容易实现，函数结尾 return this 即可，主要来介绍一下无 new 实现创建对象。

### 无 new 函数实现

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
```

上面看似运行正常，但是问题出在 `jQuery().each() // error`，访问不到 each 函数。实际上，`new jQuery.prototype.init()` 返回到是谁的实例？是 init 这个函数的实例，所以 init 函数中的 this 就没了意义