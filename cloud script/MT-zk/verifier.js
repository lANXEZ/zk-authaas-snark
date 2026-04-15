const snarkjs = require("snarkjs");
const fs = require("fs");

/**
 * Verifies a ZK proof using snarkjs
 * Requires: proof.json, public.json, verification_key.json
 */
async function verifyProof() {
    console.log("Verifying proof...");

    // 1. Load the proof and public signals
    const proof = JSON.parse(fs.readFileSync("outputs/proof.json", "utf8"));
    const publicSignals = JSON.parse(fs.readFileSync("outputs/public.json", "utf8"));

    // 2. Load the verification key
    const vKey = JSON.parse(fs.readFileSync("outputs/verification_key.json", "utf8"));

    // 3. Verify the proof
    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    // 4. Output result
    if (res === true) {
        console.log("✅ Verification Success!");
    } else {
        console.log("❌ Verification Failed!");
    }
}

verifyProof().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});