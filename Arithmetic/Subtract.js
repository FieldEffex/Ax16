/**
 * This function can not only handle numbers as strings but also can work on numbers that are
 * larger than the 64 bit binary store range. This algorithm is much slower and heavier, but is
 * much more accurate. This is used to subtract 2 numbers.
 * @note Avoid using this function if you can. Only use it if there is a good chance of large numbers.
 * @author @xlangk
 * @library This arithmetic cell is part of the FieldEffex Pre Bootstrapped Compiler Utils, written
 * in NodeJS runtime language.
 * @param {string} a
 * @param {string} b
 */
module.exports = function advancedInfinitySubtractor(a = "1", b = "1") {
    a = a.toString();
    b = b.toString();
    a = a.replace(/ /g, "").replace(/,/g, "");
    b = b.replace(/ /g, "").replace(/,/g, "");

    const top = [];
    const bottom = [];
    const out = [];

    let negative = false;

    if (b.length > a.length) {
        const temp = a;
        a = b;
        b = temp;
        negative = true;
    }

    for (let i = 0; i < a.length; i++)
        top.push(a[i]);
    for (let i = 0; i < a.length - b.length; i++)
        bottom.push("0");
    for (let i = 0; i < b.length; i++)
        bottom.push(b[i]);

    for (let i = bottom.length - 1; i >= 0; i--) {
        let diff = parseInt(top[i]) - parseInt(bottom[i]);

        if (diff < 0) {
            diff += 10;
            top[i - 1] = (parseInt(top[i - 1]) - 1).toString();
        }

        out.push(diff);
    }

    let foundBit = false;
    for (let i = out.length; i >= 0; i--) {
        if (out[i] != 0)
            foundBit = true;
        if (!foundBit)
            out.splice(i, 1);
    }

    if (negative)
        out.push("-");
    
    let str = out.reverse().join("");

    let allZero = true;
    for (let i = 0; i < str.length; i++) {
        if (str[i] != "0")
            allZero = false;
    }

    if (allZero)
        return "0";

    return str.length == 0 ? "0" : str;
}