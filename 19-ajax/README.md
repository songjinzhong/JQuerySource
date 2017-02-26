关于 ajax，东西太多了，我本来想避开 ajax，避而不提，但觉得 ajax 这么多内容，不说实在可惜。

## 写在 jQuery 的 ajax 之前

首先，我们还是来了解一下 js 中的 http 请求。http 协议中有请求体和响应体，对于请求的一方，无论是哪一种语言，我比较关心如下几个方面：请求的配置参数包括 url，post／get 等；请求有请求头，那么请求头的参数又该由哪个函数来设置；如何判断请求已经成功；响应状态码和响应数据该如何获得等等。

### XMLHttpRequest 对象

每天都喊着要写原生的 js 请求，那么来了，就是这个函数 `XMLHttpRequest`，它是一套可以在Javascript、VbScript、Jscript等脚本语言中通过http协议传送或接收XML及其他数据的一套API，万恶的低版本 IE 有个兼容的 `ActiveXObject`。

它有两个版本，第一个版本的功能很少，在不久之后又有了点一个更完善的版本 2.0，功能更全。如果你感兴趣，可以来这里看一下[XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)。如果你对 http 协议有着很好的掌握的话，也可以看下面的内容。

### 实现一个简单的 ajax 请求

如果你碰到面试官，让你手写一个原生的 ajax 请求，那么下面的东西可能对你非常有帮助：

```javascript
// myAjax
var myAjax = (function(){
  var defaultOption = {
    url: false,
    type: 'GET',
    data: null,
    success: false,
    complete: false
  }

  var ajax = function(options){
    for(var i in defaultOption){
      options[i] = options[i] || defaultOption[i];
    }
    // http 对象
    var xhr = new XMLHttpRequest();
    var url = options.url;
    xhr.open(options.type, url);
    // 监听
    xhr.onreadystatechange = function(){
      if(xhr.readyState == 4){
        var result, status = xhr.status;
      }
      if(status >= 200 && status < 300 || status == 304){
        result = xhr.responseText;
        if(window.JSON){
          result = JSON.parse(result);
        }else{
          result = eval('(' + result + ')');
        }
        ajaxSuccess(result)
      }
    }
    // post
    if(options.type.toLowerCase() === 'post'){
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencode');
    }
    xhr.send(options.data);

    function ajaxSuccess(data){
      var status = 'success';
      options.success && options.success(data, options, status, xhr);
      options.complete && options.complete(status);
    }
  }
  // 闭包返回
  return ajax;
})()
```

测试在下面：

```javascript
var success = function(data){
  console.log(data['blog'])
}
var complete = function(status){
  if(status == 'success'){
    console.log('success')
  }else{
    console.log('failed')
  }
}
myAjax( {
  url: 'https://api.github.com/users/songjinzhong',
  success: success,
  complete: complete
} );
```

可以得到 XMLHttpRequest 的简单用法：

1. 通过 new XMLHttpRequest() 建立一个 http 请求对象；
2. open 函数的作用是设置要打开的 url 和类型，建立一个连接，但此时请求并没有发送；
3. setRequestHeader 来设置请求头信息；
4. send 函数像服务器发送数据请求；
3. onreadystatechange 是一个监听函数，当 readyState 改变的时候执行，1-2-3-4，4 表示成功返回。xhr.responseText 是返回的响应数据，很明显，这里是 json 格式，实际要通过响应头来判断，这里省去了这一步，getAllResponseHeaders 可以获得所有响应头；
5. success 函数和 complete 函数执行的位置和顺序问题。

## jQuery ajax 的特点

通过上面的例子，应该可以对 js 的 http 请求有个大致的了解，而 jQuery 的处理则复杂的多，也涉及到和上面功能类似的一些函数，而对于 callback 和 deferred，jQuery 本身就支持：


```javascript
var deferred = jQuery.Deferred(),
  completeDeferred = jQuery.Callbacks( "once memory" );
```

## 参考

>[jQuery源码分析系列(30) : Ajax 整体结构](http://www.cnblogs.com/aaronjs/p/3683925.html)

>[jQuery源码分析系列(37) : Ajax 总结](http://www.cnblogs.com/aaronjs/p/3798868.html)

>[触碰jQuery：AJAX异步详解](http://www.cnblogs.com/heyuquan/archive/2013/05/13/js-jquery-ajax.html)