function inlay(l, code) {
    for (let i = 0; i < code.length; i++)
        if (code[i] == "1")
            l.l.push(1);
        else if (code[i] == "0")
            l.l.push(0);
        else
            throw new Error("Invalid code");
}

function registerToBin(name, bits, arch) {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // Only 256 letter combinations will be allowed
    // For 16 bits, 65565 - 256 = 65536 so we can use the same method 
    // for 32 bits, 4294967296 - 65535 - 256 = 4294901760 so we can use the same method
    // For 64 bits, 18446744073709551616 - 4294967296 - 65535 - 256 = 18446744069414584320 so we can use the same method
    
    // We need to design an algoirthm that can convert a number to a base 26 number
    // Here is how our numbering mapping system will work:
    // We use letters to represent numbers.

    // There are 26 letters, so from A-Z is 0-25
    // If we need to go to 26 we need to do ZA, so we need to add 1 to the first letter
    // The above can be solved like this, Z is 25 and A is 1, adding them together gives us 26

    // Alright lets make the algorithm
    
    // First we need to convert the number to base 26

    let values = [];
    for (let i = 0; i < name.length; i++) {
        const letter = name[i];
        const value = letters.indexOf(letter) + 1;
        values.push(value);
    }
        
    const sumOfAll = values.reduce((a, b) => a + b, 0);

    if (bits > arch) {
        throw new Error("Bit size is too large");
    }

    if (bits == 8) {
        if (sumOfAll > 256) {
            throw new Error("Register name value is too large");
        }

        let binary = sumOfAll.toString(2);
        let padded = "0".repeat(arch).substr(binary.length) + binary;
        return padded;
    }
    else if (bits == 16) {
        if (sumOfAll > 65536 || sumOfAll < 256) {
            throw new Error("Register name value is too large");
        }

        let binary = sumOfAll.toString(2);
        let padded = "0".repeat(arch).substr(binary.length) + binary;
        return padded;
    }
    else if (bits == 32) {
        if (sumOfAll > 4294901760 || sumOfAll < 65536) {
            throw new Error("Register name value is too large");
        }

        let binary = sumOfAll.toString(2);
        let padded = "0".repeat(arch).substr(binary.length) + binary;
        return padded;
    }
    else if (bits == 64) {
        if (sumOfAll > 18446744069414584320 || sumOfAll < 4294901760) {
            throw new Error("Register name value is too large");
        }

        let binary = sumOfAll.toString(2);
        let padded = "0".repeat(arch).substr(binary.length) + binary;
        return padded;
    }
    else {
        throw new Error("Invalid bit size");
    }
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
        else if (code == "move") {
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
            let registerBitSize = param[0].replace(new RegExp("@", "g"), "").replace(new RegExp("[A-Z]", "g"), "");
            let registerName = param[0].replace(new RegExp("@", "g"), "").replace(new RegExp("[0-9]", "g"), "");

            if (registerBitSize == "") {
                registerBitSize = "16";
            }

            let bitSize = 0;
            try {
                bitSize = parseInt(registerBitSize);
            } catch (e) {
                console.log("Error: Invalid parameter for instruction: " + code);
                console.log("-- Expected a register, got some garbage reference, got " + param[0]);
                process.exit(1);
            }

            if (bitSize < 8 || bitSize % 8 != 0) {
                console.log("Error: Invalid parameter for instruction: " + code);
                console.log("-- Expected a register bit size, but this is not a good unit, got " + param[0]);
                process.exit(1);
            }   

            let registerAsBin = registerToBin(registerName, bitSize, bits);
            if (registerAsBin == null) {
                console.log("Error: Invalid parameter for instruction: " + code);
                console.log("-- Expected a register, got some garbage reference, got " + param[0]);
                process.exit(1);
            }

            inlay(l, registerAsBin);

            if (param[1].startsWith("0x")) {
                const data = getDataHex(param[1]);
                if (data.bits > bits) {
                    console.log("Error: Invalid parameter for instruction: " + code);
                    console.log("-- Expected " + bits + " bits, got " + data.bits);
                    process.exit(1);
                }

                inlay(l, data.guard);
            }
            else if (param[1].startsWith("@")) {
                let registerBitSize = param[1].replace(new RegExp("@", "g"), "").replace(new RegExp("[A-Z]", "g"), "");
                let registerName = param[1].replace(new RegExp("@", "g"), "").replace(new RegExp("[0-9]", "g"), "");

                let data = registerAsBin(registerName, registerBitSize, bits);
                if (data == null) {
                    console.log("Error: Invalid parameter for instruction: " + code);
                    console.log("-- Expected a register, got some garbage reference, got " + param[1]);
                    process.exit(1);
                }

                inlay(l, data);
            }
        }
        else {
            console.log("Error: Unsupported instruction: " + code);
            process.exit(1);
        }
    }
    else {
        console.log("Error: Unsupported bit mode");
        process.exit(1);
    }
};
