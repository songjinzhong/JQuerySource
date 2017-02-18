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
4. `handlers()` 在 dispatch 执行的时候，对事件进行校正；
5. `addProp()` 是绑定参数到对象上；
6. `fix()` 修复浏览器 bug，对浏览器差异进行修正；
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
      elemData = dataPriv.get( elem );

    // Don't attach events to noData or text/comment nodes (but allow plain objects)
    if ( !elemData ) {
      return;
    }

    // Caller can pass in an object of custom data in lieu of the handler
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

    // Make sure that the handler has a unique ID, used to find/remove it later
    if ( !handler.guid ) {
      handler.guid = jQuery.guid++;
    }

    // Init the element's event structure and main handler, if this is the first
    if ( !( events = elemData.events ) ) {
      events = elemData.events = {};
    }
    if ( !( eventHandle = elemData.handle ) ) {
      eventHandle = elemData.handle = function( e ) {

        // Discard the second event of a jQuery.event.trigger() and
        // when an event is called after a page has unloaded
        return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ?
          jQuery.event.dispatch.apply( elem, arguments ) : undefined;
      };
    }

    // Handle multiple events separated by a space
    types = ( types || "" ).match( rnothtmlwhite ) || [ "" ];
    t = types.length;
    while ( t-- ) {
      tmp = rtypenamespace.exec( types[ t ] ) || [];
      type = origType = tmp[ 1 ];
      namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

      // There *must* be a type, no attaching namespace-only handlers
      if ( !type ) {
        continue;
      }

      // If event changes its type, use the special event handlers for the changed type
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

      // Init the event handler queue if we're the first
      if ( !( handlers = events[ type ] ) ) {
        handlers = events[ type ] = [];
        handlers.delegateCount = 0;

        // Only use addEventListener if the special events handler returns false
        if ( !special.setup ||
          special.setup.call( elem, data, namespaces, eventHandle ) === false ) {

          if ( elem.addEventListener ) {
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

      // Add to the element's handler list, delegates in front
      if ( selector ) {
        handlers.splice( handlers.delegateCount++, 0, handleObj );
      } else {
        handlers.push( handleObj );
      }

      // Keep track of which events have ever been used, for event optimization
      jQuery.event.global[ type ] = true;
    }

  }
}
```

## 参考

>[jQuery 2.0.3 源码分析 事件体系结构](http://www.cnblogs.com/aaronjs/p/3441320.html)

>[解密jQuery事件核心 - 绑定设计（一）](http://www.cnblogs.com/aaronjs/p/3444874.html)