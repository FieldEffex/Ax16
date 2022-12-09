function inlay(l, code) {
    for (let i = 0; i < code.length; i++)
        if (code[i] == "1")
            l.l.push(1);
        else if (code[i] == "0")
            l.l.push(0);
        else
            throw new Error("Invalid code");
}

function registerToBin(name, aarch) {
    let hexDecimal = parseInt(name, 16);
    let binary = hexDecimal.toString(2);

    if (hexDecimal > Math.pow(2, aarch) - 1) {
        console.log("Error: Invalid register: " + name);
        console.log("-- Expected " + aarch + " bits, got " + binary.length);
        process.exit(1);
    }

    const padding = "0".repeat(aarch - binary.length) + binary;
    let registerWidth = 0;

    if (hexDecimal > 0 && hexDecimal < 256) registerWidth = 8;
    else if (hexDecimal > 255 && hexDecimal < 65536) registerWidth = 16;
    else if (hexDecimal > 65535 && hexDecimal < 4294967296) registerWidth = 32;
    else if (hexDecimal > 4294967295 && hexDecimal < 18446744073709551616) registerWidth = 64;
    else if (hexDecimal > 18446744073709551615 && hexDecimal < 340282366920938463463374607431768211456) registerWidth = 128;
    else if (hexDecimal > 340282366920938463463374607431768211455 && hexDecimal < 115792089237316195423570985008687907853269984665640564039457584007913129639936) registerWidth = 256;
    
    return {
        bin: padding,
        width: registerWidth,
        dec: hexDecimal,
        raw: name
    };
}

function getDataHex(hex, bitGuard = 16) {
    hex = hex.replace(new RegExp("0x", "g"), "");
    let hexBitsCount = hex.length * 4;
    let hexAsBinary1s0s = "";
    let hexAsBinary1s0sGuarded = "";

    for (let i = 0; i < hex.length; i++) {
        const hexChar = hex[i];
        const hexCharAsBinary = parseInt(hexChar, 16).toString(2);
        const hexCharAsBinaryWithPadding = "0000".substr(hexCharAsBinary.length) + hexCharAsBinary;
        hexAsBinary1s0s += hexCharAsBinaryWithPadding;
    }

    // The guarded hex is basilcly the same as hexAsBinary1s0s, but it has filler 0s to meet the value inside bit guard.
    // For example, if the hexAxBinary1s0s is 1010, and the bit guard is 16, then the guarded hex is 0000000000001010.

    if (hexBitsCount < bitGuard) {
        const filler = "0".repeat(bitGuard - hexBitsCount);
        hexAsBinary1s0sGuarded = filler + hexAsBinary1s0s;
        hexBitsCount = bitGuard;
    } else {
        hexAsBinary1s0sGuarded = hexAsBinary1s0s;
    }

    return {
        bits: hexBitsCount,
        raw: hex,
        binary: hexAsBinary1s0s,
        guard: hexAsBinary1s0sGuarded
    };
}

exports.execute = (l, bits, node, ast) => {
    const code = node.instruction.replace(new RegExp("\t", "g"), "");
    const param = node.params.map((param) => param.param);

    // remove commas from param values
    for (let i = 0; i < param.length; i++) {
        param[i] = param[i].replace(new RegExp(",", "g"), "");
    }
    
    if (bits == 16) {
        if (code == "noop") {
            inlay(l, "0000000000000000");
        } 
        else if (code == "halt") {
            inlay(l, "0000000000000001");
        }
        else if (code == "jump") {
            inlay(l, "0000000000000010");
            
            if (param.length != 1) {
                console.log("Error: Invalid number of parameters for instruction: " + code);
                console.log("-- Expected 1, got " + param.length)
                process.exit(1);
            }

            if (param[0].startsWith("0x")) {
                const data = getDataHex(param[0]);
                if (data.bits > bits) {
                    console.log("Error: Invalid parameter for instruction: " + code);
                    console.log("-- Expected " + bits + " bits, got " + data.bits);
                    process.exit(1);
                }

                inlay(l, data.guard);
            } else if (param[0].startsWith(":")) {
                param[0] = param[0].replace(new RegExp(":", "g"), "");
                
                // This is calling a function, we must check to see if the function even exists
                let firstInstruction = ast.find((node) => node.label == param[0]);
                if (!firstInstruction) {
                    console.log("Error: Invalid parameter for instruction: " + code);
                    console.log("-- Function " + param[0] + " might exist but it was not in the AST");
                    process.exit(1);
                }

                // Now lets get the index of the first instruction
                let firstInstructionIndex = ast.indexOf(firstInstruction);

                // Due to parameters also having their own address plus the fact that the AST doesnt directly include the params and insets them inside the nodes, we have to add an offset with an algorithm loop
                let offsetDueToParams = 0;
                for (let i = 0; i < firstInstructionIndex; i++) {
                    const node = ast[i];
                    if (node.params) {
                        offsetDueToParams += node.params.length;
                    }
                }

                firstInstructionIndex += offsetDueToParams;

                // Transform index into binary
                const firstInstructionIndexAsBinary = firstInstructionIndex.toString(2);
                const firstInstructionIndexAsBinaryWithPadding = "0000000000000000".substr(firstInstructionIndexAsBinary.length) + firstInstructionIndexAsBinary;

                inlay(l, firstInstructionIndexAsBinaryWithPadding);
            } else {
                console.log("Error: Invalid parameter for instruction: " + code);
                console.log("-- Expected a hex value or a function name");
                process.exit(1);
            }
        }
        else if (code == "move_v") {
            inlay(l, "0000000000000011");

            if (param.length != 2) {
                console.log("Error: Invalid number of parameters for instruction: " + code);
                console.log("-- Expected 2, got " + param.length)
                process.exit(1);
            }

            if (!param[0].startsWith("@")) {
                console.log("Error: Invalid parameter for instruction: " + code);
                console.log("-- Expected a register, got " + param[0]);
                process.exit(1);
            }

            // The bit size is the number in param[0] the actual register identifier is just a capital letter so a 16 bit A register is @16A
            let withoutPrefix = param[0].replace(new RegExp("@", "g"), "");
            let bin = registerToBin(withoutPrefix, bits);

            if (bin.width > bits) {
                console.log("Error: Invalid parameter for instruction: " + code);
                console.log("-- Expected " + bits + " bits, got " + bin.width);
                process.exit(1);
            }

            inlay(l, bin.bin);
            
            if (param[1].startsWith("0x")) {
                const data = getDataHex(param[1]);
                if (data.bits > bits) {
                    console.log("Error: Invalid parameter for instruction: " + code);
                    console.log("-- Expected " + bits + " bits, got " + data.bits);
                    process.exit(1);
                }

                inlay(l, data.guard);
            } else {
                console.log("Error: Invalid parameter for instruction: " + code);
                console.log("-- Expected a hex value or a register");
                process.exit(1);
            }
        }
        else if (code == "move_r") {
            inlay(l, "0000000000000100");

            if (param.length != 2) {
                console.log("Error: Invalid number of parameters for instruction: " + code);
                console.log("-- Expected 2, got " + param.length)
                process.exit(1);
            }

            if (!param[0].startsWith("@")) {
                console.log("Error: Invalid parameter for instruction: " + code);
                console.log("-- Expected a register, got " + param[0]);
                process.exit(1);
            }

            // The bit size is the number in param[0] the actual register identifier is just a capital letter so a 16 bit A register is @16A
            let withoutPrefix = param[0].replace(new RegExp("@", "g"), "");
            let bin = registerToBin(withoutPrefix, bits);

            if (bin.width > bits) {
                console.log("Error: Invalid parameter for instruction: " + code);
                console.log("-- Expected " + bits + " bits, got " + bin.width);
                process.exit(1);
            }

            inlay(l, bin.bin);

            if (!param[1].startsWith("@")) {
                console.log("Error: Invalid parameter for instruction: " + code);
                console.log("-- Expected a register, got " + param[1]);
                process.exit(1);
            }

            // The bit size is the number in param[1] the actual register identifier is just a capital letter so a 16 bit A register is @16A
            withoutPrefix = param[1].replace(new RegExp("@", "g"), "");
            bin = registerToBin(withoutPrefix, bits);

            if (bin.width > bits) {
                console.log("Error: Invalid parameter for instruction: " + code);
                console.log("-- Expected " + bits + " bits, got " + bin.width);
                process.exit(1);
            }

            inlay(l, bin.bin);
        }
        else {
            console.log("Error: Unsupported instruction: " + code);
            process.exit(1);
        }
    }
    else if (bits == 32) {
        if (code == "noop") {
            inlay(l, "00000000000000000000000000000000");
        }
        else if (code == "halt") {
            inlay(l, "00000000000000000000000000000001");
        }
        else if (code == "jump") {
            inlay(l, "00000000000000000000000000000010");

            if (param.length != 1) {
                console.log("Error: Invalid number of parameters for instruction: " + code);
                console.log("-- Expected 1, got " + param.length)
                process.exit(1);
            }

            if (param[0].startsWith("0x")) {
                const data = getDataHex(param[0]);
                if (data.bits > bits) {
                    console.log("Error: Invalid parameter for instruction: " + code);
                    console.log("-- Expected " + bits + " bits, got " + data.bits);
                    process.exit(1);
                }

                inlay(l, data.guard);
            } else if (param[0].startsWith(":")) {
                param[0] = param[0].replace(new RegExp(":", "g"), "");

                // This is calling a function, we must check to see if the function even exists
                let firstInstruction = ast.find((node) => node.label == param[0]);
                if (!firstInstruction) {
                    console.log("Error: Invalid parameter for instruction: " + code);
                    console.log("-- Function " + param[0] + " might exist but it was not in the AST");
                    process.exit(1);
                }

                // Now lets get the index of the first instruction
                let firstInstructionIndex = ast.indexOf(firstInstruction);

                // Due to parameters also having their own address plus the fact that the AST doesnt directly include the params and insets them inside the nodes, we have to add an offset with an algorithm loop
                let offsetDueToParams = 0;
                for (let i = 0; i < firstInstructionIndex; i++) {
                    const node = ast[i];

                    if (node.params) {
                        offsetDueToParams += node.params.length;
                    }
                }

                firstInstructionIndex += offsetDueToParams;

                // Transform index into binary
                const firstInstructionIndexAsBinary = firstInstructionIndex.toString(2);
                const firstInstructionIndexAsBinaryWithPadding = "00000000000000000000000000000000".substr(firstInstructionIndexAsBinary.length) + firstInstructionIndexAsBinary;

                inlay(l, firstInstructionIndexAsBinaryWithPadding);
            } else {
                console.log("Error: Invalid parameter for instruction: " + code);
                console.log("-- Expected a hex value or a function name");
                process.exit(1);
            }
        }
        else if (code == "move_v") {
            inlay(l, "00000000000000000000000000000011");

            if (param.length != 2) {
                console.log("Error: Invalid number of parameters for instruction: " + code);
                console.log("-- Expected 2, got " + param.length)
                process.exit(1);
            }

            if (!param[0].startsWith("@")) {
                console.log("Error: Invalid parameter for instruction: " + code);
                console.log("-- Expected a register, got " + param[0]);
                process.exit(1);
            }

            // The bit size is the number in param[0] the actual register identifier is just a capital letter so a 16 bit A register is @16A
            let withoutPrefix = param[0].replace(new RegExp("@", "g"), "");
            let bin = registerToBin(withoutPrefix, bits);

            if (bin.width > bits) {
                console.log("Error: Invalid parameter for instruction: " + code);
                console.log("-- Expected " + bits + " bits, got " + bin.width);
                process.exit(1);
            }

            inlay(l, bin.bin);

            if (param[1].startsWith("0x")) {
                const data = getDataHex(param[1], bits);
                if (data.bits > bits) {
                    console.log("Error: Invalid parameter for instruction: " + code);
                    console.log("-- Expected " + bits + " bits, got " + data.bits);
                    process.exit(1);
                }

                inlay(l, data.guard);
            } else {
                console.log("Error: Invalid parameter for instruction: " + code);
                console.log("-- Expected a hex value or a register");
                process.exit(1);
            }
        }
    }
    else {
        console.log("Error: Unsupported bit mode");
        process.exit(1);
    }
};
