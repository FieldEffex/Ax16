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

exports.execute = (l, bits, node) => {
    const code = node.instruction.replace(new RegExp("\t", "g"), "");
    const param = node.params.map((param) => param.param);
    
    if (bits == 16) {
        if (code == "nop") {
            inlay(l, "0000000000000000");
        } 
        else if (code == "jump") {
            inlay(l, "0000000000000001");
            
            if (param.length != 1) {
                console.log("Error: Invalid number of parameters for instruction: " + code);
                process.exit(1);
            }

            const data = getDataHex(param[0]);
            if (data.bits > bits) {
                console.log("Error: Invalid parameter for instruction: " + code);
                process.exit(1);
            }

            inlay(l, data.guard);
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
