眼看 jQuery 的源码就快到头了，后面还有几个重要的内容，包括 ajax 和动画操作，加油把它们看完，百度前端学院的新一批课程也开始了。[百度前端学院](http://ife.baidu.com/course/all)。

class 的的操作应该算是比较愉快的，因为内容不是很多，或者说，内容涉及到的原生操作不是很大，就一个 className 或 getAttribute，主要还是来看下它涉及到的一些兼容性操作。

## class 操作

先来说一个比较有趣的 class 操作，先把[链接](http://stackoverflow.com/questions/5041494/selecting-and-manipulating-css-pseudo-elements-such-as-before-and-after-usin)贴上。

js 有一个非常大的缺陷，就是无法控制伪元素的样式，比如 after 和 before，这样子会失去很多乐趣（同样也带来了很多乐趣）。上面的链接是 stackoverflow 的解答。

**1. class 方式**

通过事先定义 class 的方式来解决：

```
p:before {
  content: "c1"
}
p.click:before {
  content: "click"
}

// js
$("p").on("click", function(){
  $(this).toggleClass('click');
})
```

**2. 內联 style 方式**

这种方式不优雅，也是一种解决办法。

```javascript
var str = "click";
$('<style>p:before{content:"' + str + '""}</style>').appendTo('head');
```

**3. jQuery data-attr 来解决**

这种方式是依靠 content 的特性：

```
p:before {
  content: attr(data-click);
}

//js
var str = 'click';
$("p").on("click", function(){
  $(this).attr("data-click", str);
})
```

这种方式应该是动态改变。

jQuery 的应用还是挺广泛的。

## fn.hasClass

jQuery 中的 class 操作还是很有意思，会用到很多正则表达式，我超喜欢正则表达式的。

如果让我用原生的 js 来实现 class 操作，我会想到两种方式，一种是 [className](https://developer.mozilla.org/en-US/docs/Web/API/Element/className)，它的兼容性非常好，所有浏览器都支持，包括 mobile。第二个是 [getAttribute](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute)，也是所有浏览器都支持（有版本限制）。

先从 hasClass 说起吧：

```javascript
// 获取 class-name
function getClass( elem ) {
  return elem.getAttribute && elem.getAttribute( "class" ) || "";
}

// 将 class name 进行处理
function stripAndCollapse( value ) {
  var tokens = value.match( /[^\x20\t\r\n\f]+/g ) || [];
  return tokens.join( " " );
}

jQuery.fn.extend( {
  hasClass: function( selector ) {
    var className, elem,
      i = 0;

    className = " " + selector + " ";
    while ( ( elem = this[ i++ ] ) ) {
      if ( elem.nodeType === 1 &&
        ( " " + stripAndCollapse( getClass( elem ) ) + " " ).indexOf( className ) > -1 ) {
          return true;
      }
    }

    return false;
  }
} );
```

可以看出 `getClass` 函数使用的是 `getAttribute` 方法。

## fn.addClass

接下来看一下添加 add：

```javascript
jQuery.fn.extend( {
  addClass: function( value ) {
    var classes, elem, cur, curValue, clazz, j, finalValue,
      i = 0;
    // 参数为函数...
    if ( jQuery.isFunction( value ) ) {
      return this.each( function( j ) {
        jQuery( this ).addClass( value.call( this, j, getClass( this ) ) );
      } );
    }

    if ( typeof value === "string" && value ) {
      // 可以添加多个 class
      classes = value.match( /[^\x20\t\r\n\f]+/g ) || [];

      while ( ( elem = this[ i++ ] ) ) {
        curValue = getClass( elem );
        cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

        if ( cur ) {
          j = 0;
          while ( ( clazz = classes[ j++ ] ) ) {
            if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
              cur += clazz + " ";
            }
          }

          // 在这里 set class，有个 diff 判断
          finalValue = stripAndCollapse( cur ); // 去除两侧空格
          if ( curValue !== finalValue ) {
            elem.setAttribute( "class", finalValue );
          }
        }
      }
    }

    return this;
  }
} );
```

jQuery 大致处理的思路是这样的：先把当前 elem 中的 class 取出来 `cur`，要添加的 `value` 如果在 cur 中 `indexOf` 的值显示不存在，就在 cur 后面加上 value。

## fn.removeClass

删除可能要麻烦一点点：

```javascript
jQuery.fn.extend( {
  removeClass: function( value ) {
    var classes, elem, cur, curValue, clazz, j, finalValue,
      i = 0;
    // 不知道在哪里用到 value 为 function 情况
    if ( jQuery.isFunction( value ) ) {
      return this.each( function( j ) {
        jQuery( this ).removeClass( value.call( this, j, getClass( this ) ) );
      } );
    }
    // 无参数表示 移除所有的 class ...
    if ( !arguments.length ) {
      return this.attr( "class", "" );
    }

    if ( typeof value === "string" && value ) {
      classes = value.match( rnothtmlwhite ) || [];

      while ( ( elem = this[ i++ ] ) ) {
        curValue = getClass( elem );

        // This expression is here for better compressibility (see addClass)
        cur = elem.nodeType === 1 && ( " " + stripAndCollapse( curValue ) + " " );

        if ( cur ) {
          j = 0;
          while ( ( clazz = classes[ j++ ] ) ) {

            // 移除所有需要移除的 class
            while ( cur.indexOf( " " + clazz + " " ) > -1 ) {
              cur = cur.replace( " " + clazz + " ", " " );
            }
          }

          // Only assign if different to avoid unneeded rendering.
          finalValue = stripAndCollapse( cur );
          if ( curValue !== finalValue ) {
            elem.setAttribute( "class", finalValue );
          }
        }
      }
    }

    return this;
  }
} );
```

可以看出 remove 的操作基本上和 add 一样，只不过处理 class 的时候略有不同：

```javascript
// 这里用 while，是有技巧的
while ( cur.indexOf( " " + clazz + " " ) > -1 ) {
  cur = cur.replace( " " + clazz + " ", " " );
}
```

用 replace 替换匹配的 clazz 为空格。

## fn.toggleClass

toggleClass 使用的频率也比较高。

先来看看大致用法，你肯定会忽略它的第二个参数的意思。[.toggleClass()](http://www.css88.com/jqapi-1.9/toggleClass/)，当第二个参数为 true 的情况，就是 addClass，为 false 时，removeClass，从源码来看，就是直接调用的这两个函数。

除了两个参数，还有无参和只有 false 情况，下面也都有明确的处理办法。

```javascript
jQuery.fn.extend( {
toggleClass: function( value, stateVal ) {
    var type = typeof value;

    // 第二个参数为 boolean
    if ( typeof stateVal === "boolean" && type === "string" ) {
      return stateVal ? this.addClass( value ) : this.removeClass( value );
    }

    if ( jQuery.isFunction( value ) ) {
      return this.each( function( i ) {
        jQuery( this ).toggleClass(
          value.call( this, i, getClass( this ), stateVal ),
          stateVal
        );
      } );
    }

    return this.each( function() {
      var className, i, self, classNames;

      if ( type === "string" ) {

        // Toggle individual class names
        i = 0;
        self = jQuery( this );
        classNames = value.match( rnothtmlwhite ) || [];

        while ( ( className = classNames[ i++ ] ) ) {

          // 有则删，无则加，逻辑很简单
          if ( self.hasClass( className ) ) {
            self.removeClass( className );
          } else {
            self.addClass( className );
          }
        }

      // 当无参或只有一个 false 时，所有 class 都执行
      } else if ( value === undefined || type === "boolean" ) {
        className = getClass( this );
        if ( className ) {

          // Store className if set
          dataPriv.set( this, "__className__", className );
        }

        if ( this.setAttribute ) {
          this.setAttribute( "class",
            className || value === false ?
            "" :
            dataPriv.get( this, "__className__" ) || ""
          );
        }
      }
    } );
  }
} );
```

看得出来，这个逻辑和前面两个很像，不过当无参或只有一个 boolean 且 false 时，先将当前的 className 保存到 data cache 中，然后实现 toggle 操作：

```javascript
if ( this.setAttribute ) {
  this.setAttribute( "class",
    className || value === false ? // 判断条件
    "" : // 有则设空
    dataPriv.get( this, "__className__" ) || "" // 无则从 data cache 取
  );
}
```

## 总结

感觉 jQuery 中的 class 操作不是很复杂，难道是我在进步吗，哈哈。

## 参考

>[jQuery 2.0.3 源码分析 样式操作](http://www.cnblogs.com/aaronjs/p/3433358.html)

>[Selecting and manipulating CSS ..](http://stackoverflow.com/questions/5041494/selecting-and-manipulating-css-pseudo-elements-such-as-before-and-after-usin)

>[.toggleClass()](http://www.css88.com/jqapi-1.9/toggleClass/)