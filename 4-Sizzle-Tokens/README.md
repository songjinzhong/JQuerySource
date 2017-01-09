## Tokens 词法分析

其实词法分析是汇编里面提到的词汇，把它用到这里感觉略有不合适，但 Sizzle 中的 `tokensize`函数干的就是词法分析的活。

上一章我们已经讲到了 Sizzle 的用法，实际上就是 jQuery.find 函数，只不过还涉及到 jQuery.fn.find。jQuery.find 函数考虑的很周到，对于处理 #id、.class 和 TagName 的情况，都比较简单，通过一个正则表达式 `rquickExpr` 将内容给分开，如果浏览器支持 querySelectorAll，那更是最好的。

比较难的要数这种类似于 css 选择器的 selector，`div>div.seq p~h2,#jq h2`，如果使用从左向右的查找规则，效率很低，而从右向左，可以提高效率。

本章就来介绍 tokensize 函数，看看它是如何将复杂的 selector 处理成 tokens 的。