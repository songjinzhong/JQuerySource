## compile

讲了这么久的 Sizzle，总感觉差了那么一口气，对于一个 selector，我们把它生成 tokens，进行优化，优化的步骤包括去头和生成 seed 集合。对于这些种子集合，我们知道最后的匹配结果是来自于集合中的一部分，似乎接下来的任务也已经明确：对种子进行过滤（或者称其为匹配）。

匹配的过程其实很简单，就是对 DOM 元素进行判断，而且弱是那种一代关系（>）或临近兄弟关系（+），不满足，就结束，若为后代关系（ ）或者兄弟关系（~），会进行多次判断，要么找到一个正确的，要么结束，不过仍需要考虑回溯问题。

比如`div > div.seq h2 ~ p`，已经对应的把它们划分成 tokens，如果每个 seed 都走一遍流程显然太麻烦。一种比较合理的方法就是对应每个可选择 DOM 的 token 生成一个闭包函数，统一进行查找。

`Expr.filter` 是用来生成匹配函数的，它大概长这样：

```javascript
Expr.filter = {
  "ID": function(id){...},
  "TAG": function(nodeNameSelector){...},
  "CLASS": function(className){...},
  "ATTR": function(name, operator, check){...},
  "CHILD": function(type, what, argument, first, last){...}
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

我们先对