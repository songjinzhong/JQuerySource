上一章谈到了 dom 的几个插入操作，虽然插入的方式多种多样，但只要在懂了原生方法等基础上，代码看起来都不是很复杂。比较有意思的一个函数就是 buildFragment 方法，用来将 html 字符串转换成 dom 碎片。本章来看一下 dom 的其它方法。

## html、text 方法

说到 elem 的操作，就必然要提一下 elem 的类型。[NodeType](https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nodeType)，一个节点的 `nodeType` 为 1 表示元素节点，为 3 表示 text 文字节点，为 9 表示 document，11 表示 documentFragment，就是上一章所说的文档碎片。大概知道这几个就可以了。

原生的 elem 方法包括 innerHTML，outerHTML，innerText，outerText，然而，在开始本章之前，一定要对这几个方法很常熟练才行。[解密jQuery内核 DOM操作方法（二）html,text,val](http://www.cnblogs.com/aaronjs/p/3520383.html)。

innerHTML 和 outerHTML 一个显著的差异性就是 outer 会把当前 elem 也一起算进去并获得 html 字符串，inner 不会。

innerText 和 outerText 获取时候没有显著差异，但是 set 情况下(设置)的时候，outer 会把当前 elem 也给删掉，使用还是要谨慎。

有时候因为浏览器的兼容问题，可以用 textContent 替代 innerText。

## access 函数源码

下面是`jQuery.fn.html` 和 text 的源码，看了之后肯定有话要说：

```javascript
jQuery.fn.extends( {
  html: function( value ) {
    return access( this, function( value ) {
      ... // callback 函数
    }, null, value, arguments.length )
  }),
  text: function( value ) {
    return access( this, function( value ) {
      ...// 回调函数
    }, null, value, arguments.length)
  })
} );
```

好吧，我承认，又是同样的套路，先交给 access 函数来处理，然后 callback 函数，我猜这个时候 callback 函数肯定是采用 call 方式使 this 绑定当前 elem。这个套路似曾相识，对，就是 domManip 函数。

其实 access 前面已经介绍了过了，不过还是值得来重现介绍一下。

像 html、text、css 这些函数的功能，都有一个特点，就是可以带参数，也可以不带参数，先用 access 函数对参数校正，执行回调。

```javascript
var access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
  var i = 0,
    len = elems.length,
    bulk = key == null;

  // key values 多种情况
  if ( jQuery.type( key ) === "object" ) {
    chainable = true;
    for ( i in key ) {
      access( elems, fn, i, key[ i ], true, emptyGet, raw );
    }

  // Sets 情况
  } else if ( value !== undefined ) {
    chainable = true;
    // value 为函数，不知道这是一种什么情况
    if ( !jQuery.isFunction( value ) ) {
      raw = true;
    }

    if ( bulk ) {

      // 执行回调
      if ( raw ) {
        fn.call( elems, value );
        fn = null;

      // ...except when executing function values
      } else {
        bulk = fn;
        fn = function( elem, key, value ) {
          return bulk.call( jQuery( elem ), value );
        };
      }
    }

    // css 走这一步
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
  // chainable 表示参数长度 0 或 1
  if ( chainable ) {
    return elems;
  }

  // Gets
  if ( bulk ) {
    return fn.call( elems );
  }

  return len ? fn( elems[ 0 ], key ) : emptyGet;
};
```

access 中出现了一种 value 为函数的情况，没有碰到过，暂不知道什么意思。access 函数基本没有做太大的变化处理看，看起来也不是很难。(哈哈，找到了，后面 css 操作的时候，key 可以为 object)

## fn.html 源码

现在就是主要来看这个回调函数了，当前的 this 使指向 jQuery 对象的，并没有指向单独的 elem 元素，html 肯定要进行判断：

```javascript
jQuery.fn.extends( {
  html: function( value ) {
    return access( this, function( value ) {
      var elem = this[ 0 ] || {},
        i = 0,
        l = this.length;
      // 参数为空的情况，get
      if ( value === undefined && elem.nodeType === 1 ) {
        return elem.innerHTML;
      }

      // set 操作
      if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
        !wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

        value = jQuery.htmlPrefilter( value );

        try {
          for ( ; i < l; i++ ) {
            elem = this[ i ] || {};

            // Remove element nodes and prevent memory leaks
            if ( elem.nodeType === 1 ) {

              // cleanData 是清除 dom 绑定 cache 的数据
              jQuery.cleanData( getAll( elem, false ) );
              elem.innerHTML = value;
            }
          }

          elem = 0;

        // If using innerHTML throws an exception, use the fallback method
        } catch ( e ) {}
      }

      if ( elem ) {
        this.empty().append( value );
      }
    }, null, value, arguments.length );
  }
} );
```

## fn.text 源码

下面是 text 源码，关于 html 和 text 在开头已经介绍了，算是比较基础的 dom 操作吧，直接来看源码吧：

```javascript
jQuery.fn.extends( {
  text: function( value ) {
    return access( this, function( value ) {
      // 前面已经说了，回调函数里的 this 指向 jQuery 对象
      return value === undefined ?
        // get
        jQuery.text( this ) :
        // set
        this.empty().each( function() {
          if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
            this.textContent = value;
          }
        } );
    }, null, value, arguments.length );
  }
} );
```

先来看看 set 的情况，这里有个 empty 函数，源码在下面，两个功能，先清空 dom 内容，在删除 data cache 中保存的数据。这里没有用 innerText 方法，而是使用 textContent 方法，貌似就 set 来说，textContent 兼容性更好。

```javascript
jQuery.fn.extends( {
  empty: function() {
    var elem,
      i = 0;

    for ( ; ( elem = this[ i ] ) != null; i++ ) {
      if ( elem.nodeType === 1 ) {

        // Prevent memory leaks
        jQuery.cleanData( getAll( elem, false ) );

        // 清空
        elem.textContent = "";
      }
    }

    return this;
  },
} );
```

set 的方法知道了，那么 get 呢？get 首先调用了 `jQuery.text` 方法，找了半天才找到它在哪里，原来调用的是 Sizzle 中的方法：

```javascript
jQuery.text = Sizzle.getText;

var getText = Sizzle.getText = function( elem ) {
  var node,
    ret = "",
    i = 0,
    nodeType = elem.nodeType;

  if ( !nodeType ) {
    // elem 是一个 dom 数组
    while ( (node = elem[i++]) ) {
      // 分步来搞
      ret += getText( node );
    }
  } else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
    // innerText usage removed for consistency of new lines (jQuery #11153)
    // 依然使用 textContent 方法
    if ( typeof elem.textContent === "string" ) {
      return elem.textContent;
    } else {
      // Traverse its children
      for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
        ret += getText( elem );
      }
    }
  // 3 (text)或 4 (4 貌似被移除)直接返回 nodeValue
  } else if ( nodeType === 3 || nodeType === 4 ) {
    return elem.nodeValue;
  }

  return ret;
};
```

## 总结

我自己在浏览器上面测试，发现 textContent 方法并不会把空白符给删了，而且 jQuery 的 text 方法也没有做过滤，每个浏览器的解析也不一样，就可能导致浏览器带来的差异，实际使用的时候，还是要小心点好，多长个心眼。

## 参考

>[Node.NodeType](https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nodeType)

>[解密jQuery内核 DOM操作方法（二）html,text,val](http://www.cnblogs.com/aaronjs/p/3520383.html)