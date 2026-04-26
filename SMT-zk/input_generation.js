const { buildPoseidon } = require("circomlibjs");
const fs = require("fs");

async function run() {
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    const TREE_DEPTH = 40;
    const key = BigInt(555); 
    const value = BigInt(987654321); 
    
    // 1. Precompute Zero Hashes using explicit field casting
    let zeroHashes = new Array(TREE_DEPTH + 1);
    
    // // F.e converts anything (string, number, bigint) into a proper Field Element
    zeroHashes[0] = poseidon([F.e("0")]); 
    
    for (let i = 0; i < TREE_DEPTH; i++) {
        // We pass the raw field elements directly
        zeroHashes[i + 1] = poseidon([zeroHashes[i], zeroHashes[i]]);
    }

    // // 2. Calculate Leaf Hash
    let currentHash = poseidon([F.e(value.toString())]);
    let siblings = [];
    
    // // 3. Generate Path logic
    for (let i = 0; i < TREE_DEPTH; i++) {
        const sibling = zeroHashes[i];
        
        // Save the sibling for the JSON (must be a string/BigInt for JSON)
        siblings.push(F.toObject(sibling).toString());

        // Direction: 0 for Left, 1 for Right
        const bit = Number((key >> BigInt(i)) & 1n);

        if (bit === 0) {
            currentHash = poseidon([currentHash, sibling]);
        } else {
            currentHash = poseidon([sibling, currentHash]);
        }
    }

    // // 4. Final conversion to BigInt strings for the circuit input
    const inputs = {
        root: F.toObject(currentHash).toString(),
        key: key.toString(),
        value: value.toString(),
        siblings: siblings
    };

    fs.writeFileSync("./input.json", JSON.stringify(inputs, null, 2));
    console.log("✅ Success! input.json generated.");
    console.log("Root:", inputs.root);
}

run().catch(err => {
    console.error("❌ Fatal Error:", err);
});