关于 ajax，东西太多了，我本来想避开 ajax，避而不提，但觉得 ajax 这么多内容，不说实在可惜。

## 在看 jQuery 的 ajax 之前

首先，我们还是来了解一下 js 中的 http 请求。http 协议中有请求体和响应体，对于请求的一方，无论是哪一种语言，我比较关心如下几个方面：请求的配置参数包括 url，post／get 等；请求有请求头，那么请求头的参数又该由哪个函数来设置；如何判断请求已经成功；响应状态码和响应数据该如何获得等等。

### XMLHttpRequest 对象

每天都喊着要写原生的 js 请求，那么来了，就是这个函数 `XMLHttpRequest`，它是一套可以在Javascript、VbScript、Jscript等脚本语言中通过http协议传送或接收XML及其他数据的一套API，万恶的低版本 IE 有个兼容的 `ActiveXObject`。



## 参考

>[jQuery源码分析系列(30) : Ajax 整体结构](http://www.cnblogs.com/aaronjs/p/3683925.html)

>[jQuery源码分析系列(37) : Ajax 总结](http://www.cnblogs.com/aaronjs/p/3798868.html)

>[触碰jQuery：AJAX异步详解](http://www.cnblogs.com/heyuquan/archive/2013/05/13/js-jquery-ajax.html)