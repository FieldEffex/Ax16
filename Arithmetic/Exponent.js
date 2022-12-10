const advancedInfinityMultiplier = require("./Multiply.js");
const advancedInfinitySubtractor = require("./Subtract.js");

/**
 * This function can not only handle numbers as strings but also can work on numbers that are
 * larger than the 64 bit binary store range. This algorithm is much slower and heavier, but is
 * much more accurate. This is used to power a number.
 * @note Avoid using this function if you can. Only use it if there is a good chance of large numbers.
 * @author @xlangk
 * @library This arithmetic cell is part of the FieldEffex Pre Bootstrapped Compiler Utils, written
 * in NodeJS runtime language.
 * @param {string} source
 * @param {string} expo
 */
module.exports = function advancedInfinityExponentiator(source = "1", expo = "1") {
    let sum = "1";

    while (expo != "0") {
        sum = advancedInfinityMultiplier(sum, source);
        expo = advancedInfinitySubtractor(expo, "1");
    }

    return sum;
}
