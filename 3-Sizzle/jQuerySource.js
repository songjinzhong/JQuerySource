/*
 * jQuery.fn.pushStack
 *
 */
jQuery.fn.pushStack = function (elems) {

    // Build a new jQuery matched element set
    var ret = jQuery.merge(this.constructor(), elems);

    // Add the old object onto the stack (as a reference)
    ret.prevObject = this;

    // Return the newly-formed element set
    return ret;
}

/*
 * jQuery.contains
 */
jQuery.contains = function (context, elem) {
    // Set document vars if needed
    if ((context.ownerDocument || context) !== document) {
        setDocument(context);
    }
    return contains(context, elem);
}

/*
 * contains
 */
var contains =  function (a, b) {
    var adown = a.nodeType === 9 ? a.documentElement : a,
    bup = b && b.parentNode;
    return a === bup || !!(bup && bup.nodeType === 1 && (
    adown.contains ? adown.contains(bup) : a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16));
}

/*
 * jQuery.uniqueSort
 */
jQuery.uniqueSort = function (results) {
    var elem, duplicates = [],
        j = 0,
        i = 0;

    // Unless we *know* we can detect duplicates, assume their presence
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
            results.splice(duplicates[j], 1);
        }
    }

    // Clear input after sorting to release objects
    // See https://github.com/jquery/sizzle/pull/225
    sortInput = null;

    return results;
}

/*
 * push
 */
var push = arr.push;
