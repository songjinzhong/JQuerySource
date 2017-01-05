## Sizzle 选择器

Sizzle 原本是 jQuery 中用来当作 DOM 选择器的，后来被 John Resig 单独分离出去，成为一个单独的项目，可以直接导入到项目中使用。[jquery/sizzle](https://github.com/jquery/sizzle)。

关于 init 函数介绍中已经说明白，

本来我们使用 jQuery 当作选择器，选定一些 #id 或 .class，使用 document.getElementById 或 document.getElemensByClassName 就可以很快锁定 DOM 所在的位置，然后返回给 jQuery 当作对象。但有时候会碰到一些比较复杂的选择 `div div.hot>span` 这类肯定用上面的函数是不行的，首先考虑到的是