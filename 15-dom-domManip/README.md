可能你会觉得这个名字很奇怪这个名字很奇怪，为什么叫做 domManip，即所谓的 dom 微操作。

其实在 jQuery 中有很多重要的 dom 操作，这些操作使用的频率都非常高，不过这些操作普遍有一个特点，就是需要进行微调，比如将字符串转换成 elem 元素，判断是否为 script 脚本。

所以 jQuery 内部一个统一的做法，就是采用 callbacks 的方式，先对要进行 dom 操作的内部函数执行 domManip 操作，然后回调执行任务。

## jQuery 内的一些 DOM 操作函数

jQuery 内有几个方法调用了 domManip 函数，他们分别如下：

```javascript
jQuery.fn.extend( {
  // 在最后一个子元素后添加
  append: function() {
    return domManip( this, arguments, function( elem ) {
      if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
        var target = manipulationTarget( this, elem );
        target.appendChild( elem ); // 原生方法
      }
    } );
  },
  // 在第一个子元素前添加
  prepend: function() {
    return domManip( this, arguments, function( elem ) {
      if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
        var target = manipulationTarget( this, elem );
        target.insertBefore( elem, target.firstChild ); //  原生方法
      }
    } );
  },
  // 在当前节点前添加
  before: function() {
    return domManip( this, arguments, function( elem ) {
      if ( this.parentNode ) {
        this.parentNode.insertBefore( elem, this ); // 原生方法
      }
    } );
  },
  // 在当前节点后添加
  after: function() {
    return domManip( this, arguments, function( elem ) {
      if ( this.parentNode ) {
        this.parentNode.insertBefore( elem, this.nextSibling ); // 原生方法
      }
    } );
  },

  replaceWith: function() {
    var ignored = [];
    return domManip( this, arguments, function( elem ) {
      var parent = this.parentNode;

      if ( jQuery.inArray( this, ignored ) < 0 ) {
        jQuery.cleanData( getAll( this ) );
        if ( parent ) {
          parent.replaceChild( elem, this );
        }
      }
    }, ignored );
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

所以，当以后再碰到 create 无需渲染的 dom 的时候，要使用 `document.createDocumentFragment` 替代 `document.createElement`。

```javascript
function buildFragment( elems, context, scripts, selection, ignored ) {
  var elem, tmp, tag, wrap, contains, j,
    // context 一般为 document
    fragment = context.createDocumentFragment(),
    nodes = [],
    i = 0,
    l = elems.length;

  for ( ; i < l; i++ ) {
    elem = elems[ i ];

    if ( elem || elem === 0 ) {

      // Add nodes directly
      if ( jQuery.type( elem ) === "object" ) {

        // Support: Android <=4.0 only, PhantomJS 1 only
        // push.apply(_, arraylike) throws on ancient WebKit
        jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

      // 非 HTML 标签
      } else if ( !rhtml.test( elem ) ) {
        nodes.push( context.createTextNode( elem ) );

      // 将 str 转换成 html dom
      } else {
        tmp = tmp || fragment.appendChild( context.createElement( "div" ) );

        // 获得 标签 类型，处理特殊情况
        tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
        wrap = wrapMap[ tag ] || wrapMap._default;
        tmp.innerHTML = wrap[ 1 ] + jQuery.htmlPrefilter( elem ) + wrap[ 2 ];

        // 一般从 0 开始
        j = wrap[ 0 ];
        while ( j-- ) {
          tmp = tmp.lastChild;
        }

        // 在这里合并到 nodes 里面
        jQuery.merge( nodes, tmp.childNodes );

        // 返回 div
        tmp = fragment.firstChild;

        // 清空
        tmp.textContent = "";
      }
    }
  }

  // 清空 fragment
  fragment.textContent = "";

  i = 0;
  while ( ( elem = nodes[ i++ ] ) ) {

    // 跳过已经存在的 context
    if ( selection && jQuery.inArray( elem, selection ) > -1 ) {
      if ( ignored ) {
        ignored.push( elem );
      }
      continue;
    }

    contains = jQuery.contains( elem.ownerDocument, elem );

    // 添加到 fragment 内部，按照顺序，并获得 scripts
    tmp = getAll( fragment.appendChild( elem ), "script" );

    // Preserve script evaluation history
    if ( contains ) {
      setGlobalEval( tmp );
    }

    // Capture executables
    if ( scripts ) {
      j = 0;
      while ( ( elem = tmp[ j++ ] ) ) {
        if ( rscriptType.test( elem.type || "" ) ) {
          scripts.push( elem );
        }
      }
    }
  }

  return fragment;
}
```

最后的返回结果是 fragment，但它并不是我们想要的 dom，而真正的结果应该是：`fragment.childNodes`，一个 dom 伪数组。

## domManip 方法

其实本文的重点应该是 domManip 方法，不急，现在开始来讲。

前面已经介绍了五个基本的 domManip 用法，下面是几个扩展，也就是反过来用，也算是间接使用 domManip 吧：

```javascript
jQuery.each( {
  appendTo: "append",
  prependTo: "prepend",
  insertBefore: "before",
  insertAfter: "after",
  replaceAll: "replaceWith"
}, function( name, original ) {
  jQuery.fn[ name ] = function( selector ) {
    var elems,
      ret = [],
      // 新建一个 jQuery 对象
      insert = jQuery( selector ),
      last = insert.length - 1,
      i = 0;

    for ( ; i <= last; i++ ) {
      elems = i === last ? this : this.clone( true );
      jQuery( insert[ i ] )[ original ]( elems );

      // 将 elems 存入 ret
      push.apply( ret, elems.get() );
    }
    // 返回一个新的 jQuery 对象
    return this.pushStack( ret );
  };
} );
```

这又是五个方法，不过是和之前那五个方法刚好先反的逻辑，实用。

来看看 domManip 函数：

```javascript
function domManip( collection, args, callback, ignored ) {

  // var concat = [].concat; 用于将伪 args 转换成真是的数组
  args = concat.apply( [], args );

  var fragment, first, scripts, hasScripts, node, doc,
    i = 0,
    l = collection.length,
    iNoClone = l - 1,
    value = args[ 0 ],
    isFunction = jQuery.isFunction( value );

  // 处理 WebKit 中出 checked
  if ( isFunction ||
      ( l > 1 && typeof value === "string" &&
        !support.checkClone && rchecked.test( value ) ) ) {
    return collection.each( function( index ) {
      var self = collection.eq( index );
      if ( isFunction ) {
        args[ 0 ] = value.call( this, index, self.html() );
      }
      domManip( self, args, callback, ignored );
    } );
  }

  if ( l ) {
    // 调用 buildFragment
    fragment = buildFragment( args, collection[ 0 ].ownerDocument, false, collection, ignored );
    // 第一个 elem
    first = fragment.firstChild;

    if ( fragment.childNodes.length === 1 ) {
      fragment = first;
    }

    // Require either new content or an interest in ignored elements to invoke the callback
    if ( first || ignored ) {
      scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
      hasScripts = scripts.length;

      // Use the original fragment for the last item
      // instead of the first because it can end up
      // being emptied incorrectly in certain situations (#8070).
      for ( ; i < l; i++ ) {
        node = fragment;

        if ( i !== iNoClone ) {
          node = jQuery.clone( node, true, true );

          // 克隆 scripts
          if ( hasScripts ) {

            // Support: Android <=4.0 only, PhantomJS 1 only
            // push.apply(_, arraylike) throws on ancient WebKit
            jQuery.merge( scripts, getAll( node, "script" ) );
          }
        }
        // 回调，this 指向当前回调的 elem，这点很重要
        // 很重要
        callback.call( collection[ i ], node, i );
      }
      // 这个 scripts 到底有什么用，不懂
      if ( hasScripts ) {
        doc = scripts[ scripts.length - 1 ].ownerDocument;

        // Reenable scripts
        jQuery.map( scripts, restoreScript );

        // Evaluate executable scripts on first document insertion
        for ( i = 0; i < hasScripts; i++ ) {
          node = scripts[ i ];
          if ( rscriptType.test( node.type || "" ) &&
            !dataPriv.access( node, "globalEval" ) &&
            jQuery.contains( doc, node ) ) {

            if ( node.src ) {

              // Optional AJAX dependency, but won't run scripts if not present
              if ( jQuery._evalUrl ) {
                jQuery._evalUrl( node.src );
              }
            } else {
              DOMEval( node.textContent.replace( rcleanScript, "" ), doc );
            }
          }
        }
      }
    }
  }
  return collection;
}
```

在我看来，domManip 主要的几个功能包括：接受 HTML 字符串，并生成相对于的 dom，callback 回调函数，处理 dom，而且回调函数中的 this 是指向当前操作的 dom 的。剩下的事情，就交给回调函数去处理。

所以，domManip 的作用远比想象的要少。

## 参考

>[解密jQuery内核 DOM操作的核心函数domManip](http://www.cnblogs.com/aaronjs/p/3508190.html)

>[解密jQuery内核 DOM操作的核心buildFragment](http://www.cnblogs.com/aaronjs/p/3510768.html)