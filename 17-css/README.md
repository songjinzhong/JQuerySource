样式操作也是 jQuery 比较常用的一个操作，就我本人而言，这个 css 函数用多了，感觉自己有点傻乎乎的，主要还是自己不了解 js 中 css 的真正含义。

不过现在不怕了。

开始之前，先抛开 jQuery，我们来看看一个有趣的面试题（据说是一道微信面试题）。

## 一道很有深度的面试题

用原生的 js 获得一个 HTML 元素的 `background-color`，当然，这只是一个引入，为什么不是 color，为什么不是 font-size？

### css 渲染的优先级

写过 css 样式的同学都知道，css 是有优先级区分的，`!important`优先级最高，內联优先级其次，id，类和伪类，元素和伪元素。优先级会按照顺序依次比较，同一级别相同则看下一级别，优先级相同，后面会覆盖前面。

比如，就像理科生排成绩，规定 `总分 > 数学 > 语文 > 英语`，如果 A，B 两人总分一样，就看数学成绩谁高，数学成绩一样，就看语文成绩谁高，以此类推。

记得在一家公司实习的时候（初学者），那个时候修改网站的主页样式，由于找不到样式对应，就大量使用 `!important`，并把所有样式都写在样式标的最后，估计，后面接手的人要气炸吧。

问题来了，对于任意的一个 elem，DIV 也好，P 也好，都只会保留一个 style 样式表，一般可以通过 `getComputedStyle` 函数或 IE 的 currentStyle 参数活动（万恶的 IE，现在 jQuery 已经不支持低版本 IE，连淘宝都不支持 IE8 了）。**无论这个样式表是通过前面哪个优先级获得的，但它一定是唯一且只有一个。**而且它还是只读的属性，所以通过 JS 来改变样式，如果不能修改 css 文件的情况下，只能采用內联。

內联有两种，一种是在 elem 上添加一个 style 属性，还有一种是在 HTMl 新建一个 `<style>` 标签，很显然，第一种貌似更符合 js 的特性，因为找到那个 elem 并不困难，而且还有一个 `elem.style` 可以使用。

### js 获取元素样式

`elem.style` 并不是万能的，也有很大的局限性。一般的思路就是，先看看有没有內联，如果没有內联，就走一般流程。

**內联值和 getComputedStyle 的值会不一样吗**，我自己做过测试，在 chrome 下面，內联值和样式表 getComputedStyle 的值是一样的，而且，当內联值改变，样式表也会跟着改变，除非在 css 文件中有比內联优先级还高的 important，这个时候內联是不起作用的，只能通过样式表来获取。

```javascript
var dom = document.getElementById("test");
var styleList = getComputedStyle(dom);
styleList.color; // 'black'

dom.style.color = 'red';

// 会自动刷新的
styleList.color; // 'red'
```

当 `styleList.color` 不变的时候，就知道可能有 important 样式的存在，也可以作为判断 important 的一个标准。

样式表有 `font-size`，有人写成驼峰 `fontSize`，这可以理解，统一一下就好啦。由于 `elem.style` 和 `getComputedStyle` 使用的是驼峰写法（实际上即使用破折法去获取也是可以得到的）要借助下面这两个函数来：

```javascript
// 变成驼峰
function camel(str){
  return str.replace(/-(\w)/g, function(m0, m1){
    return m1.toUpperCase();
  })
}

// 变成破折
function dashes(str){
  return str.replace(/[A-Z]/g, function(m0){
    return '-' + m0.toLowerCase();
  })
}
```

因此：

```javascript
function getStyle(elem, name){
  var value, styles, l;
  if(!name){ // 只有一个参数，直接返回吧
    return false;
  }
  if(elem.nodeType !==1 && elem.nodeType !== 9 && elem.nodeType !== 11){
    // 肯定不是 HTMLElement
    return false;
  }

  name = camel(name); //将 name 转变成驼峰
  value = elem.style[name];
  if(value){
    return value;
  }
  styles = (l = elem.currentStyle) ? l :
    (l = document.defaultView.getComputedStyle) ? l(elem) : {};
  return (l = styles[name]) ? l : false;
}

// 测试，无视驼峰和破折
getStyle(dom, 'font-size'); // '16px'
getStyle(dom, 'fontSize'); // '16px'
```

这道题目还是很有意思的，当然，答案还不止，还可以继续优化，这样可以给面试官好感，[链接](http://www.jianshu.com/p/e94b5779f998)。

因为我们测的是 background-color，这个属性很特别，当它是 `inherit`表示继承父类，`transparent` 表示透明，也该为 flase，看：

```javascript
function fixColor(elem){
  var color = getStyle(elem, 'background-color');
  if(color){
    if(color == 'transparent' || color == 'rgba(0, 0, 0, 0)')
      return false;
    else if(getStyle(elem, 'opacity') == '0'){
      return false; // 透明
    }
    else if(getStyle(elem, 'display') == 'none'){
      return false; // ..
    }
    else if(getStyle(elem, 'visibility') == 'hidden'){
      return false; // ..
    }
  }
  if(color == 'inherit'){
    return elem.parentNode ? fixColor(elem.parentNode) : false;
  }
  return color;
}
```

越来越有意思了。如果是 html5 中的 canvas，貌似又要去找。

## fn.css() 源码

好吧，步入正题了。我想，如果仔细看了前面面试题的同学，也该对原生 js 操作 css 做法完全懂了，jQuery 的思路也完全是如此，只是多了更多的兼容考虑：

```javascript
jQuery.fn.extend( {
  css: function( name, value ) {
    return access( this, function( elem, name, value ) {
      var styles, len,
        map = {},
        i = 0;

      if ( jQuery.isArray( name ) ) {
        styles = getStyles( elem );
        len = name.length;

        for ( ; i < len; i++ ) {
          map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
        }

        return map;
      }

      return value !== undefined ?
        jQuery.style( elem, name, value ) :
        jQuery.css( elem, name );
    }, name, value, arguments.length > 1 );
  }
} );
```

css 也是有 set 和 get 的，但是它们并不在 `fn.css` 函数里处理，set 对应 `jQuery.style`，get 对应 `jQuery.css`。

在此之前，先来看一个很熟悉的函数：

```javascript
var getStyles = function( elem ) {

    // Support: IE <=11 only, Firefox <=30 (#15098, #14150)
    // IE throws on elements created in popups
    // FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
    var view = elem.ownerDocument.defaultView;

    if ( !view || !view.opener ) {
      view = window;
    }

    return view.getComputedStyle( elem );
  };
```

jQuery 已经不支持 currentStyle，也就是抛弃了低版本浏览器。

```javascript
jQuery.extend( {
  camelCase: function( string ) {
    return string.replace( /^-ms-/, "ms-" ).replace( /-([a-z])/g, function( all, letter ) {
      return letter.toUpperCase();
    } );
  }
} );
```

camelCase 也是一个很熟悉的函数（自动忽略 ms）。

```javascript
jQuery.extend( {
style: function( elem, name, value, extra ) {

    // 处理特殊情况 !elem.style 可以借鉴
    if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
      return;
    }

    // Make sure that we're working with the right name
    var ret, type, hooks,
      origName = jQuery.camelCase( name ),
      style = elem.style;

    name = jQuery.cssProps[ origName ] ||
      ( jQuery.cssProps[ origName ] = vendorPropName( origName ) || origName );

    // hooks
    hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

    // Check if we're setting a value
    if ( value !== undefined ) {
      type = typeof value;

      // Convert "+=" or "-=" to relative numbers (#7345)
      if ( type === "string" && ( ret = rcssNum.exec( value ) ) && ret[ 1 ] ) {
        value = adjustCSS( elem, name, ret );

        // Fixes bug #9237
        type = "number";
      }

      // Make sure that null and NaN values aren't set (#7116)
      if ( value == null || value !== value ) {
        return;
      }

      // If a number was passed in, add the unit (except for certain CSS properties)
      if ( type === "number" ) {
        value += ret && ret[ 3 ] || ( jQuery.cssNumber[ origName ] ? "" : "px" );
      }

      // background-* props affect original clone's values
      if ( !support.clearCloneStyle && value === "" && name.indexOf( "background" ) === 0 ) {
        style[ name ] = "inherit";
      }

      // If a hook was provided, use that value, otherwise just set the specified value
      if ( !hooks || !( "set" in hooks ) ||
        ( value = hooks.set( elem, value, extra ) ) !== undefined ) {

        style[ name ] = value;
      }

    } else {

      // If a hook was provided get the non-computed value from there
      if ( hooks && "get" in hooks &&
        ( ret = hooks.get( elem, false, extra ) ) !== undefined ) {

        return ret;
      }

      // 千辛万苦，终于等到你
      return style[ name ];
    }
  }
} );
```

```javascript
jQuery.extend( {
css: function( elem, name, extra, styles ) {
    var val, num, hooks,
      origName = jQuery.camelCase( name );

    // Make sure that we're working with the right name
    name = jQuery.cssProps[ origName ] ||
      ( jQuery.cssProps[ origName ] = vendorPropName( origName ) || origName );

    // Try prefixed name followed by the unprefixed name
    hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

    // If a hook was provided get the computed value from there
    if ( hooks && "get" in hooks ) {
      val = hooks.get( elem, true, extra );
    }

    // Otherwise, if a way to get the computed value exists, use that
    if ( val === undefined ) {
      val = curCSS( elem, name, styles );
    }

    // Convert "normal" to computed value
    if ( val === "normal" && name in cssNormalTransform ) {
      val = cssNormalTransform[ name ];
    }

    // Make numeric if forced or a qualifier was provided and val looks numeric
    if ( extra === "" || extra ) {
      num = parseFloat( val );
      return extra === true || isFinite( num ) ? num || 0 : val;
    }
    return val;
  }
} );
```

## 总结

如果你对 css 看起来很吃力，请把那个微信面试题再仔细阅读一下吧。

## 参考

>[解密jQuery内核 样式操作](http://www.cnblogs.com/aaronjs/p/3559310.html)

>[CSS并不简单--一道微信面试题的实践](http://www.jianshu.com/p/64d5cabfab89)

>[微信面试题-获取元素的最终background-color](http://www.jianshu.com/p/e94b5779f998)