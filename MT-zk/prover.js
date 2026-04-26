const snarkjs = require("snarkjs");
const fs = require("fs");

async function generateProof() {
    console.log("--- Starting Prover Side Execution ---");

    // 1. Load the input.json (generated from your previous script)
    const inputPath = "inputs/input.json";
    if (!fs.existsSync(inputPath)) {
        console.error("Error: input.json not found. Run your input generation script first.");
        return;
    }
    const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));

    try {
        // 2. Full Prove: Generates both witness and proof in one step
        // We use Groth16 as it is the most common for ZK-AuthaaS implementations
        // Files required: 
        // - circuit.wasm (Compiled circuit)
        // - circuit_final.zkey (The Proving Key from Trusted Setup)
        
        console.log("Generating witness and calculating proof...");
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input, 
            "outputs/MT-zk_js/MT-zk.wasm", 
            "outputs/MT-zk_final.zkey"
        );

        // 3. Save the Proof
        // This is what the user sends to the Verifier (Application Server)
        fs.writeFileSync("outputs/proof.json", JSON.stringify(proof, null, 2));
        console.log("Proof generated and saved to proof.json");

        // 4. Save the Public Signals
        // These are the non-secret outputs (PseudoID, SessionNullifier, etc.)
        fs.writeFileSync("outputs/public.json", JSON.stringify(publicSignals, null, 2));
        console.log("Public signals saved to public.json");

        // --- OPTIONAL: Local Verification (To test before sending) ---
        // const vKey = JSON.parse(fs.readFileSync("outputs/verification_key.json"));
        // const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

        // if (res === true) {
        //     console.log("Local Verification Success: The proof is mathematically valid.");
        // } else {
        //     console.log("Local Verification Failed: Check your circuit logic or inputs.");
        // }

    } catch (error) {
        console.error("Prover Error:", error);
    }
}

generateProof().then(() => {
    process.exit(0);
});