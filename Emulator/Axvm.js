#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);

if (args.length != 2) {
    console.log("Usage: axvm <filename> <bits>");
    process.exit(1);
}

const name = args[0];
const bits = args[1];

if (fs.existsSync(path.join(process.cwd(), name))) {
    if (fs.lstatSync(path.join(process.cwd(), name)).isDirectory()) {
        console.log("Cannot compile directory. Please provide a file path.");
        process.exit(1);
    }
} else {
    console.log("File does not exist.");
    process.exit(1);
}

let bitsValue = 0;
try {
    bitsValue = parseInt(bits);
} catch (err) {
    console.log("Bits must be a number.");
    process.exit(1);
}

if (bitsValue != 8 && bitsValue != 16 && bitsValue != 32 && bitsValue != 64) {
    console.log("Bits must be 8, 16, 32, or 64.");
    process.exit(1);
}

const full = path.join(process.cwd(), name);
const contentsRaw = fs.readFileSync(full);

// Content binary data as 1s and 0s
let content = "";

for (let i = 0; i < contentsRaw.length; i++) {
    const byte = contentsRaw[i].toString(2);

    for (let j = 0; j < 8 - byte.length; j++) {
        content += "0";
    }

    content += byte;
}

const bytes = [];

// Split into bytes
for (let i = 0; i < content.length; i += 8) {
    bytes.push(content.substring(i, i + 8));
}

console.log(bytes)

console.log("Pre emulation");
console.log("-- Bits: " + bitsValue);
console.log("-- File: " + full);
console.log("-- Bit Count: " + content.length);