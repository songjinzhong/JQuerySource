前面一章，大概是一个总览，介绍了事件绑定的初衷和使用，通过了解，知道其内部是一个什么样的流程，从哪个函数到哪个函数。无论 jQuery 的源码简单或者复杂，有一点可以肯定，jQuery 致力于解决浏览器的兼容问题，最终是服务于使用者。

## 一些遗留问题

前面介绍 bind、delegate 和它们的 un 方法的时候，经提醒，忘记提到一些内容，却是我们经常使用的。比如 `$('body').click`，`$('body').mouseleave`等，它们是直接定义在原型上的函数，不知道怎么，就把它们给忽略了。

```javascript
jQuery.each( ( "blur focus focusin focusout resize scroll click dblclick " +
  "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
  "change select submit keydown keypress keyup contextmenu" ).split( " " ),
  function( i, name ) {

  // Handle event binding
  jQuery.fn[ name ] = function( data, fn ) {
    return arguments.length > 0 ?
      this.on( name, null, data, fn ) :
      this.trigger( name );
  };
} );
```

这个构造也是十分巧妙的，这些方法组成的字符串通过 `split(" ")` 变成数组，而后又通过 each 方法，在原型上对应每个名称，定义函数，这里可以看到，依旧是 on，还有 targger：

```javascript
jQuery.fn.extend( {
  trigger: function(type, data){
    return this.each(function (){
      // // 依旧是 event 对象上的方法
      jQuery.event.trigger(type, data, this);
    })
  }
} )
```

还缺少一个 one 方法：

```javascript
jQuery.fn.extend( {
  one: function( types, selector, data, fn ) {
    // 全局 on 函数
    return on( this, types, selector, data, fn, 1 );
  },
} );
```

## 参考

>[jQuery 2.0.3 源码分析 事件体系结构](http://www.cnblogs.com/aaronjs/p/3441320.html)