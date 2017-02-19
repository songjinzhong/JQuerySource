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
testEvent.initCustomEvent('test.click', false, false, null);

button.dispatchEvent(testEvent); // 'click'
```

JS 原生的模拟事件，使用起来还是很方便的，

## 参考

>[解密jQuery事件核心 - 自定义设计（三）](http://www.cnblogs.com/aaronjs/p/3452279.html)

>[MDN createEvent](https://developer.mozilla.org/en-US/docs/Web/API/Document/createEvent)