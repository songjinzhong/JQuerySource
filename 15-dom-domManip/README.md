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

仔细观察一下，这几个函数都有一个特点，就是有关于 domManip 的参数 `domManip(this, arguments, callback)`，然后在 callback 函数里面通过原生 js 来实现：

```javascript
// 一个简单的
jQuery.fn.extend( {
  append: function(elem){
    this[0].appendChild(elem);
    return this;
  },
  prepend: function(elem){
    this[0].insertBefore(elem, this[0].firstChild);
    return this;
  },
  before: function(elem){
    if(this[0].parentNode){
      this[0].parentNode.insertBefore(elem, this[0]);
    }
    return this;
  },
  after: function(elem){
    if(this[0].parentNode){
      this[0].parentNode.insertBefore(elem, this[0],nextSibling);
    }
    return this;
  }
} );
```

我之前就跟同学讨论过一个问题，就是如何用原生的方法将字符串转换成 dom 对象，在 jQuery 里面直接`jQuery.parseHTML()`，原生的话，可以用下面的：

```javascript
function parseHtml(str){
  var div = document.createElement('div');
  if(typeof str == 'string'){
    div.innerHTML = str;
  }
  return div.children[0];
}
```

虽然很是抠脚，但也是一种方法。

## buildFragment 方法

其实在 jQuery 内部，或者说 `jQuery.parseHTML` 方法之内，使用的是另外一个方法来建立 str 到 elem 的转换，那就是 buildFragment 方法。这个方法用于建立文档碎片，你不要纠结这个方法在 jQuery 中出现几次，我明确的告诉你，它只在两个地方出现，分别是 domManip 函数里和 parseHTML 函数里。

在之前，有必要先了解一下 [createDocumentFragment](https://developer.mozilla.org/en-US/docs/Web/API/Document/createDocumentFragment)，文中有几句话说的很好：**DocumentFragments are DOM Nodes. They are never part of the main DOM tree. The usual use case is to create the document fragment, append elements to the document fragment and then append the document fragment to the DOM tree. **。它虽然也同样占内存，却比 `createElement` 方法好多了。

## 参考

>[解密jQuery内核 DOM操作的核心函数domManip](http://www.cnblogs.com/aaronjs/p/3508190.html)

>[解密jQuery内核 DOM操作的核心buildFragment](http://www.cnblogs.com/aaronjs/p/3510768.html)