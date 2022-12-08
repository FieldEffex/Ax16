#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const args = process.argv.slice(2);

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

console.log(ast);