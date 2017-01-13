/*
 * rootjQuery
 */
var rootjQuery = jQuery( document );

/*
 * rquickExpr
 */
var rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/;

/*
 * jQuery.merge 
 *
 */

jQuery.merge = function (first, second) {
  var len = +second.length,
    j = 0,
    i = first.length;

  for (; j < len; j++) {
    first[i++] = second[j];
  }

  first.length = i;

  return first;
}

/*
 * jQuery.parseHTML
 *
 */
jQuery.parseHTML = function (data, context, keepScripts) {
    if (typeof data !== "string") {
        return [];
    }
    if (typeof context === "boolean") {
        keepScripts = context;
        context = false;
    }

    var base, parsed, scripts;

    if (!context) {

        // Stop scripts or inline event handlers from being executed immediately
        // by using document.implementation
        if (support.createHTMLDocument) {
            context = document.implementation.createHTMLDocument("");

            // Set the base href for the created document
            // so any parsed elements with URLs
            // are based on the document's URL (gh-2965)
            base = context.createElement("base");
            base.href = document.location.href;
            context.head.appendChild(base);
        } else {
            context = document;
        }
    }

    parsed = rsingleTag.exec(data);
    scripts = !keepScripts && [];

    // Single tag
    if (parsed) {
        return [context.createElement(parsed[1])];
    }

    parsed = buildFragment([data], context, scripts);

    if (scripts && scripts.length) {
        jQuery(scripts).remove();
    }

    return jQuery.merge([], parsed.childNodes);
}

/*
 * rsingleTag
 */

var rsingleTag = ( /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i );

/*
 * jQuery.attr
 *
 */
jQuery.attr = function (elem, name, value) {
    var ret, hooks, nType = elem.nodeType;

    // Don't get/set attributes on text, comment and attribute nodes
    if (nType === 3 || nType === 8 || nType === 2) {
        return;
    }

    // Fallback to prop when attributes are not supported
    if (typeof elem.getAttribute === "undefined") {
        return jQuery.prop(elem, name, value);
    }

    // Attribute hooks are determined by the lowercase version
    // Grab necessary hook if one is defined
    if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
        hooks = jQuery.attrHooks[name.toLowerCase()] || (jQuery.expr.match.bool.test(name) ? boolHook : undefined);
    }

    if (value !== undefined) {
        if (value === null) {
            jQuery.removeAttr(elem, name);
            return;
        }

        if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined) {
            return ret;
        }

        elem.setAttribute(name, value + "");
        return value;
    }

    if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
        return ret;
    }

    ret = jQuery.find.attr(elem, name);

    // Non-existent attributes return null, we normalize to undefined
    return ret == null ? undefined : ret;
}

/*
 * jQueyr.makeArray
 *
 */
jQuery.makeArray = function (arr, results) {
    var ret = results || [];

    if (arr != null) {
        if (isArrayLike(Object(arr))) {
            jQuery.merge(ret, typeof arr === "string" ? [arr] : arr);
        } else {
            push.call(ret, arr);
        }
    }

    return ret;
}

/*
 * _isAyyayLike
 */
function isArrayLike(obj) {

    // Support: real iOS 8.2 only (not reproducible in simulator)
    // `in` check used to prevent JIT error (gh-2145)
    // hasOwn isn't used here due to false negatives
    // regarding Nodelist length in IE
    var length = !!obj && "length" in obj && obj.length,
        type = jQuery.type(obj);

    if (type === "function" || jQuery.isWindow(obj)) {
        return false;
    }

    return type === "array" || length === 0 || typeof length === "number" && length > 0 && (length - 1) in obj;
}