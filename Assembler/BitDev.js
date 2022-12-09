function inlay(l, code) {
    for (let i = 0; i < code.length; i++)
        if (code[i] == "1")
            l.l.push(1);
        else if (code[i] == "0")
            l.l.push(0);
        else
            throw new Error("Invalid code");
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
            } else {
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
