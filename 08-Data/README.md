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

既然已经知道了 data 的基本结构，我们来各个击破，先来看一下 `function Data()`：

```javascript
function Data() {
  // jQuery.expando 是 jQuery 的标识
  this.expando = jQuery.expando + Data.uid++;
}

Data.uid = 1;

jQuery.expando = ('3.1.1' + Math.random()).replace( /\D/g, "" )
// "3.1.10.9610206515567563".replace( /\D/g, "" )
// "31109610206515567563"
```

接着是 `prototype`：

```javascript
Data.prototype = {
  // 建立一个 cache
  cache: function( owner ) {
    // Check if the owner object already has a cache
    var value = owner[ this.expando ];

    // If not, create one
    if ( !value ) {
      value = {};

      // We can accept data for non-element nodes in modern browsers,
      // but we should not, see #8335.
      // Always return an empty object.
      if ( acceptData( owner ) ) {

        // 判断 owner 是一个合格者后
        if ( owner.nodeType ) {
          owner[ this.expando ] = value;

        // Otherwise secure it in a non-enumerable property
        // configurable must be true to allow the property to be
        // deleted when data is removed
        } else {
          Object.defineProperty( owner, this.expando, {
            value: value,
            configurable: true
          } );
        }
      }
    }

    return value;
  },
  // set 函数就是为 dom 设置 key，value
  set: function( owner, data, value ) {
    var prop,
      cache = this.cache( owner );

    if ( typeof data === "string" ) {
      cache[ jQuery.camelCase( data ) ] = value;

    // 处理 data 为这种情况: [ owner, { properties } ]
    } else {
      // Copy the properties one-by-one to the cache object
      for ( prop in data ) {
        cache[ jQuery.camelCase( prop ) ] = data[ prop ];
      }
    }
    return cache;
  },
  get: function( owner, key ) {
    return key === undefined ?
      this.cache( owner ) :

      // Always use camelCase key (gh-2257)
      owner[ this.expando ] && owner[ this.expando ][ jQuery.camelCase( key ) ];
  },
  // 用来访问，将 get、set 结合到一起，并对 underfined 判断
  access: function( owner, key, value ) {
    if ( key === undefined ||
        ( ( key && typeof key === "string" ) && value === undefined ) ) {

      return this.get( owner, key );
    }
    this.set( owner, key, value );
    return value !== undefined ? value : key;
  },
  // 用于移除 cache
  remove: function( owner, key ) {
    var i,
      cache = owner[ this.expando ];

    if ( cache === undefined ) {
      return;
    }

    if ( key !== undefined ) {

      // 支持删除数组格式的 key
      if ( jQuery.isArray( key ) ) {
        key = key.map( jQuery.camelCase );
      } else {
        key = jQuery.camelCase( key );
        // 为了保持一致，强行的构造了一个 数组
        key = key in cache ?
          [ key ] :
          ( key.match( rnothtmlwhite ) || [] );
      }
      i = key.length;
      // 删
      while ( i-- ) {
        delete cache[ key[ i ] ];
      }
    }
    // cache 为空的时候，删除整个缓存
    if ( key === undefined || jQuery.isEmptyObject( cache ) ) {
      if ( owner.nodeType ) {
        owner[ this.expando ] = undefined;
      } else {
        delete owner[ this.expando ];
      }
    }
  },
  hasData: function( owner ) {
    var cache = owner[ this.expando ];
    return cache !== undefined && !jQuery.isEmptyObject( cache );
  }
};
```

然后是 `jQuery.data()`：

```javascript
var dataPriv = new Data();
var dataUser = new Data();

jQuery.extend( {
  hasData: function( elem ) {
    return dataUser.hasData( elem ) || dataPriv.hasData( elem );
  },

  data: function( elem, name, data ) {
    return dataUser.access( elem, name, data );
  },

  removeData: function( elem, name ) {
    dataUser.remove( elem, name );
  },

  // TODO: Now that all calls to _data and _removeData have been replaced
  // with direct calls to dataPriv methods, these can be deprecated.
  _data: function( elem, name, data ) {
    return dataPriv.access( elem, name, data );
  },

  _removeData: function( elem, name ) {
    dataPriv.remove( elem, name );
  }
} );
```

源码里面有 dataPriv 和 dataUser，作者做了一个 TODO 标记，

接着是 `jQuery.fn.data()`：

```javascript
jQuery.fn.extend( {
  data: function( key, value ) {
    var i, name, data,
      // 将第一个 dom 赋给 elem
      elem = this[ 0 ],
      attrs = elem && elem.attributes;

    // key 为 underfined，表示参数空，获取全部
    if ( key === undefined ) {
      if ( this.length ) {
        data = dataUser.get( elem );

        if ( elem.nodeType === 1 && !dataPriv.get( elem, "hasDataAttrs" ) ) {
          i = attrs.length;
          while ( i-- ) {

            // 这里面从 dom 的 attribute 中搜索 data- 开通的属性
            if ( attrs[ i ] ) {
              name = attrs[ i ].name;
              if ( name.indexOf( "data-" ) === 0 ) {
                name = jQuery.camelCase( name.slice( 5 ) );
                dataAttr( elem, name, data[ name ] );
              }
            }
          }
          dataPriv.set( elem, "hasDataAttrs", true );
        }
      }

      return data;
    }

    // object 类型
    if ( typeof key === "object" ) {
      return this.each( function() {
        dataUser.set( this, key );
      } );
    }
    // key value 的情况，利用 access 函数
    return access( this, function( value ) {
      var data;

      // The calling jQuery object (element matches) is not empty
      // (and therefore has an element appears at this[ 0 ]) and the
      // `value` parameter was not undefined. An empty jQuery object
      // will result in `undefined` for elem = this[ 0 ] which will
      // throw an exception if an attempt to read a data cache is made.
      if ( elem && value === undefined ) {

        // Attempt to get data from the cache
        // The key will always be camelCased in Data
        data = dataUser.get( elem, key );
        if ( data !== undefined ) {
          return data;
        }

        // Attempt to "discover" the data in
        // HTML5 custom data-* attrs
        data = dataAttr( elem, key );
        if ( data !== undefined ) {
          return data;
        }

        // We tried really hard, but the data doesn't exist.
        return;
      }

      // Set the data...
      this.each( function() {

        // We always store the camelCased key
        dataUser.set( this, key, value );
      } );
    }, null, value, arguments.length > 1, null, true );
  },

  removeData: function( key ) {
    return this.each( function() {
      dataUser.remove( this, key );
    } );
  }
} );
```

data 函数略有不同，但思路也很清晰。

### 有几个要提一下的函数

其中，有几个函数，也来介绍一下，`acceptData`：

```javascript
var acceptData = function( owner ) {
  // Accepts only:
  //  - Node
  //    - Node.ELEMENT_NODE
  //    - Node.DOCUMENT_NODE
  //  - Object
  //    - Any
  return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
};
```

acceptData 是判断 owner 的类型，具体关于 nodeType，去看看[这里](https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nodeType)吧。

`jQuery.camelCase`：

```javascript
jQuery.camelCase = function (string) {
  return string.replace(/^-ms-/, "ms-").replace(/-([a-z])/g, function (all, letter) {
    return letter.toUpperCase();
  });
}
```

这个函数就是做了一些特殊字符串的 replace，具体有啥用，我也不是很清楚。

`isEmptyObject` 是判断一个 Object 是否为空的函数，挺有意思的，可以借鉴：

```javascript
jQuery.isEmptyObject = function (obj) {
    var name;
    for (name in obj) {
        return false;
    }
    return true;
}
```

`dataAttr` 是一个从 DOM 中搜索以 `data-` 开头属性的函数：

```javascript
function dataAttr( elem, key, data ) {
  var name;
  // If nothing was found internally, try to fetch any
  // data from the HTML5 data-* attribute
  if ( data === undefined && elem.nodeType === 1 ) {
    name = "data-" + key.replace( /[A-Z]/g, "-$&" ).toLowerCase();
    // 利用 dom 自身的 get 操作
    data = elem.getAttribute( name );

    if ( typeof data === "string" ) {
      try {
        // 先看有没有
        data = getData( data );
      } catch ( e ) {}

      // Make sure we set the data so it isn't changed later
      dataUser.set( elem, key, data );
    } else {
      data = undefined;
    }
  }
  return data;
}
```

## 总结

jQuery 的 data 缓存从源码来看的话，真的不是很难，而且不难发现，jQuery 缓存的实质，其实就是在内部先弄一个 Object，然后和缓存体（DOM）建立一对一的联系，所以增删改查的操作，都是围绕着 jQuery 内部来的，不直接对 DOM 操作，这样就可以避免内存泄漏。而且从源码来看，jQuery 的缓存机制自带清内存操作，更是锦上添花呀。

## 参考

>[jQuery 2.0.3 源码分析 数据缓存](http://www.cnblogs.com/aaronjs/p/3370176.html)

>[jQuery.data()](http://www.css88.com/jqapi-1.9/jQuery.data/)