通过前面一章对于 addEvent 库的介绍，它的兼容性超级棒，据说对于 IE4、5 都有很好的兼容性，这和 jQuery 的原理是一致的，而在 jQuery 中，有一个对象与其相对于，那就是 event。

上上章就已经说过了，这个 `jQuery.fn.on`这个函数最终是通过 `jQuery.event`对象的 add 方法来实现功能的，当然，方法不局限于 add，下面就要对这些方法进行详细的介绍。

## 关于 jQuery.event

这是一个在 jQuery 对象上的方法，它做了很多的优化事件，比如兼容性问题，存储优化问题。

```javascript
jQuery.event = {
  global = {},
  add: function(){...},
  remove: function(){...},
  dispatch: function(){...},
  handlers: function(){...},
  addProp: function(){...},
  fix: function(){...},
  special: function(){...}
}
```

## 参考

>[jQuery 2.0.3 源码分析 事件体系结构](http://www.cnblogs.com/aaronjs/p/3441320.html)

>[解密jQuery事件核心 - 绑定设计（一）](http://www.cnblogs.com/aaronjs/p/3444874.html)