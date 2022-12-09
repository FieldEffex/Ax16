const advancedInfinityAdder = require("./Adder.js");
const advancedInfinitySubtractor = require("./Subtract.js");

/**
 * This function can not only handle numbers as strings but also can work on numbers that are
 * larger than the 64 bit binary store range. This algorithm is much slower and heavier, but is
 * much more accurate. This is used to multiply 2 numbers.
 * @note Avoid using this function if you can. Only use it if there is a good chance of large numbers.
 * @author @xlangk
 * @library This arithmetic cell is part of the FieldEffex Pre Bootstrapped Compiler Utils, written
 * in NodeJS runtime language.
 * @param {string} source
 * @param {string} mul
 */
module.exports = function advancedInfinityMultiplier(source = "1", mul = "1") {
    let sum = "0";

    while (mul != "0") {
        sum = advancedInfinityAdder(sum, source);
        mul = advancedInfinitySubtractor(mul, "1");
    }

    return sum;
}
