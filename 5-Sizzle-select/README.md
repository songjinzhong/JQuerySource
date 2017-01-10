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
  Expr.find['ID'] = function(){...};
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

直到来 Expr 的 relative 和 find 之后，就可以来看源码啦。

## select 源码

源码之前，来看几个正则表达式。

```javascript
var runescape = /\\([\da-f]{1,6}[\x20\t\r\n\f]?|([\x20\t\r\n\f])|.)/gi
//这个正则是用来对转义字符特殊处理，带个反斜杠的 token
runescape.exec('\\ab'); //["\ab", "ab", undefined]
var rsibling = /[+~]/; //匹配 +、~
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

  // Try to minimize operations if there is only one selector in the list and no seed
  // (the latter of which guarantees us context)
  if (match.length === 1) {

    // Reduce context if the leading compound selector is an ID
    tokens = match[0] = match[0].slice(0);
    if (tokens.length > 2 && (token = tokens[0]).type === "ID" && context.nodeType === 9 && documentIsHTML && Expr.relative[tokens[1].type]) {

      context = (Expr.find["ID"](token.matches[0].replace(runescape, funescape), context) || [])[0];
      if (!context) {
        return results;

          // Precompiled matchers will still verify ancestry, so step up a level
      } else if (compiled) {
        context = context.parentNode;
      }

      selector = selector.slice(tokens.shift().value.length);
    }

    // Fetch a seed set for right-to-left matching
    i = matchExpr["needsContext"].test(selector) ? 0 : tokens.length;
    while (i--) {
      token = tokens[i];

      // Abort if we hit a combinator
      if (Expr.relative[(type = token.type)]) {
        break;
      }
      if ((find = Expr.find[type])) {
        // Search, expanding context for leading sibling combinators
        if ((seed = find(
        token.matches[0].replace(runescape, funescape), rsibling.test(tokens[0].type) && testContext(context.parentNode) || context))) {

          // If seed is empty or no tokens remain, we can return early
          tokens.splice(i, 1);
          selector = seed.length && toSelector(tokens);
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