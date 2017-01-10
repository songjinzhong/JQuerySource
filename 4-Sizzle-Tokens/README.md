## Tokens 词法分析

其实词法分析是汇编里面提到的词汇，把它用到这里感觉略有不合适，但 Sizzle 中的 `tokensize`函数干的就是词法分析的活。

上一章我们已经讲到了 Sizzle 的用法，实际上就是 jQuery.find 函数，只不过还涉及到 jQuery.fn.find。jQuery.find 函数考虑的很周到，对于处理 #id、.class 和 TagName 的情况，都比较简单，通过一个正则表达式 `rquickExpr` 将内容给分开，如果浏览器支持 querySelectorAll，那更是最好的。

比较难的要数这种类似于 css 选择器的 selector，`div > div.seq h2 ~ p , #id p`，如果使用从左向右的查找规则，效率很低，而从右向左，可以提高效率。

本章就来介绍 tokensize 函数，看看它是如何将复杂的 selector 处理成 tokens 的。

我们以 `div > div.seq h2 ~ p , #id p` 为例，这是一个很简单的 css，逗号 , 将表达式分成两部分。css 中有一些基本的符号，这里有必要强调一下，比如 `,、space、>、+、～`：

1. `div,p` , 表示并列关系，所有 div 元素和 p 元素；
2. `div p` 空格表示后代元素，div 元素内所有的 p 元素；
3. `div>p` > 子元素且相差只能是一代，父元素为 div 的所有 p 元素；
4. `div+p` + 表示紧邻的兄弟元素，前一个兄弟节点为 div 的所有 p 元素；
5. `div~p` ~ 表示兄弟元素，所有前面有兄弟元素 div 的所有 p 元素。

除此之外，还有一些 a、input 比较特殊的：

1. `a[target=_blank]` 选择所有 target 为 _blank 的所有 a 元素；
2. `a[title=search]` 选择所有 title 为 search 的所有 a 元素；
3. `input[type=text]` 选择 type 为 text 的所有 input 元素；
4. `p:nth-child(2)` 选择其为父元素第二个元素的所有 p 元素；

Sizzle 都是支持这些语法的，如果我们把这一步叫做词法分析，那么词法分析的结果是一个什么东西呢？

`div > div.seq h2 ~ p , #id p` 经过 tokensize(selector) 会返回一个数组，改数组在函数中称为 groups，该数组有两个元素，分别是 tokens0 和 tokens1，代表选择器的两部分。tokens 也是数组，它的每一个元素都是一个 token 对象。

token 对象结构如下所说：

```javascript
token: {
  value: matched, // 匹配到的字符串
  type: type, //token 类型
  matches: match //去除 value 的正则结果数组
}
```

Sizzle 中 type 的种类有下面几种：ID、CLASS、TAG、ATTR、PSEUDO、CHILD、bool、needsContext，这几种有几种我也不知道啥意思，child 表示 nth-child、even、odd 这种子选择器。这是针对于 matches 存在的情况，对于 matches 不存在的情况，其 type 就是 value 的 trim() 操作，后面会谈到。

tokensize 函数对 selector 的处理，连空格都不放过，因为空格也属于 type 的一种，而且还很重要，`div > div.seq h2 ~ p` 的处理结果：

```javascript
tokens: [
  [value:'div', type:'TAG', matches:Array[1]],
  [value:' > ', type:'>'],
  [value:'div', type:'TAG', matches:Array[1]],
  [value:'.seq', type:'CLASS', matches:Array[1]],
  [value:' ', type:' '],
  [value:'h2', type:'TAG', matches:Array[1]],
  [value:' ~ ', type:'~'],
  [value:'p', type:'TAG', matches:Array[1]],
]
```

这个数组会交给 Sizzle 的下一个流程来处理，今天暂不讨论。

## tokensize 源码

照旧，先来看一下几个正则表达式。

```javascript
var rcomma = /^[\x20\t\r\n\f]*,[\x20\t\r\n\f]*/;
rcomma.exec('div > div.seq h2 ~ p');//null
rcomma.exec(' ,#id p');//[" ,"]
```

rcomma 这个正则，主要是用来区分 selector 是否到下一个规则，如果到下一个规则，就把之前处理好的 push 到 groups 中。这个正则中 `[\x20\t\r\n\f]` 是用来匹配类似于 whitespace 的，主体就一个逗号。

```javascript
var rcombinators = /^[\x20\t\r\n\f]*([>+~]|[\x20\t\r\n\f])[\x20\t\r\n\f]*/;
rcombinators.exec(' > div.seq h2 ~ p'); //[" > ", ">"]
rcombinators.exec(' ~ p'); //[" ~ ", "~"]
rcombinators.exec(' h2 ~ p'); //[" ", " "]
```

是不是看来 rcombinators 这个正则表达式，上面 tokens 那个数组的内容就完全可以看得懂了。

其实，如果看 jQuery 的源码，rcomma 和 rcombinators 并不是这样来定义的，而是用下面的方式来定义：

```javascript
var whitespace = "[\\x20\\t\\r\\n\\f]";
var rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
  rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),
  rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),
```

有的时候必须得要佩服 jQuery 中的做法，该简则简，该省则省，每一处代码都是极完美的。

还有两个对象，Expr 和 matchExpr，Expr 是一个非常关键的对象，它涵盖了几乎所有的可能的参数，比较重要的参数比如有：

```javascript
Expr.filter = {
  "TAG": function(){...},
  "CLASS": function(){...},
  "ATTR": function(){...},
  "CHILD": function(){...},
  "ID": function(){...},
  "PSEUDO": function(){...}
}
Expr.preFilter = {
  "ATTR": function(){...},
  "CHILD": function(){...},
  "PSEUDO": function(){...}
}
```

这个 filter 和 preFilter 是处理 type=TAG 的关键步骤，包括一些类似于 input[type=text] 也是这几个函数处理，也比较复杂，我本人是看迷糊了。还有 matchExpr 正则表达式：

```javascript
var identifier = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",
    attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
    // Operator (capture 2)
    "*([*^$|!~]?=)" + whitespace +
    // "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
    "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
    "*\\]",
    pseudos = ":(" + identifier + ")(?:\\((" +
    // To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
    // 1. quoted (capture 3; capture 4 or capture 5)
    "('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
    // 2. simple (capture 6)
    "((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
    // 3. anything else (capture 2)
    ".*" +
    ")\\)|)",
    booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped";
var matchExpr = {
  "ID": new RegExp( "^#(" + identifier + ")" ),
  "CLASS": new RegExp( "^\\.(" + identifier + ")" ),
  "TAG": new RegExp( "^(" + identifier + "|[*])" ),
  "ATTR": new RegExp( "^" + attributes ),
  "PSEUDO": new RegExp( "^" + pseudos ),
  "CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
    "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
    "*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
  "bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
  // For use in libraries implementing .is()
  // We use this for POS matching in `select`
  "needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
    whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
}
```

matchExpr 作为正则表达式对象，其 key 的每一项都是一个 type 类型，将 type 匹配到，交给后续函数处理。

tokensize 源码如下：

```javascript
var tokensize = function (selector, parseOnly) {
  var matched, match, tokens, type, soFar, groups, preFilters, cached = tokenCache[selector + " "];
  // tokenCache 表示 token 缓冲，保持已经处理过的 token
  if (cached) {
    return parseOnly ? 0 : cached.slice(0);
  }

  soFar = selector;
  groups = [];
  preFilters = Expr.preFilter;

  while (soFar) {

    // 判断一个分组是否结束
    if (!matched || (match = rcomma.exec(soFar))) {
      if (match) {
        // 从字符串中删除匹配到的 match
        soFar = soFar.slice(match[0].length) || soFar;
      }
      groups.push((tokens = []));
    }

    matched = false;

    // 连接符 rcombinators
    if ((match = rcombinators.exec(soFar))) {
      matched = match.shift();
      tokens.push({
        value: matched,
        type: match[0].replace(rtrim, " ")
      });
      soFar = soFar.slice(matched.length);
    }

    // 过滤，Expr.filter 和 matchExpr 都已经介绍过了
    for (type in Expr.filter) {
      if ((match = matchExpr[type].exec(soFar)) && (!preFilters[type] || (match = preFilters[type](match)))) {
        matched = match.shift();
        // 此时的 match 实际上是 shift() 后的剩余数组
        tokens.push({
          value: matched,
          type: type,
          matches: match
        });
        soFar = soFar.slice(matched.length);
      }
    }

    if (!matched) {
      break;
    }
  }

  // parseOnly 这个参数应该以后会用到
  return parseOnly ? 
    soFar.length : 
    soFar ? 
      Sizzle.error(selector) :
      // 存入缓存
      tokenCache(selector, groups).slice(0);
}
```

不仅数组，字符串也有 slice 操作，而且看源码的话，jQuery 中对字符串的截取，使用的都是 slice 方法。

如果此时 parseOnly 不成立，则返回结果需从 tokenCache 这个函数中来查找：

```javascript
var tokenCache = createCache();
function createCache() {
  var keys = [];

  function cache( key, value ) {
    // Expr.cacheLength = 50
    if ( keys.push( key + " " ) > Expr.cacheLength ) {
      // 删，最不经常使用
      delete cache[ keys.shift() ];
    }
    // 整个结果返回的是 value
    return (cache[ key + " " ] = value);
  }
  return cache;
}
```

可知，返回的结果是 groups，tokensize 就学完了，下章将介绍 tokensize 的后续。

## 总结

对于一个复杂的 selector，其 tokensize 的过程远比今天介绍的要复杂，今天的例子有点简单（其实也比较复杂了），后面的内容更精彩。

## 参考

>[jQuery 2.0.3 源码分析Sizzle引擎 - 词法解析](http://www.cnblogs.com/aaronjs/p/3300797.html)

>[CSS 选择器参考手册](http://www.w3school.com.cn/cssref/css_selectors.asp)