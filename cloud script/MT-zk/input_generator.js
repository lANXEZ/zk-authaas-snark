const { buildPoseidon } = require("circomlibjs");
const fs = require("fs");

async function run() {
    // 1. Initialize Poseidon
    const poseidon = await buildPoseidon();
    const F = poseidon.F; // The Field helper

    const TREE_DEPTH = 20;
    
    // 2. Use BigInt for the secret leaf
    // We convert the result to an Object (BigInt) immediately to avoid type issues
    const secretValue = BigInt(12345);
    let leaf = poseidon([secretValue]);
    let leafAsBigInt = F.toObject(leaf);

    let pathElements = [];
    let pathIndices = [];
    let currentHash = leafAsBigInt; // Keep track as a BigInt

    for (let i = 0; i < TREE_DEPTH; i++) {
        // Generate a random sibling and ensure it's a BigInt
        const randomSiblingValue = BigInt(Math.floor(Math.random() * 1000000000));
        const siblingHash = poseidon([randomSiblingValue]);
        const siblingBigInt = F.toObject(siblingHash);
        
        const isRight = Math.round(Math.random());
        pathIndices.push(isRight);
        pathElements.push(siblingBigInt.toString());

        // Standardize inputs to BigInt for the next hash level
        let hashResult;
        if (isRight === 0) {
            // [Current, Sibling]
            hashResult = poseidon([currentHash, siblingBigInt]);
        } else {
            // [Sibling, Current]
            hashResult = poseidon([siblingBigInt, currentHash]);
        }
        
        // Update currentHash as a BigInt for the next iteration
        currentHash = F.toObject(hashResult);
    }

    const root = currentHash;

    const inputs = {
        root: root.toString(),
        leaf: leafAsBigInt.toString(),
        pathElements: pathElements,
        pathIndices: pathIndices
    };

    fs.writeFileSync("./input.json", JSON.stringify(inputs, null, 2));
    console.log("✅ Success: input.json generated!");
    console.log("Root:", inputs.root);
}

run().catch(console.error);