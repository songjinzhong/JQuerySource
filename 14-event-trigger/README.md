以前，我只知道，只有当对浏览器中的元素进行点击的时候，才会出发 click 事件，其它的事件也一样，需要人为的鼠标操作。

后来随着学习的不断深入，才知道原来 JS 可以写函数来控制事件的执行，这样子写代码才有意思。记得很久很久以前一些恶意网站，明明鼠标没有点击，却被网站强行的点击了某个链接，大概实现的方式就是这样的吧。

## 原生事件

其实 JS 的原生事件已经做得挺好了，只是 jQuery 将其进行封装，做的更好。

关于 [document.createEvent](https://developer.mozilla.org/en-US/docs/Web/API/Document/createEvent)，下面是一个简单的事件点击的例子：

```javascript
var fn = function(){
  console.log('click');
}

var button = document.getElementById('#id');
button.addEventListener('click', fn);

// 点击事件 MouseEvent
var myClick = document.createEvent('MouseEvent');
myClick.initMouseEvent('click', false, false, null);

// 执行
button.dispatchEvent(myClick); // 'click'
```

除了鼠标事件，还可以自定义事件：

```javascript
// 随便自定义一个事件 test.click
button.addEventListener('test.click', fn);

var testEvent = document.createEvent('CustomEvent');
// customEvent 也可以初始化为鼠标事件，不一定非要自定义事件
testEvent.initCustomEvent('test.click', false, false, null);

button.dispatchEvent(testEvent); // 'click'
```

JS 原生的模拟事件，使用起来还是很方便的，以上便是原生的。

不过 jQuery 也有自己的一套自定义事件方案。

## jQuery.trigger

`jQuery.trigger` 可以和 `HTMLElement.dispatchEvent` 事件拿来对比，他们都是用来模拟和执行监听的事件。

### 如何使用

关于使用，则比较简单了[.trigger()](http://www.css88.com/jqapi-1.9/trigger/):

```javascript
var $body = $(document.body);

// 先绑定事件
$body.on('click', function(){
  console.log('click');
})

// 执行
$body.trigger('click'); //'click'
```

trigger 还支持更多的参数，同样可以自定义事件：

```javascript
$body.on('click.test', function(e, data1, data2){
  console.log(data1 + '-' + data2);
})

$body.trigger('click.test', ['hello', 'world']);
```

### trigger 源码

trigger 的源码有些简单，因为还是要借助于 `jQuery.event` 来处理：

```javascript
jQuery.fn.extend( {
  trigger: function(type, data){
    return this.each(function(){
      jQuery.event.trigger(type, data, this);
    })
  },
  // triggerHandler 处理第一个且不触发默认事件
  triggerHandler: function( type, data ) {
    var elem = this[ 0 ];
    if ( elem ) {
      return jQuery.event.trigger( type, data, elem, true );
    }
  }
} );
```

所以 trigger 事件的起点又回到了 `jQuery.event`。

## jQuery.event.trigger

其实 trigger 和 add + handler 函数很类似，大致都是从 data cache 中搜索缓存，执行回调函数。需要考虑要不要执行默认事件，即第四个参数为 true 的情况。

```javascript
jQuery.extend(jQuery.event, {
  // onleyHandlers 表示不考虑冒泡事件
  trigger: function( event, data, elem, onlyHandlers ) {

    var i, cur, tmp, bubbleType, ontype, handle, special,
      eventPath = [ elem || document ],
      type = hasOwn.call( event, "type" ) ? event.type : event,
      namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split( "." ) : [];

    cur = tmp = elem = elem || document;

    // Don't do events on text and comment nodes
    if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
      return;
    }

    // 异步不冲突
    if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
      return;
    }

    if ( type.indexOf( "." ) > -1 ) {

      // Namespaced trigger; create a regexp to match event type in handle()
      namespaces = type.split( "." );
      type = namespaces.shift();
      namespaces.sort();
    }
    ontype = type.indexOf( ":" ) < 0 && "on" + type;

    // 改装原生的 event 事件
    event = event[ jQuery.expando ] ?
      event :
      new jQuery.Event( type, typeof event === "object" && event );

    // 判断是否只执行当前 trigger 事件，不冒泡
    event.isTrigger = onlyHandlers ? 2 : 3;
    event.namespace = namespaces.join( "." );
    event.rnamespace = event.namespace ?
      new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" ) :
      null;

    // Clean up the event in case it is being reused
    event.result = undefined;
    if ( !event.target ) {
      event.target = elem;
    }

    // Clone any incoming data and prepend the event, creating the handler arg list
    data = data == null ?
      [ event ] :
      jQuery.makeArray( data, [ event ] );

    // Allow special events to draw outside the lines
    special = jQuery.event.special[ type ] || {};
    if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
      return;
    }

    // 向 document 冒泡并把冒泡结果存储到 eventPath 数组中
    if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

      bubbleType = special.delegateType || type;
      if ( !rfocusMorph.test( bubbleType + type ) ) {
        cur = cur.parentNode;
      }
      for ( ; cur; cur = cur.parentNode ) {
        eventPath.push( cur );
        tmp = cur;
      }

      // Only add window if we got to document (e.g., not plain obj or detached DOM)
      if ( tmp === ( elem.ownerDocument || document ) ) {
        eventPath.push( tmp.defaultView || tmp.parentWindow || window );
      }
    }

    // 按需求来执行
    i = 0;
    while ( ( cur = eventPath[ i++ ] ) && !event.isPropagationStopped() ) {

      event.type = i > 1 ?
        bubbleType :
        special.bindType || type;

      // 从 data cache 中获得回调函数
      handle = ( dataPriv.get( cur, "events" ) || {} )[ event.type ] &&
        dataPriv.get( cur, "handle" );
      if ( handle ) {
        // 执行
        handle.apply( cur, data );
      }

      // Native handler
      handle = ontype && cur[ ontype ];
      if ( handle && handle.apply && acceptData( cur ) ) {
        event.result = handle.apply( cur, data );
        if ( event.result === false ) {
          event.preventDefault();
        }
      }
    }
    event.type = type;

    // If nobody prevented the default action, do it now
    if ( !onlyHandlers && !event.isDefaultPrevented() ) {

      if ( ( !special._default ||
        special._default.apply( eventPath.pop(), data ) === false ) &&
        acceptData( elem ) ) {

        // Call a native DOM method on the target with the same name as the event.
        // Don't do default actions on window, that's where global variables be (#6170)
        if ( ontype && jQuery.isFunction( elem[ type ] ) && !jQuery.isWindow( elem ) ) {

          // Don't re-trigger an onFOO event when we call its FOO() method
          tmp = elem[ ontype ];

          if ( tmp ) {
            elem[ ontype ] = null;
          }

          // Prevent re-triggering of the same event, since we already bubbled it above
          jQuery.event.triggered = type;
          elem[ type ]();
          jQuery.event.triggered = undefined;

          if ( tmp ) {
            elem[ ontype ] = tmp;
          }
        }
      }
    }

    return event.result;
  },
})
```

## 总结

在 `jQuery.event.trigger` 中，比较有意思的是模拟冒泡机制，大致的思路就是：

1. 把当前 elem 存入数组；
2. 查找当前 elem 的父元素，如果符合，push 到数组中，重复第一步，否则下一步；
3. 遍历数组，从 data cache 中查看是否绑定 type 事件，然后依次执行。

冒泡事件就是就是由内向外冒泡的过程，这个过程不是很复杂。

event 事件应该就这么多内容吧。

## 参考

>[解密jQuery事件核心 - 自定义设计（三）](http://www.cnblogs.com/aaronjs/p/3452279.html)

>[MDN createEvent](https://developer.mozilla.org/en-US/docs/Web/API/Document/createEvent)

>[解密jQuery事件核心 - 模拟事件（四）](http://www.cnblogs.com/aaronjs/p/3481075.html)