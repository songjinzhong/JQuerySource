/*
 * jQuery 建立方法
 *
 */

var jQuery = function (selector, context) {

    // The jQuery object is actually just the init constructor 'enhanced'
    // Need init if jQuery is called (just allow error to be thrown if not included)
    return new jQuery.fn.init(selector, context);
}