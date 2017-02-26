# jQuerySource
决定你走多远的是基础，jQuery 源码分析，向长者膜拜！

关于本源码的博客介绍：[标签 jQuery](http://yuren.space/blog/tags/jQuery/)。

## 目录

- Directory
  + [x] [01-总体架构](https://github.com/songjinzhong/JQuerySource/tree/master/01-%E6%80%BB%E4%BD%93%E6%9E%B6%E6%9E%84)- 只有弄懂整体架构，后面的学习才好办
  + [x] [02-init 构造器](https://github.com/songjinzhong/JQuerySource/tree/master/02-init%E6%9E%84%E9%80%A0%E5%99%A8)- 介绍 jQuery 的入口函数 init 的构造
  + [x] [03-Sizzle](https://github.com/songjinzhong/JQuerySource/tree/master/03-Sizzle)- Sizzle 再 jQuery 中的应用
  + [x] [04-Sizzle-Tokens](https://github.com/songjinzhong/JQuerySource/tree/master/04-Sizzle-Tokens)- 介绍 Sizzle 函数中的词法分析，即 tokensize 函数
  + [x] [05-Sizzle-select](https://github.com/songjinzhong/JQuerySource/tree/master/05-Sizzle-select)- 介绍 Sizzle 中的 select 函数，对词法分析的结果进行处理，生成 seed
  + [x] [06-Sizzle-compile](https://github.com/songjinzhong/JQuerySource/tree/master/06-Sizzle-compile)- 介绍 Sizzle 中的 compile 函数，用于生成 superMatcher，并通过 superMatcher，匹配 seed
  + [x] [07-Callbacks](https://github.com/songjinzhong/JQuerySource/tree/master/07-Callbacks)- 这里介绍 jQuery 中的回调函数 Callbacks
  + [x] [08-Data](https://github.com/songjinzhong/JQuerySource/tree/master/08-Data)- jQuery 中的缓存机制是什么样的，为什么不回造成内存泄漏，一起来见识见识
  + [x] [09-prevObject](https://github.com/songjinzhong/JQuerySource/tree/master/09-prevObject)- 你知道吗，jQuery 内部维护着一个对象栈
  + [x] [10-hooks](https://github.com/songjinzhong/JQuerySource/tree/master/10-hooks)- jQuery 里的一些原理，你不了解，就会觉得恐惧，当你熟悉了之后，就会发现非常有意思，比如 Hooks
  + [x] [11-event-main](https://github.com/songjinzhong/JQuerySource/tree/master/11-event-main)- 事件委托算是 jQuery 中被广泛使用一个性能较好的辅助函数，那么，它是一个什么样的架构
  + [x] [12-event-extend](https://github.com/songjinzhong/JQuerySource/tree/master/12-event-extend)- 还是回头去把一些基础扎实一点，才去解读源码吧
  + [x] [13-event-on](https://github.com/songjinzhong/JQuerySource/tree/master/13-event-on)- 分析一下 event 对象中两个重要的函数，add 和 dispatch
  + [x] [14-event-trigger](https://github.com/songjinzhong/JQuerySource/tree/master/14-event-trigger)- jQuery 也提供自定义事件 trigger 和 triggerHandler
  + [x] [15-dom-domManip](https://github.com/songjinzhong/JQuerySource/tree/master/15-dom-domManip)- 长久以来，jQuery 中 dom 操作就被人喜爱
  + [x] [16-dom-html](https://github.com/songjinzhong/JQuerySource/tree/master/16-dom-html)- 介绍一下 html 和 text 操作
  + [x] [17-css](https://github.com/songjinzhong/JQuerySource/tree/master/17-css)- css 在 jQuery 中的使用频率很高的
  + [x] [18-class](https://github.com/songjinzhong/JQuerySource/tree/master/18-class)- jQuery 中的 class 操作，包括 add，remove，has 和 toggle
  + [x] [19-ajax](https://github.com/songjinzhong/JQuerySource/tree/master/19-ajax)- jQuery 中的 ajax 方法介绍

我虽然接触 jQuery 很久了，但也只是局限于表面使用的层次，碰到一些问题，找到 jQuery 的解决办法，然后使用。**显然**，这种做法的弊端就是，无论你怎么学，都只能是个小白。

当我建立这个项目的时候，就表示，我要改变这一切了，做一些人想做，憧憬去做，但从没踏入第一步的事情，学习 jQuery 源码。

到目前为止，jQuery 的[贡献者团队](https://github.com/jquery/jquery)共 256 名成员，6000 多条 commits，可想而知，jQuery 是一个多么庞大的项目。jQuery [官方](https://jquery.com/)的版本目前是 v3.1.1，已经衍生出 jQueryUI、jQueryMobile 等多个项目。

虽然我在前端爬摸打滚一年多，自认基础不是很好，在没有外界帮助的情况下，直接阅读项目源码太难了，所以在边参考遍实践的过程中写下来这个项目。

**首先**，先推荐一个 jQuery 的[源码查询](http://james.padolsey.com/jquery/)网站，这个网站给初学者非常大的帮助，不仅能查找不同版本的 jQuery 源码，还能索引函数，功能简直吊炸天。

另外，推荐两个分析 jQuery 的博客：

>[jQuery源码分析系列](http://www.cnblogs.com/aaronjs/p/3279314.html)

>[[原创] jQuery1.6.1源码分析系列（停止更新）](http://www.cnblogs.com/nuysoft/archive/2011/11/14/2248023.html)

这两个博客给我了很大的帮助，谢谢。

另外还有下面的网址，让我在如何使用 jQuery 上得心应手：

>[jQuery API 中文文档](http://www.css88.com/jqapi-1.9/)