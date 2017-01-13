## Sizzle 选择器

Sizzle 原本是 jQuery 中用来当作 DOM 选择器的，后来被 John Resig 单独分离出去，成为一个单独的项目，可以直接导入到项目中使用。[jquery/sizzle](https://github.com/jquery/sizzle)。

本来我们使用 jQuery 当作选择器，选定一些 #id 或 .class，使用 document.getElementById 或 document.getElemensByClassName 就可以很快锁定 DOM 所在的位置，然后返回给 jQuery 当作对象。但有时候会碰到一些比较复杂的选择 `div div.hot>span` 这类肯定用上面的函数是不行的，首先考虑到的是 `Element.querySelectorAll()` 函数，但这个函数存在严重的兼容性问题[MDN querySelectorAll](https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll)。这个时候 sizzle 就派上用场了。

init 函数介绍中已经说明白，没有介绍 find 函数，其本质上就是 Sizzle 函数在 jQuery 中的表现。这个函数在 jQuery 中两种存在形式，即原型和属性上分别有一个，先来看下 `jQuery.fn.find`:

```javascript
jQuery.fn.find = function (selector) {
  var i, ret, len = this.length,
    self = this;
  // 这段话真不知道是个什么的
  if (typeof selector !== "string") {
    // fn.pushStack 和 jquery.merge 很像，但是返回一个 jquery 对象，且
    // jquery 有个 prevObject 属性指向自己
    return this.pushStack(jQuery(selector).filter(function () {
      for (i = 0; i < len; i++) {
        // jQuery.contains(a, b) 判断 a 是否是 b 的父代
        if (jQuery.contains(self[i], this)) {
            return true;
        }
      }
    }));
  }

  ret = this.pushStack([]);

  for (i = 0; i < len; i++) {
    // 在这里引用到 jQuery.find 函数
    jQuery.find(selector, self[i], ret);
  }
  // uniqueSort 去重函数
  return len > 1 ? jQuery.uniqueSort(ret) : ret;
}
```

jQuery.fn.find 的用法一般在 `$('.test').find("span")`，所以此时的 this 是指向 $('.test') 的，懂了这一点，后面的东西自然而然就好理解了。

然后就是 `jQuery.find` 函数，本章的重点讨论部分。先来看一个正则表达式：

```javascript
var rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/;
rquickExpr.exec('#id') //["#id", "id", undefined, undefined]
rquickExpr.exec('div') //["div", undefined, "div", undefined]
rquickExpr.exec('.test') //[".test", undefined, undefined, "test"]
rquickExpr.exec('div p')// null
```

你可能会疑惑，rquickExpr 的名字已经出现过一次了。实际上 Sizzle 是一个闭包，这个 rquickExpr 变量是在 Sizzle 闭包内的，不会影响到 jQuery 全局。这个正则的作用主要是用来区分 tag、id 和 class，而且从返回的数组也有一定的规律，可以通过这个规律来判断 selector 具体是哪一种。

```javascript
jQuery.find = Sizzle;

function Sizzle(selector, context, results, seed) {
  var m, i, elem, nid, match, groups, newSelector, newContext = context && context.ownerDocument,

  // nodeType defaults to 9, since context defaults to document
  nodeType = context ? context.nodeType : 9;

  results = results || [];

  // Return early from calls with invalid selector or context
  if (typeof selector !== "string" || !selector || nodeType !== 1 && nodeType !== 9 && nodeType !== 11) {

    return results;
  }

  // Try to shortcut find operations (as opposed to filters) in HTML documents
  if (!seed) {

    if ((context ? context.ownerDocument || context : preferredDoc) !== document) {
      // setDocument 函数其实是用来将 context 设置成 document，考虑到浏览器的兼容性
      setDocument(context);
    }
    context = context || document;
    // true
    if (documentIsHTML) {

      // match 就是那个有规律的数组
      if (nodeType !== 11 && (match = rquickExpr.exec(selector))) {

        // selector 是 id 的情况
        if ((m = match[1])) {

          // Document context
          if (nodeType === 9) {
            if ((elem = context.getElementById(m))) {

              if (elem.id === m) {
                  results.push(elem);
                  return results;
              }
            } else {
              return results;
            }

          // 非 document 的情况
          } else {

            if (newContext && (elem = newContext.getElementById(m)) && contains(context, elem) && elem.id === m) {

                results.push(elem);
                return results;
            }
          }

        // selector 是 tagName 情况
        } else if (match[2]) {
            // 这里的 push：var push = arr.push
            push.apply(results, context.getElementsByTagName(selector));
            return results;

        // selector 是 class 情况
        } else if ((m = match[3]) && support.getElementsByClassName && context.getElementsByClassName) {

            push.apply(results, context.getElementsByClassName(m));
            return results;
        }
      }

      // 如果浏览器支持 querySelectorAll
      if (support.qsa && !compilerCache[selector + " "] && (!rbuggyQSA || !rbuggyQSA.test(selector))) {

        if (nodeType !== 1) {
          newContext = context;
          newSelector = selector;

          // qSA looks outside Element context, which is not what we want
          // Support: IE <=8,还是要考虑兼容性
        } else if (context.nodeName.toLowerCase() !== "object") {

          // Capture the context ID, setting it first if necessary
          if ((nid = context.getAttribute("id"))) {
            nid = nid.replace(rcssescape, fcssescape);
          } else {
            context.setAttribute("id", (nid = expando));
          }

          // Sizzle 词法分析的部分
          groups = tokenize(selector);
          i = groups.length;
          while (i--) {
            groups[i] = "#" + nid + " " + toSelector(groups[i]);
          }
          newSelector = groups.join(",");

          // Expand context for sibling selectors
          newContext = rsibling.test(selector) && testContext(context.parentNode) || context;
        }

        if (newSelector) {
          try {
            push.apply(results, newContext.querySelectorAll(newSelector));
            return results;
          } catch(qsaError) {} finally {
            if (nid === expando) {
                context.removeAttribute("id");
            }
          }
        }
      }
    }
  }

  // All others，select 函数和 tokenize 函数后文再谈
  return select(selector.replace(rtrim, "$1"), context, results, seed);
}
```

整个分析过程由于要考虑各种因素，包括效率和浏览器兼容性等，所以看起来非常长，但是逻辑一点都不难：先判断 selector 是否是非 string，然后正则 rquickExpr 对 selector 进行匹配，获得数组依次考虑 id、tagName 和 class 情况，这些都很简单，都是单一的选择，一般用浏览器自带的函数 getElement 即可解决。遇到复杂一点的，比如 `div div.show p`,先考虑 querySelectorAll 函数是否支持，然后考虑浏览器兼容 IE<8。若不支持，即交给 select 函数（下章）。

## Sizzle 的优势

Sizzle 使用的是从右向左的选择方式，这种方式效率更高。

浏览器在处理 html 的时候，先生成一个 DOM tree，解析完 css 之后，然后更加 css 和 DOM tess 生成一个 render tree。render tree 用于渲染，不是一一对应，如 `display:none` 的 DOM 就不会出现在 render tree 中。

如果从左到右的匹配方式，`div div.show p`，

1. 找到 div 节点，
2. 从 1 的子节点中找到 div 且 class 为 show 的 DOM，找不到则返回上一步
3. 从 2 的子节点中找到 p 元素，找不到则返回上一步

如果有一步找不到，向上回溯，直到遍历所有的 div，效率很低。

如果从右到左的方式，

1. 先匹配到所有的 p 节点，
2. 对 1 中的结果注意判断，若其父节点顺序出现 div.show 和 div，则保留，否则丢弃

因为子节点可以有若干个，而父节点只有一个，故从右向左的方式效率很高。

## 衍生的函数

### jQuery.fn.pushStack

`jQuery.fn.pushStack`是一个类似于 jQuery.merge 的函数，它接受一个参数，把该参数（数组）合并到一个 jQuery 对象中并返回，源码如下：

```javascript
jQuery.fn.pushStack = function (elems) {

  // Build a new jQuery matched element set
  var ret = jQuery.merge(this.constructor(), elems);

  // Add the old object onto the stack (as a reference)
  ret.prevObject = this;

  // Return the newly-formed element set
  return ret;
}
```

### jQuery.contains

这个函数是对 DOM 判断是否是父子关系，源码如下：

```javascript
jQuery.contains = function (context, elem) {
  // 考虑到兼容性，设置 context 的值
  if ((context.ownerDocument || context) !== document) {
    setDocument(context);
  }
  return contains(context, elem);
}

// contains 是内部函数，判断 DOM_a 是否是 DOM_b 的
var contains =  function (a, b) {
  var adown = a.nodeType === 9 ? a.documentElement : a,
  bup = b && b.parentNode;
  return a === bup || !!(bup && bup.nodeType === 1 && (
  adown.contains ? adown.contains(bup) : a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16));
}
```

### jQuery.uniqueSort

jQuery 的去重函数，但这个去重职能处理 DOM 元素数组，不能处理字符串或数字数组，来看看有什么特别的：

```javascript
jQuery.uniqueSort = function (results) {
  var elem, duplicates = [],
    j = 0,
    i = 0;

  // hasDuplicate 是一个判断是否有相同元素的 flag，全局
  hasDuplicate = !support.detectDuplicates;
  sortInput = !support.sortStable && results.slice(0);
  results.sort(sortOrder);

  if (hasDuplicate) {
    while ((elem = results[i++])) {
      if (elem === results[i]) {
          j = duplicates.push(i);
      }
    }
    while (j--) {
      // splice 用于将重复的元素删除
      results.splice(duplicates[j], 1);
    }
  }

  // Clear input after sorting to release objects
  // See https://github.com/jquery/sizzle/pull/225
  sortInput = null;

  return results;
}
```

sortOrder 函数如下，需要将两个函数放在一起理解才能更明白哦：

```javascript
var sortOrder = function (a, b) {

  // 表示有相同的元素，设置 flag 为 true
  if (a === b) {
    hasDuplicate = true;
    return 0;
  }

  // Sort on method existence if only one input has compareDocumentPosition
  var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
  if (compare) {
    return compare;
  }

  // Calculate position if both inputs belong to the same document
  compare = (a.ownerDocument || a) === (b.ownerDocument || b) ? a.compareDocumentPosition(b) :

  // Otherwise we know they are disconnected
  1;

  // Disconnected nodes
  if (compare & 1 || (!support.sortDetached && b.compareDocumentPosition(a) === compare)) {

    // Choose the first element that is related to our preferred document
    if (a === document || a.ownerDocument === preferredDoc && contains(preferredDoc, a)) {
        return -1;
    }
    if (b === document || b.ownerDocument === preferredDoc && contains(preferredDoc, b)) {
        return 1;
    }

    // Maintain original order
    return sortInput ? (indexOf(sortInput, a) - indexOf(sortInput, b)) : 0;
  }

  return compare & 4 ? -1 : 1;
}
```

## 总结

可以说今天先对 Sizzle 开个头，任重而道远！下面就会接受 Sizzle 中的 tokens 和 select 函数。

## 参考

[jQuery 2.0.3 源码分析Sizzle引擎 - 词法解析](http://www.cnblogs.com/aaronjs/p/3300797.html)