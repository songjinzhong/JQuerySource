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

上面是 event 上的一些函数，其中：

1. `add()` 是添加事件函数，在当前 dom 上监听事件，生成处理函数；
2. `remove()` 移除事件；
3. `dispatch()` 是实际的事件执行者；
4. `handlers()` 在 dispatch 执行的时候，对事件进行校正，区分原生与委托事件；
5. `addProp()` 是绑定参数到对象上；
6. `fix()` 将原生的 event 事件修复成一个可读可写且有统一接口的对象；
7. `special()` 是一个特殊事件表。

说 add 函数之前，还是忍不住要把 Dean Edwards 大神的 addEvent 库来品味一下，尽管之前已经谈过了：

```javascript
function addEvent(element, type, handler) {
  // 给每一个要绑定的函数添加一个标识 guid
  if (!handler.$$guid) handler.$$guid = addEvent.guid++;
  // 在绑定的对象事件上创建一个事件对象
  if (!element.events) element.events = {};
  // 一个 type 对应一个 handlers 对象，比如 click 可同时处理多个函数
  var handlers = element.events[type];
  if (!handlers) {
    handlers = element.events[type] = {};
    // 如果 onclick 已经存在一个函数，拿过来
    if (element["on" + type]) {
      handlers[0] = element["on" + type];
    }
  }
  // 防止重复绑定，每个对应一个 guid
  handlers[handler.$$guid] = handler;
  // 把 onclick 函数替换成 handleEvent
  element["on" + type] = handleEvent;
};
// 初始 guid
addEvent.guid = 1;

function removeEvent(element, type, handler) {
  // delete the event handler from the hash table
  if (element.events && element.events[type]) {
    delete element.events[type][handler.$$guid];
  }
  // 感觉后面是不是要加个判断，当 element.events[type] 为空时，一起删了
};

function handleEvent(event) {
  // grab the event object (IE uses a global event object)
  event = event || window.event;
  // 这里的 this 指向 element
  var handlers = this.events[event.type];
  // execute each event handler
  for (var i in handlers) {
    // 这里有个小技巧，为什么不直接执行，而是先绑定到 this 后执行
    // 是为了让函数执行的时候，内部 this 指向 element
    this.$$handleEvent = handlers[i];
    this.$$handleEvent(event);
  }
};
```

如果我们对这个浏览器支持 `addEventListener`，我们就可以对 addEvent 函数就行稍微对小修改（暂不考虑 attachEvent 兼容），在 addEvent 函数的最后，如果代码修改成以下：

```javascript
//element["on" + type] = handleEvent;
if(!element.hasAddListener){
  element.addEventListener(type,handleEvent,false);
  // 监听事件只需添加一次就好了
  element['hasAddListener'] = true;
}
```

虽然以上的做法有点重复，需要对基本逻辑进行判断，但这已经非常接近 jQuery 中的事件 add 方法。换句话说，以前的逻辑是把所有的监听方法都通过 `addEventListener` 来绑定，绑定一个，绑定两个，现在的思路变了：**如果我们写一个处理函数(handleEvent)，这个处理函数用来处理绑定到 DOM 上的事件，并通过 addEventListener 添加（只需添加一次），这就是 jQuery 中事件处理的基本逻辑（我所理解的，欢迎指正）**。

懂了上面，还需要清楚委托事件的本质：在父 DOM 上监听事件，事件处理函数找到对应的子 DOM 来处理。

## jQuery.event.add 函数分析

好了，来直接看源码，我已经不止一次的提到，学习源码最好的方式是调试，调试最好的办法是代码覆盖率 100% 的测试用例。

```javascript
jQuery.event = {
  global: {},
  add: function( elem, types, handler, data, selector ) {

    var handleObjIn, eventHandle, tmp,
      events, t, handleObj,
      special, handlers, type, namespaces, origType,
      // jQuery 专门为事件建立一个 data cache：dataPriv
      elemData = dataPriv.get( elem );

    // elem 有问题，直接退出
    if ( !elemData ) {
      return;
    }

    // 如果 handler 是一个事件处理对象，且有 handler 属性
    if ( handler.handler ) {
      handleObjIn = handler;
      handler = handleObjIn.handler;
      selector = handleObjIn.selector;
    }

    // Ensure that invalid selectors throw exceptions at attach time
    // Evaluate against documentElement in case elem is a non-element node (e.g., document)
    if ( selector ) {
      jQuery.find.matchesSelector( documentElement, selector );
    }

    // guid。
    if ( !handler.guid ) {
      handler.guid = jQuery.guid++;
    }

    // 初始化 data.elem 的 events 和 handle
    if ( !( events = elemData.events ) ) {
      events = elemData.events = {};
    }
    if ( !( eventHandle = elemData.handle ) ) {
      eventHandle = elemData.handle = function( e ) {

        // 最终的执行在这里，点击 click 后，会执行这个函数
        return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ?
          jQuery.event.dispatch.apply( elem, arguments ) : undefined;
      };
    }

    // 处理多个事件比如 ("click mouseout")，空格隔开
    types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
    t = types.length;
    // 每个事件都处理
    while ( t-- ) {
      tmp = rtypenamespace.exec( types[ t ] ) || [];
      type = origType = tmp[ 1 ];
      namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

      // There *must* be a type, no attaching namespace-only handlers
      if ( !type ) {
        continue;
      }

      // 特殊处理
      special = jQuery.event.special[ type ] || {};

      // If selector defined, determine special event api type, otherwise given type
      type = ( selector ? special.delegateType : special.bindType ) || type;

      // Update special based on newly reset type
      special = jQuery.event.special[ type ] || {};

      // handleObj is passed to all event handlers
      handleObj = jQuery.extend( {
        type: type,
        origType: origType,
        data: data,
        handler: handler,
        guid: handler.guid,
        selector: selector,
        needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
        namespace: namespaces.join( "." )
      }, handleObjIn );

      // 如果 click 事件之前没有添加过，
      if ( !( handlers = events[ type ] ) ) {
        handlers = events[ type ] = [];
        handlers.delegateCount = 0;

        // Only use addEventListener if the special events handler returns false
        // addEventListener 事件也只是添加一次
        if ( !special.setup ||
          special.setup.call( elem, data, namespaces, eventHandle ) === false ) {

          if ( elem.addEventListener ) {
            // eventHandle 才是事件处理函数
            elem.addEventListener( type, eventHandle );
          }
        }
      }

      if ( special.add ) {
        special.add.call( elem, handleObj );

        if ( !handleObj.handler.guid ) {
          handleObj.handler.guid = handler.guid;
        }
      }

      // 添加到事件列表, delegates 要在前面
      if ( selector ) {
        handlers.splice( handlers.delegateCount++, 0, handleObj );
      } else {
        handlers.push( handleObj );
      }

      // 表面已经添加过了
      jQuery.event.global[ type ] = true;
    }

  }
}
```

来从头理一下代码，之前就已经说过 jQuery 中 Data 的问题，这里有两个：

```javascript
// 用于 DOM 事件 
var dataPriv = new Data();
// jQuery 中通用
var dataUser = new Data();
```

dataPriv 会根据当前的 elem 缓存两个对象，分别是 events 和 handle，这个 handle 就是通过 addEventListener 添加的那个回掉函数，而 events 存储的东西较多，比如我绑定了一个 click 事件，则 `events['click'] = []`，它是一个数组，这个时候无论我绑定多少个点击事件，只需要在这个数组里面添加内容即可，添加的时候要考虑一定的顺序。那么，数组的每个子元素长什么样：

```javascript
handleObj = {
  type: type,
  origType: origType,
  data: data,
  handler: handler,
  guid: handler.guid,
  selector: selector,
  needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
  namespace: namespaces.join( "." )
}
```

兼容性，兼容性，兼容性，其实 add 事件主要还是考虑到很多细节的内容，如果把这些都抛开不开，我们来比较一下 `event.add` 函数和 `addEvent` 函数相同点：

```javascript
// 左边是 addEvent 函数中内容
addEvent == jQuery.event.add;
handleEvent == eventHandle;
handler.$$guid == handler.guid;
element.events == dataPriv[elem].events;
```

非常像！

## jQuery.event.dispatch 函数分析

当有 selector 的时候，add 函数处理添加事件，而事件的执行，要靠 dispatch。举个例子，在 `$('body').on('click','#test',fn)`，我们点击 body，会被监听，dispatch 函数是会执行的，但是 fn 不执行，除非我们点击 `#test`。大概 dispath 就是用来判断 `event.target` 是不是需要的那个。

```javascript
jQuery.event.extend( {
  dispatch: function( nativeEvent ) {

    // 把 nativeEvent 变成可读写，jQuery 认可的 event
    var event = jQuery.event.fix( nativeEvent );

    var i, j, ret, matched, handleObj, handlerQueue,
      args = new Array( arguments.length ),
      // 从 data cache 中搜索处理事件
      handlers = ( dataPriv.get( this, "events" ) || {} )[ event.type ] || [],
      special = jQuery.event.special[ event.type ] || {};

    // Use the fix-ed jQuery.Event rather than the (read-only) native event
    args[ 0 ] = event;

    for ( i = 1; i < arguments.length; i++ ) {
      args[ i ] = arguments[ i ];
    }

    event.delegateTarget = this;

    // Call the preDispatch hook for the mapped type, and let it bail if desired
    if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
      return;
    }

    // 对 handlers 处理，区分事件类型，并按照顺序排好
    handlerQueue = jQuery.event.handlers.call( this, event, handlers );

    // Run delegates first; they may want to stop propagation beneath us
    i = 0;
    while ( ( matched = handlerQueue[ i++ ] ) && !event.isPropagationStopped() ) {
      event.currentTarget = matched.elem;

      j = 0;
      // 按照 handlers 排好的顺序，一次执行
      while ( ( handleObj = matched.handlers[ j++ ] ) &&
        !event.isImmediatePropagationStopped() ) {

        // Triggered event must either 1) have no namespace, or 2) have namespace(s)
        // a subset or equal to those in the bound event (both can have no namespace).
        if ( !event.rnamespace || event.rnamespace.test( handleObj.namespace ) ) {

          event.handleObj = handleObj;
          event.data = handleObj.data;
          // 最终的执行在这里
          ret = ( ( jQuery.event.special[ handleObj.origType ] || {} ).handle ||
            handleObj.handler ).apply( matched.elem, args );

          if ( ret !== undefined ) {
            if ( ( event.result = ret ) === false ) {
              // 下面两个函数是经过 event 改造后的事件
              event.preventDefault();
              event.stopPropagation();
            }
          }
        }
      }
    }

    // Call the postDispatch hook for the mapped type
    if ( special.postDispatch ) {
      special.postDispatch.call( this, event );
    }

    return event.result;
  }
} );
```

`event.handlers`的逻辑也是十分复杂的，而且我看了，也没看懂，大致就是将所有绑定到 elem 上的事件，按照一定的顺序来区分他们的执行顺序。

## 总结

花了好几天，也只是看了一个皮毛而已，尤其是对其中的事件逻辑，感觉好复杂。也只能这样了。

## 参考

>[jQuery 2.0.3 源码分析 事件体系结构](http://www.cnblogs.com/aaronjs/p/3441320.html)

>[解密jQuery事件核心 - 绑定设计（一）](http://www.cnblogs.com/aaronjs/p/3444874.html)

>[解密jQuery事件核心 - 委托设计（二）](http://www.cnblogs.com/aaronjs/p/3447483.html)