## select 函数

前面已经介绍了 tokensize 函数的功能，已经生成了一个 tokens 数组，而且对它的组成我们也做了介绍，下面就是介绍对这个 tokens 数组如何处理。

DOM 元素之间的连接关系大概有 ` > + ~` 几种，包括空格，而 tokens 数组中是 type 是有 tag、attr 和连接符之分的，区分它们 Sizzle 也是有一套规则的，比如上一章我们所讲的 Expr 对象，它真的非常重要：

```javascript
Expr.relative = {
  ">": { dir: "parentNode", first: true },
  " ": { dir: "parentNode" },
  "+": { dir: "previousSibling", first: true },
  "~": { dir: "previousSibling" }
};
```

`Expr.relative` 标记用来将连接符区分，对其种类又根据目录进行划分。

现在我们再来理一理 tokens 数组，这个数组目前是一个多重数组，现在不考虑逗号的情况，暂定只有一个分支。如果我们使用从右向左的匹配方式的话，`div > div.seq h2 ~ p`，会先得到 type 为 TAG 的 token，而对于 type 为 ~ 的 token 我们已经可以用 relative 对象来判断，现在来介绍 Expr.find 对象：

```javascript
Expr.find = {};
Expr.find['ID'] = function( id, context ) {
  if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
    var elem = context.getElementById( id );
    return elem ? [ elem ] : [];
  }
};
Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
  if ( typeof context.getElementsByClassName !== "undefined" && documentIsHTML ) {
    return context.getElementsByClassName( className );
  }
};
Expr.find["TAG"] = function(){...};
```

实际上 jQuery 的源码还考虑到了兼容性，这里以 find["ID"] 介绍：

```javascript
if(support.getById){
  Expr.find['ID'] = function(){...}; // 上面
}else{
  // 兼容 IE 6、7
  Expr.find["ID"] = function( id, context ) {
    if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
      var node, i, elems,
        elem = context.getElementById( id );

      if ( elem ) {

        // Verify the id attribute
        node = elem.getAttributeNode("id");
        if ( node && node.value === id ) {
          return [ elem ];
        }

        // Fall back on getElementsByName
        elems = context.getElementsByName( id );
        i = 0;
        while ( (elem = elems[i++]) ) {
          node = elem.getAttributeNode("id");
          if ( node && node.value === id ) {
            return [ elem ];
          }
        }
      }

      return [];
    }
  };
}
```

可以对 find 对象进行简化：

```javascript
Expr.find = {
  "ID": document.getElementById,
  "CLASS": document.getElementsByClassName,
  "TAG": document.getElementsByTagName
}
```

以后还会介绍 `Expr.filter`。

## select 源码

源码之前，来看几个正则表达式。

```javascript
var runescape = /\\([\da-f]{1,6}[\x20\t\r\n\f]?|([\x20\t\r\n\f])|.)/gi
//这个正则是用来对转义字符特殊处理，带个反斜杠的 token
runescape.exec('\\ab'); //["\ab", "ab", undefined]
var rsibling = /[+~]/; //匹配 +、~

matchExpr['needsContext'] = /^[\x20\t\r\n\f]*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\([\x20\t\r\n\f]*((?:-\d)?\d*)[\x20\t\r\n\f]*\)|)(?=[^-]|$)/i
//needsContext 用来匹配不完整的 selector
matchExpr['needsContext'].test(' + p')//true
matchExpr['needsContext'].test(':first-child p')//true
//这个不完整，可能是由于抽调 #ID 导致的
```

而对于 runescape 正则，往往都是配合 replace 来使用：

```javascript
var str = '\\ab';
str.replace(runescape, funescape);
var funescape = function (_, escaped, escapedWhitespace) {
  var high = "0x" + escaped - 0x10000;
  // NaN means non-codepoint
  // Support: Firefox<24
  // Workaround erroneous numeric interpretation of +"0x"
  return high !== high || escapedWhitespace ? escaped : high < 0 ?
  // BMP codepoint
  String.fromCharCode(high + 0x10000) :
  // Supplemental Plane codepoint (surrogate pair)
  String.fromCharCode(high >> 10 | 0xD800, high & 0x3FF | 0xDC00);
}
```

我完全看不懂啦，你们自己意会去吧，O(∩_∩)O哈哈~

```javascript
var select = Sizzle.select = function (selector, context, results, seed) {
  var i, tokens, token, type, find, compiled = typeof selector === "function" && selector,
    match = !seed && tokenize((selector = compiled.selector || selector));

  results = results || [];

  // 长度为 1，即表示没有逗号，Sizzle 尝试对此情况优化
  if (match.length === 1) {
    tokens = match[0] = match[0].slice(0);
    // 第一个 TAG 为一个 ID 选择器，设置快速查找
    if (tokens.length > 2 && (token = tokens[0]).type === "ID" && context.nodeType === 9 && documentIsHTML && Expr.relative[tokens[1].type]) {
      //将新 context 设置成那个 ID
      context = (Expr.find["ID"](token.matches[0].replace(runescape, funescape), context) || [])[0];
      if (!context) {
        // 第一个 ID 都找不到就直接返回
        return results;

      // 此时 selector 为 function，应该有特殊用途
      } else if (compiled) {
        context = context.parentNode;
      }

      selector = selector.slice(tokens.shift().value.length);
    }

    // 在没有 CHILD 的情况，从右向左，仍然是对性能的优化
    i = matchExpr["needsContext"].test(selector) ? 0 : tokens.length;
    while (i--) {
      token = tokens[i];

      // 碰到 +~ 等符号先停止
      if (Expr.relative[(type = token.type)]) {
        break;
      }
      if ((find = Expr.find[type])) {
        // Search, expanding context for leading sibling combinators
        if ((seed = find(
        token.matches[0].replace(runescape, funescape), rsibling.test(tokens[0].type) && testContext(context.parentNode) || context))) {
          // testContext 是判断 getElementsByTagName 是否存在
          // If seed is empty or no tokens remain, we can return early
          tokens.splice(i, 1);
          selector = seed.length && toSelector(tokens);
          //selector 为空，表示到头，直接返回
          if (!selector) {
            push.apply(results, seed);
            return results;
          }
          break;
        }
      }
    }
  }

  // Compile and execute a filtering function if one is not provided
  // Provide `match` to avoid retokenization if we modified the selector above
  (compiled || compile(selector, match))(
  seed, context, !documentIsHTML, results, !context || rsibling.test(selector) && testContext(context.parentNode) || context);
  return results;
}
```

toSelector 函数是将 tokens 除去已经选择的将剩下的拼接成字符串：

```javascript
function toSelector(tokens) {
  var i = 0,
    len = tokens.length,
    selector = "";
  for (; i < len; i++) {
    selector += tokens[i].value;
  }
  return selector;
}
```

在最后又多出一个 compile 函数，是 Sizzle 的编译函数，下章讲。

到目前为止，该优化的都已经优化了，selector 和 context，还有 seed，而且如果执行到 compile 函数，这几个变量的状态：

1. selector 可能已经不上最初那个，经过各种去头去尾；
2. match 没变，仍是 tokensize 的结果；
3. seed 事种子集合，所有等待匹配 DOM 的集合；
4. context 可能已经是头（#ID）；
5. results 没变。

可能，你也发现了，其实 compile 是一个异步函数 `compile()()`。

## 总结

select 大概干了几件事，

1. 将 tokenize 处理 selector 的结果赋给 match，所以 match 实为 tokens 数组；
2. 在长度为 1，且第一个 token 为 ID 的情况下，对 context 进行优化，把 ID 匹配到的元素赋给 context；
3. 若不含 needsContext 正则，则生成一个 seed 集合，为所有的最右 DOM 集合；
4. 最后事 compile 函数，参数真多...

## 参考

>[jQuery 2.0.3 源码分析Sizzle引擎 - 解析原理](http://www.cnblogs.com/aaronjs/p/3310937.html)