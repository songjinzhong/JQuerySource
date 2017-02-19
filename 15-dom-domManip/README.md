可能你会觉得这个名字很奇怪这个名字很奇怪，为什么叫做 domManip，即所谓的 dom 微操作。

其实在 jQuery 中有很多重要的 dom 操作，这些操作使用的频率都非常高，不过这些操作普遍有一个特点，就是需要进行微调，比如将字符串转换成 elem 元素，判断是否为 script 脚本。

所以 jQuery 内部一个统一的做法，就是采用 callbacks 的方式，先对要进行 dom 操作的内部函数执行 domManip 操作，然后回调执行任务。

## jQuery 内的一些 DOM 操作函数

jQuery 内有几个方法调用了 domManip 函数，他们分别如下：

```javascript
jQuery.fn.extend( {
  append: function() {
    return domManip( this, arguments, function( elem ) {
      if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
        var target = manipulationTarget( this, elem );
        target.appendChild( elem );
      }
    } );
  },

  prepend: function() {
    return domManip( this, arguments, function( elem ) {
      if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
        var target = manipulationTarget( this, elem );
        target.insertBefore( elem, target.firstChild );
      }
    } );
  },

  before: function() {
    return domManip( this, arguments, function( elem ) {
      if ( this.parentNode ) {
        this.parentNode.insertBefore( elem, this );
      }
    } );
  },

  after: function() {
    return domManip( this, arguments, function( elem ) {
      if ( this.parentNode ) {
        this.parentNode.insertBefore( elem, this.nextSibling );
      }
    } );
  }
} );
```

## 参考

>[解密jQuery内核 DOM操作的核心函数domManip](http://www.cnblogs.com/aaronjs/p/3508190.html)