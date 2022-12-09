/**
 * This function can not only handle numbers as strings but also can work on numbers that are
 * larger than the 64 bit binary store range. This algorithm is much slower and heavier, but is
 * much more accurate. This is used to subtract 2 numbers.
 * @note Avoid using this function if you can. Only use it if there is a good chance of large numbers.
 * @author @xlangk
 * @library This arithmetic cell is part of the FieldEffex Pre Bootstrapped Compiler Utils, written
 * in NodeJS runtime language.
 * @param {string} from
 * @param {string} sub
 */
module.exports = function advancedInfinitySubtractor(from = "1", sub = "1") {
    let cary = 0;

    from = from.replace(/ /g, "").replace(/,/g, "");
    sub = sub.replace(/ /g, "").replace(/,/g, "");

    const top = [];
    const bottom = [];
    const sum = [];

    const longest = from.length > sub.length ? from : sub;
    const other = from.length > sub.length ? sub : from;

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
        const rowSum = (parseInt(top[i]) - parseInt(bottom[i]) - cary).toString();
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
