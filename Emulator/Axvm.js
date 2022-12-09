#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const advancedInfinityAdder = require("../Arithmetic/Adder.js");
const advancedInfinityMultiplier = require("../Arithmetic/Multiply.js");
const advancedInfinitySubtractor = require("../Arithmetic/Subtract.js");

const args = process.argv.slice(2);

function toBinary(int) {
    let binary = int.toString(2);
    binary = "0".repeat(bitsValue).substring(binary.length) + binary;
    return binary;
}

function fromBinary(bin) {
    return parseInt(bin, 2);
}

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

const maxRamAddresses = 200;
const bootInstructions = 128;

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
const disk = {}; // This is just like bytes, but for example if the mode is 16 bits, this will contain the same data as bytes but with 2 byte pairs.
let diskLen = 0;

disk.length = diskLen;

// Split into bytes
for (let i = 0; i < content.length; i += 8) {
    bytes.push(content.substring(i, i + 8));
}

// Pair bytes correctly
const chunksSizes = bitsValue / 8;
for (let i = 0; i < bytes.length; i += chunksSizes) {
    let chunk = "";
    for (let j = 0; j < chunksSizes; j++) {
        chunk += bytes[i + j];  
    }
    disk[toBinary(i / chunksSizes)] = chunk;
    disk.length++;
}

// Ram
const ram = {};

// Registers
const registersCount = 5;
const registers = {};

let programCounter = "0".repeat(bitsValue);

// Build registers
for (let i = 0; i < registersCount; i++) {
    const id = i.toString(2);
    const idWithBinaryPropper = "0".repeat(bitsValue).substring(id.length) + id;

    registers[idWithBinaryPropper] = idWithBinaryPropper;
}

// Build ram
for (let i = 0; i < maxRamAddresses; i++) {
    const id = i.toString(2);
    const idWithBinaryPropper = "0".repeat(bitsValue).substring(id.length) + id;

    ram[idWithBinaryPropper] = "0".repeat(bitsValue);
}

// Install program
if (disk.length > maxRamAddresses) {
    console.log("Program is too big to fit in ram.");
    process.exit(1);
}

if (disk.length < bootInstructions) {
    // Copy entire thing
    for (let i = 0; i < disk.length; i++) {
        ram[toBinary(i)] = disk[toBinary(i)];
    }
} else {
    // Copy boot bytes
    for (let i = 0; i < bootInstructions; i++) {
        ram[toBinary(i)] = disk[toBinary(i)];
    }
}

function to16BitBinary(bin) {
    // This function might recieve 8 bit binary, 16 bit binary, or any other 8 times multiple binary.
    // THis has to return the number as 16 bit binary. Even if it means losing data.

    // If it's 16 bit, return it
    if (bin.length == 16) {
        return bin;
    }

    // If it's 8 bit, return it with 8 0s in front
    if (bin.length == 8) {
        return "0".repeat(8) + bin;
    }

    // This is simple, reverse the binary input, then keep the first 16 and return it
    return bin.split("").reverse().join("").substring(0, 16).split("").reverse().join("");
}

function toIns(bin) {
    return fromBinary(to16BitBinary(bin));
}

console.log("Pre emulation");
console.log("-- Bits: " + bitsValue);
console.log("-- File: " + full);
console.log("-- Bit Count: " + content.length);
console.log("-- Ram (MB): " + (maxRamAddresses * bitsValue / 8 / 1024 / 1024));
console.log("-- Ram (Bytes): " + (maxRamAddresses * bitsValue / 8));
console.log("-- Disk (MB): " + (disk.length * bitsValue / 8 / 1024 / 1024));
console.log("-- Disk (Bytes): " + (disk.length * bitsValue / 8));
console.log("-- Boot sector used %d%s of ram", (bootInstructions / maxRamAddresses) * 100, "%");
console.log("");

while (true) {
    const data = ram[programCounter];
    const address = programCounter;        

    if (toIns(data) == 0) {
        // DO NOTHING
    }
    else if (toIns(data) == 1) {
        console.log("HALT CALL:");
        console.log("-- Virtual Machine Termination Call, from [PROGRAM] at address " + address);
        break;
    }
    else {
        console.log("UNKNOWN INSTRUCTION:");
        console.log("-- Instruction: " + toIns(data));
        console.log("-- Address: " + address);
        break;
    }

    // Incremement program counter
    programCounter = toBinary(fromBinary(programCounter) + 1);

    if (fromBinary(programCounter) >= maxRamAddresses) {
        break;
    }
}

console.log("");
console.log("Post emulation");
console.log("-- End address: %s", programCounter);

console.log(advancedInfinityMultiplier("1238123", "2"));