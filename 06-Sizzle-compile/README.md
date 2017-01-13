## compile

讲了这么久的 Sizzle，总感觉差了那么一口气，对于一个 selector，我们把它生成 tokens，进行优化，优化的步骤包括去头和生成 seed 集合。对于这些种子集合，我们知道最后的匹配结果是来自于集合中的一部分，似乎接下来的任务也已经明确：对种子进行过滤（或者称其为匹配）。

匹配的过程其实很简单，就是对 DOM 元素进行判断，而且弱是那种一代关系（>）或临近兄弟关系（+），不满足，就结束，若为后代关系（ ）或者兄弟关系（~），会进行多次判断，要么找到一个正确的，要么结束，不过仍需要考虑回溯问题。

比如`div > div.seq h2 ~ p`，已经对应的把它们划分成 tokens，如果每个 seed 都走一遍流程显然太麻烦。一种比较合理的方法就是对应每个可判断的 token 生成一个闭包函数，统一进行查找。

`Expr.filter` 是用来生成匹配函数的，它大概长这样：

```javascript
Expr.filter = {
  "ID": function(id){...},
  "TAG": function(nodeNameSelector){...},
  "CLASS": function(className){...},
  "ATTR": function(name, operator, check){...},
  "CHILD": function(type, what, argument, first, last){...},
  "PSEUDO": function(pseudo, argument){...}
}
```

看两个例子，一切都懂了：

```javascript
Expr.filter["ID"] = function( id ) {
  var attrId = id.replace( runescape, funescape );
  //这里返回一个函数
  return function( elem ) {
    return elem.getAttribute("id") === attrId;
  };
};
```

对 tokens 分析，让发现其 type 为 ID，则把其 id 保留，并返回一个检查函数，参数为 elem，用于判断该 DOM 的 id 是否与 tokens 的 id 一致。这种做法的好处是，编译一次，执行多次。

那么，是这样的吗？我们再来看看其他例子：

```javascript
Expr.filter["TAG"] = function( nodeNameSelector ) {
  var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
  return nodeNameSelector === "*" ?
    //返回一个函数
    function() { return true; } :
    // 参数为 elem
    function( elem ) {
      return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
    };
};

Expr.filter["ATTR"] = function( name, operator, check ) {
  // 返回一个函数
  return function( elem ) {
    var result = Sizzle.attr( elem, name );

    if ( result == null ) {
      return operator === "!=";
    }
    if ( !operator ) {
      return true;
    }

    result += "";

    return operator === "=" ? result === check :
      operator === "!=" ? result !== check :
      operator === "^=" ? check && result.indexOf( check ) === 0 :
      operator === "*=" ? check && result.indexOf( check ) > -1 :
      operator === "$=" ? check && result.slice( -check.length ) === check :
      operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
      operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
      false;
  };
},
```

最后的返回结果：

1. input[type=button] 属性 type 类型为 button；
2. input[type!=button] 属性 type 类型不等于 button；
3. input[name^=pre] 属性 name 以 pre 开头；
4. input[name*=new] 属性 name 中包含 new；
5. input[name$=ed] 属性 name 以 ed 结尾；
6. input[name=~=new] 属性 name 有用空格分离的 new；
7. input[name|=zh] 属性 name 要么等于 zh，要么以 zh 开头且后面有关连字符 -。

所以对于一个 token，

## compile 源码

