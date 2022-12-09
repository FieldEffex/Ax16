#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const args = process.argv.slice(2);
const bitDev = require("./BitDev.js");

const indent = "\t";

if (args.length != 1) {
    console.log("Usage: axsm <filename>");
    process.exit(1);
}

let fileBuffer = null;

try {
    const filename = args[0];
    fileBuffer = fs.readFileSync(path.join(process.cwd(), filename));
} catch (err) {
    console.log("Failed to retreive file at path: " + path.join(__dirname, args[0]));
    console.log("-- Error: " + err.message);

    process.exit(1);
}

if (fs.lstatSync(path.join(process.cwd(), args[0])).isDirectory()) {
    console.log("Cannot compile directory. Please provide a file path.");
    process.exit(1);
}

if (!args[0].endsWith(".axsm")) {
    console.log("File must end with .axsm");
    process.exit(1);
}

const file = fileBuffer.toString();
const words = file.replace(new RegExp("\n", "g"), " ").replace(new RegExp("\r", "g"), " ").split(" ").filter((word) => word != "");

const binaryOutput = [];
const ast = [];

let flagsEnd = false;
let currentLabel = null;
let currentFlag = null;

let counter = 0;
while (counter < words.length) {
    const word = words[counter];
    const instruction = word.startsWith("\t") && !word.endsWith(":");
    const label = !instruction && word.endsWith(":");
    const flag = !instruction && !label && !flagsEnd;
    
    if (label) {
        flagsEnd = true;
        currentLabel = word.replace(new RegExp(":", "g"), "");
    } else if (!flagsEnd) {
        if (flag) {
            currentFlag = word.replace(new RegExp(":", "g"), "");
            ast.push({
                type: "flag",
                flag: currentFlag,
                value: words[counter + 1]
            });

            counter++;
        }
    } else if (instruction) {
        ast.push({
            type: "instruction",
            instruction: word,
            label: currentLabel,
            params: []
        });
    } else {
        ast.push({
            type: "param",
            param: word
        });
    }

    counter++;
}

// Add in params
for (let i = 0; i < ast.length; i++) {
    const node = ast[i];
    if (node.type == "instruction") {
        let j = i + 1;
        while (j < ast.length && ast[j].type != "instruction") {
            node.params.push(ast[j]);
            j++;
        }
    }
}

// Remove params from ast
for (let i = 0; i < ast.length; i++)
    if (ast[i].type == "param") {
        ast.splice(i, 1);
        i--;
    }

const flags = {};
let bits = 16;

ast.forEach((node) => {
    if (node.type == "flag") {
        flags[node.flag] = node.value;
    }
});

// Set bits
if (flags.bits) {
    bits = parseInt(flags.bits);
    if (bits < 16) {
        console.log("Bits must be atleast 16");
        process.exit(1);
    }

    // check multiple
    if (bits % 8 != 0) {
        console.log("Bits must be a multiple of 8");
        process.exit(1);
    }
}

// remove all flags
for (let i = 0; i < ast.length; i++)
    if (ast[i].type == "flag") {
        ast.splice(i, 1);
        i--;
    }

ast.forEach((node) => {
    const bitsList = [];
    bitDev.execute({l: bitsList}, bits, node);
        
    const bytes = [];
    // take 8 bit chunks and convert them to base 10 numbers and add to bytes
    for (let i = 0; i < bitsList.length; i += 8) {
        const bits = bitsList.slice(i, i + 8);
        bytes.push(parseInt(bits.join(""), 2));
    }

    // add to binary output
    bytes.forEach((byte) => binaryOutput.push(byte));
});

console.log("Assembled program successfully");
console.log("-- Bytes: " + Buffer.from(binaryOutput).length);
console.log("-- Bits: " + Buffer.from(binaryOutput).length * 8);
console.log("-- Segments: " + Buffer.from(binaryOutput).length / (bits / 8));
console.log("");
console.log("Assembler data:");
console.log("-- Bits: " + bits);
console.log("-- Instructions: " + ast.length);

// Write file to directry where axsm file exists, but this time without extension
const filename = args[0].replace(new RegExp(".axsm", "g"), "");
fs.writeFileSync(path.join(process.cwd(), filename), Buffer.from(binaryOutput));