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

所以说 jQuery 是一个自给自足的库，一点也不过分，前面有 Sizzle，整个源码到处都充满着 extend 函数，等等。

### jQuery.ajaxSetup

ajaxSetup 是在 ajax 函数里比较早执行的一个函数，这个函数主要是用来校准参数用的；

```javascript
jQuery.extend( {
  ajaxSetup: function( target, settings ) {
    return settings ?

      // 双层的 ajaxExtend 函数
      ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

      // Extending ajaxSettings
      ajaxExtend( jQuery.ajaxSettings, target );
  },
} );
```

ajaxSettings 是一个对象，具体是干什么用的，看看就知道了：

```javascript
jQuery.ajaxSettings = {
  url: location.href,
  type: "GET",
  isLocal: rlocalProtocol.test( location.protocol ),
  global: true,
  processData: true,
  async: true,
  contentType: "application/x-www-form-urlencoded; charset=UTF-8",

  accepts: {
    "*": allTypes,
    text: "text/plain",
    html: "text/html",
    xml: "application/xml, text/xml",
    json: "application/json, text/javascript"
  },

  contents: {
    xml: /\bxml\b/,
    html: /\bhtml/,
    json: /\bjson\b/
  },

  responseFields: {
    xml: "responseXML",
    text: "responseText",
    json: "responseJSON"
  },

  // Data converters
  // Keys separate source (or catchall "*") and destination types with a single space
  converters: {

    // Convert anything to text
    "* text": String,

    // Text to html (true = no transformation)
    "text html": true,

    // Evaluate text as a json expression
    "text json": JSON.parse,

    // Parse text as xml
    "text xml": jQuery.parseXML
  },

  // For options that shouldn't be deep extended:
  // you can add your own custom options here if
  // and when you create one that shouldn't be
  // deep extended (see ajaxExtend)
  flatOptions: {
    url: true,
    context: true
  }
}
```

ajaxSettings 原来是一个加强版的 options。

ajaxExtend 是用来将 ajax 函数参数进行标准化的，看看哪些参数没有赋值，让它等于默认值，由于 ajaxExtend 是双层的，具体要调试了才能更明白。

```javascript
function ajaxExtend( target, src ) {
  var key, deep,
    flatOptions = jQuery.ajaxSettings.flatOptions || {};

  for ( key in src ) {
    if ( src[ key ] !== undefined ) {
      ( flatOptions[ key ] ? target : ( deep || ( deep = {} ) ) )[ key ] = src[ key ];
    }
  }
  if ( deep ) {
    jQuery.extend( true, target, deep );
  }

  return target;
}
```

### ajax.jqXHR

在 ajax 中有一个非常重要的对象，jqXHR，它虽然是一个简称，但通过缩写也大致能猜出它是 `jquery-XMLHttpRequest`。

```javascript
jqXHR = {
  readyState: 0, // 0-4

  // 熟悉响应头的对这个应该不陌生，将响应头数据按照 key value 存储起来
  getResponseHeader: function( key ) {
    var match;
    if ( completed ) {
      if ( !responseHeaders ) {
        responseHeaders = {};
        while ( ( match = /^(.*?):[ \t]*([^\r\n]*)$/mg.exec( responseHeadersString ) ) ) {
          responseHeaders[ match[ 1 ].toLowerCase() ] = match[ 2 ];
        }
      }
      match = responseHeaders[ key.toLowerCase() ];
    }
    return match == null ? null : match;
  },

  // Raw string
  getAllResponseHeaders: function() {
    return completed ? responseHeadersString : null;
  },

  // 手动设置请求头
  setRequestHeader: function( name, value ) {
    if ( completed == null ) {
      name = requestHeadersNames[ name.toLowerCase() ] =
        requestHeadersNames[ name.toLowerCase() ] || name;
      requestHeaders[ name ] = value;
    }
    return this;
  },

  // Overrides response content-type header
  overrideMimeType: function( type ) {
    if ( completed == null ) {
      s.mimeType = type;
    }
    return this;
  },

  // Status-dependent callbacks
  statusCode: function( map ) {
    var code;
    if ( map ) {
      if ( completed ) {

        // Execute the appropriate callbacks
        jqXHR.always( map[ jqXHR.status ] );
      } else {

        // Lazy-add the new callbacks in a way that preserves old ones
        for ( code in map ) {
          statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
        }
      }
    }
    return this;
  },

  // Cancel the request
  abort: function( statusText ) {
    var finalText = statusText || strAbort;
    if ( transport ) {
      transport.abort( finalText );
    }
    done( 0, finalText );
    return this;
  }
};
```

jqXHR 已经完全可以取代 XHR 对象了，函数都进行扩展了。

### ajaxTransport

那么 XMLHttpRequest 这个函数到底在哪呢？

jQuery 中有两个属性，分别是 `ajaxPrefilter` 和 `ajaxTransport`，它们是由 `addToPrefiltersOrTransports` 函数构造的。主要来看 ajaxTransport 函数：

```javascript
jQuery.ajaxTransport( function( options ) {
  var callback, errorCallback;

  // Cross domain only allowed if supported through XMLHttpRequest
  if ( support.cors || xhrSupported && !options.crossDomain ) {
    return {
      send: function( headers, complete ) {
        var i,
          xhr = options.xhr();// xhr() = XMLHttpRequest()
        xhr.open(
          options.type,
          options.url,
          options.async,
          options.username,
          options.password
        );

        // Apply custom fields if provided
        if ( options.xhrFields ) {
          for ( i in options.xhrFields ) {
            xhr[ i ] = options.xhrFields[ i ];
          }
        }

        // Override mime type if needed
        if ( options.mimeType && xhr.overrideMimeType ) {
          xhr.overrideMimeType( options.mimeType );
        }

        // X-Requested-With header
        // For cross-domain requests, seeing as conditions for a preflight are
        // akin to a jigsaw puzzle, we simply never set it to be sure.
        // (it can always be set on a per-request basis or even using ajaxSetup)
        // For same-domain requests, won't change header if already provided.
        if ( !options.crossDomain && !headers[ "X-Requested-With" ] ) {
          headers[ "X-Requested-With" ] = "XMLHttpRequest";
        }

        // Set headers
        for ( i in headers ) {
          xhr.setRequestHeader( i, headers[ i ] );
        }

        // Callback
        callback = function( type ) {
          return function() {
            if ( callback ) {
              callback = errorCallback = xhr.onload =
                xhr.onerror = xhr.onabort = xhr.onreadystatechange = null;

              if ( type === "abort" ) {
                xhr.abort();
              } else if ( type === "error" ) {

                // Support: IE <=9 only
                // On a manual native abort, IE9 throws
                // errors on any property access that is not readyState
                if ( typeof xhr.status !== "number" ) {
                  complete( 0, "error" );
                } else {
                  complete(

                    // File: protocol always yields status 0; see #8605, #14207
                    xhr.status,
                    xhr.statusText
                  );
                }
              } else {
                complete(
                  xhrSuccessStatus[ xhr.status ] || xhr.status,
                  xhr.statusText,

                  // Support: IE <=9 only
                  // IE9 has no XHR2 but throws on binary (trac-11426)
                  // For XHR2 non-text, let the caller handle it (gh-2498)
                  ( xhr.responseType || "text" ) !== "text"  ||
                  typeof xhr.responseText !== "string" ?
                    { binary: xhr.response } :
                    { text: xhr.responseText },
                  xhr.getAllResponseHeaders()
                );
              }
            }
          };
        };

        // Listen to events
        xhr.onload = callback();
        errorCallback = xhr.onerror = callback( "error" );

        // Support: IE 9 only
        // Use onreadystatechange to replace onabort
        // to handle uncaught aborts
        if ( xhr.onabort !== undefined ) {
          xhr.onabort = errorCallback;
        } else {
          xhr.onreadystatechange = function() {

            // Check readyState before timeout as it changes
            if ( xhr.readyState === 4 ) {

              // Allow onerror to be called first,
              // but that will not handle a native abort
              // Also, save errorCallback to a variable
              // as xhr.onerror cannot be accessed
              window.setTimeout( function() {
                if ( callback ) {
                  errorCallback();
                }
              } );
            }
          };
        }

        // Create the abort callback
        callback = callback( "abort" );

        try {

          // Do send the request (this may raise an exception)
          xhr.send( options.hasContent && options.data || null );
        } catch ( e ) {

          // #14683: Only rethrow if this hasn't been notified as an error yet
          if ( callback ) {
            throw e;
          }
        }
      },

      abort: function() {
        if ( callback ) {
          callback();
        }
      }
    };
  }
} );
```
ajaxTransport 函数返回值有两个，其中 send 就是发送函数了，一步一步，发送下来，无需多说明。

另外，ajax 对于 jQuery 对象在 ajax 过程提供了很多回调函数：

```javascript
jQuery.each( [
  "ajaxStart",
  "ajaxStop",
  "ajaxComplete",
  "ajaxError",
  "ajaxSuccess",
  "ajaxSend"
], function( i, type ) {
  jQuery.fn[ type ] = function( fn ) {
    return this.on( type, fn );
  };
} );

jQuery.event.trigger( "ajaxStart" );
...
globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
...
globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",[ jqXHR, s, isSuccess ? success : error ] );
...
globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );
...
jQuery.event.trigger( "ajaxStop" );
```

ajax 东西太多了，至少有 1000 行的代码吧。

## 总结

关于 ajax，不想去深入研究了，最近暑假实习校招已经开始启动了，暂时先放一放吧，以后有时间再来填坑吧。

## 参考

>[jQuery源码分析系列(30) : Ajax 整体结构](http://www.cnblogs.com/aaronjs/p/3683925.html)

>[jQuery源码分析系列(37) : Ajax 总结](http://www.cnblogs.com/aaronjs/p/3798868.html)

>[触碰jQuery：AJAX异步详解](http://www.cnblogs.com/heyuquan/archive/2013/05/13/js-jquery-ajax.html)