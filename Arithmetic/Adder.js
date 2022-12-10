/**
 * This function can not only handle numbers as strings but also can work on numbers that are
 * larger than the 64 bit binary store range. This algorithm is much slower and heavier, but is
 * much more accurate. 
 * @note Avoid using this function if you can. Only use it if there is a good chance of large numbers.
 * @author @xlangk
 * @library This arithmetic cell is part of the FieldEffex Pre Bootstrapped Compiler Utils, written
 * in NodeJS runtime language.
 * @param {string} a 
 * @param {string} b 
 */
module.exports = function advancedInfinityAdder(a = "1", b = "1") {
    let cary = 0;

    a = a.toString();
    b = b.toString();
    a = a.replace(/ /g, "").replace(/,/g, "");
    b = b.replace(/ /g, "").replace(/,/g, "");

    const top = [];
    const bottom = [];
    const sum = [];

    const longest = a.length > b.length ? a : b;
    const other = a.length > b.length ? b : a;

    for (let i = 0; i < longest.length; i++) {
        top.push(longest[i]);
    }

    for (let i = 0; i < longest.length - other.length; i++) {
        bottom.push("0");
    }

    for (let i = 0; i < other.length; i++) {
        bottom.push(other[i]);
    }

    for (let i = top.length - 1; i >= 0; i--) {
        const rowSum = (parseInt(top[i]) + parseInt(bottom[i]) + cary).toString();
        let rowSumWithoutCary;
        
        if (rowSum.length > 1) {
            cary = parseInt(rowSum[0]);
            rowSumWithoutCary = rowSum[1];
        } else {
            cary = 0;
            rowSumWithoutCary = rowSum;
        }

        sum.push(rowSumWithoutCary);
    }

    if (cary > 0) {
        sum.push(cary);
    }

    return sum.reverse().join("");
}
