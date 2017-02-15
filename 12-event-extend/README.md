前面一章，大概是一个总览，介绍了事件绑定的初衷和使用，通过了解，知道其内部是一个什么样的流程，从哪个函数到哪个函数。无论 jQuery 的源码简单或者复杂，有一点可以肯定，jQuery 致力于解决浏览器的兼容问题，最终是服务于使用者。

## 一些遗留问题

前面介绍 bind、delegate 和它们的 un 方法的时候，经提醒，忘记提到一些内容，却是我们经常使用的。比如 `$('body').click`，`$('body').mouseleave`等，它们是直接定义在原型上的函数，不知道怎么，就把它们给忽略了。

```javascript
jQuery.each( ( "blur focus focusin focusout resize scroll click dblclick " +
  "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
  "change select submit keydown keypress keyup contextmenu" ).split( " " ),
  function( i, name ) {

  // Handle event binding
  jQuery.fn[ name ] = function( data, fn ) {
    return arguments.length > 0 ?
      this.on( name, null, data, fn ) :
      this.trigger( name );
  };
} );
```

这个构造也是十分巧妙的，这些方法组成的字符串通过 `split(" ")` 变成数组，而后又通过 each 方法，在原型上对应每个名称，定义函数，这里可以看到，依旧是 on，还有 targger：

```javascript
jQuery.fn.extend( {
  trigger: function(type, data){
    return this.each(function (){
      // // 依旧是 event 对象上的方法
      jQuery.event.trigger(type, data, this);
    })
  }
} )
```

还缺少一个 one 方法，这个方法表示绑定的事件同类型只执行一次，[.one()](http://www.css88.com/jqapi-1.9/one/)：

```javascript
jQuery.fn.extend( {
  one: function( types, selector, data, fn ) {
    // 全局 on 函数
    return on( this, types, selector, data, fn, 1 );
  },
} );
```

## DOM 事件知识点

发现随着 event 源码的不断的深入，我自己出现越来越多的问题，比如没有看到我所熟悉的 `addEventListener`，还有一些看得很迷糊的 events 事件，所以我决定还是先来看懂 JS 中的 DOM 事件吧。

### 早期 DOM 事件

在 HTML 的 DOM 对象中，有一些以 `on` 开头的熟悉，比如 onclick、onmouseout 等，这些就是早期的 DOM 事件，它的最简单的用法，就是支持直接在对象上以名称来写函数：

```javascript
document.getElementsByTagName('body')[0].onclick = function(){
  console.log('click!');
}
document.getElementsByTagName('body')[0].onmouseout = function(){
  console.log('mouse out!');
}
```

onclick 函数会默认传入一个 event 参数，表示触发事件时的状态，包括触发对象，坐标等等。

这种方式有一个非常大的弊端，就是相同名称的事件，会前后覆盖，后一个 click 函数会把前一个 click 函数覆盖掉：

```javascript
var body = document.getElementsByTagName('body')[0];
body.onclick = function(){
  console.log('click1');
}
body.onclick = function(){
  console.log('click2');
}
// "click2"
body.onclick = null;
// 没有效果
```

### DOM 2.0

随着 DOM 的发展，已经来到 2.0 时代，也就是我所熟悉的 addEventListener 和 attachEvent(IE)，[JS 中的事件冒泡与捕获](http://yuren.space/blog/2016/10/16/%E4%BA%8B%E4%BB%B6%E5%86%92%E6%B3%A1%E4%B8%8E%E6%8D%95%E8%8E%B7/)。这个时候和之前相比，变化真的是太大了，[MDN addEventListener()](https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener)。

变化虽然是变化了，但是浏览器的兼容却成了一个大问题，比如下面就可以实现不支持 `addEventListener` 浏览器：

```javascript
(function() {
  // 不支持 preventDefault
  if (!Event.prototype.preventDefault) {
    Event.prototype.preventDefault=function() {
      this.returnValue=false;
    };
  }
  // 不支持 stopPropagation
  if (!Event.prototype.stopPropagation) {
    Event.prototype.stopPropagation=function() {
      this.cancelBubble=true;
    };
  }
  // 不支持 addEventListener 时候
  if (!Element.prototype.addEventListener) {
    var eventListeners=[];
    
    var addEventListener=function(type,listener /*, useCapture (will be ignored) */) {
      var self=this;
      var wrapper=function(e) {
        e.target=e.srcElement;
        e.currentTarget=self;
        if (typeof listener.handleEvent != 'undefined') {
          listener.handleEvent(e);
        } else {
          listener.call(self,e);
        }
      };
      if (type=="DOMContentLoaded") {
        var wrapper2=function(e) {
          if (document.readyState=="complete") {
            wrapper(e);
          }
        };
        document.attachEvent("onreadystatechange",wrapper2);
        eventListeners.push({object:this,type:type,listener:listener,wrapper:wrapper2});
        
        if (document.readyState=="complete") {
          var e=new Event();
          e.srcElement=window;
          wrapper2(e);
        }
      } else {
        this.attachEvent("on"+type,wrapper);
        eventListeners.push({object:this,type:type,listener:listener,wrapper:wrapper});
      }
    };
    var removeEventListener=function(type,listener /*, useCapture (will be ignored) */) {
      var counter=0;
      while (counter<eventListeners.length) {
        var eventListener=eventListeners[counter];
        if (eventListener.object==this && eventListener.type==type && eventListener.listener==listener) {
          if (type=="DOMContentLoaded") {
            this.detachEvent("onreadystatechange",eventListener.wrapper);
          } else {
            this.detachEvent("on"+type,eventListener.wrapper);
          }
          eventListeners.splice(counter, 1);
          break;
        }
        ++counter;
      }
    };
    Element.prototype.addEventListener=addEventListener;
    Element.prototype.removeEventListener=removeEventListener;
    if (HTMLDocument) {
      HTMLDocument.prototype.addEventListener=addEventListener;
      HTMLDocument.prototype.removeEventListener=removeEventListener;
    }
    if (Window) {
      Window.prototype.addEventListener=addEventListener;
      Window.prototype.removeEventListener=removeEventListener;
    }
  }
})();
```

虽然不支持 addEventListener 的浏览器可以实现这个功能，但本质上还是通过 attachEvent 函数来实现的，在理解 DOM 早期的事件如何来建立还是比较捉急的。

## addEvent 库

[addEvent库](http://dean.edwards.name/weblog/2005/10/add-event/)的这篇博客发表于 2005 年 10 月，所以这篇博客所讲述的 `addEvent` 方法算是经典型的，就连 jQuery 中的事件方法也是借鉴于此，故值得一提：

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

如果能将上面 addEvent 库的这些代码看懂，那么在看 jQuery 的 events 源码就明朗多了。

还有一个问题，所谓事件监听，是将事件绑定到父元素或 document 上，子元素来响应，如何实现？

要靠 event 传入的参数 e：

```javascript
var body = document.getElementsByTagName('body')[0];
body.onclick = function(e){
  console.log(e.target.className);
}
```

这个 `e.target` 对象就是点击的那个子元素了，无论是捕获也好，冒泡也好，貌似都能够模拟出来。接下来，可能要真的步入正题了。

## 总结

感觉事件委托的代码还是相当复杂的，我自己也啃了好多天，有那么一点点头绪，其中还有很多模模糊糊的知识点，只是觉得，存在就是牛逼的，我看不懂，但不代表它不牛逼。

## 参考

>[jQuery 2.0.3 源码分析 事件体系结构](http://www.cnblogs.com/aaronjs/p/3441320.html)

>[addEvent库](http://dean.edwards.name/weblog/2005/10/add-event/)

>[MDN EventTarget.addEventListener()](https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener)

>[原生JavaScript事件详解](http://www.cnblogs.com/iyangyuan/p/4190773.html)