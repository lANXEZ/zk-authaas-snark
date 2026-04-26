const { buildPoseidon, buildEddsa } = require("circomlibjs");
const fs = require("fs");

async function generateInputs() {
    const poseidon = await buildPoseidon();
    const eddsa = await buildEddsa();

    // 1. User Secrets
    const sk = BigInt("12345678901234567890"); 
    const r = BigInt("98765432109876543210"); 
    
    // 2. Commitment (The Message 'M' to be signed)
    const cField = poseidon([sk, r]);
    const c = poseidon.F.toObject(cField);

    // 3. Issuer Setup
    // Use a fixed 32-byte array for the private key
    const issuerPrKey = new Uint8Array(32);
    for (let i = 0; i < 32; i++) issuerPrKey[i] = i; 
    
    const issuerPubKey = eddsa.prv2pub(issuerPrKey);
    
    // 4. SIGNING - This is where the mismatch usually happens
    // signPoseidon expects the raw field element output from Poseidon
    const signature = eddsa.signPoseidon(issuerPrKey, cField);

    // 5. Contextual Data
    const domainID = BigInt("111222333");
    const challenge = BigInt("444555666");
    const pseudoID = poseidon.F.toObject(poseidon([sk, domainID]));
    const sessionNullifier = poseidon.F.toObject(poseidon([sk, challenge]));

    // 6. Final Input Object
    const input = {
        "sk": sk.toString(),
        "r": r.toString(),
        "c": c.toString(),
        "sigma_R8": [
            eddsa.F.toObject(signature.R8[0]).toString(), 
            eddsa.F.toObject(signature.R8[1]).toString()
        ],
        "sigma_S": signature.S.toString(),
        "IPK": [
            eddsa.F.toObject(issuerPubKey[0]).toString(), 
            eddsa.F.toObject(issuerPubKey[1]).toString()
        ],
        "domainID": domainID.toString(),
        "challenge": challenge.toString(),
        "pseudoID": pseudoID.toString(),
        "sessionNullifier": sessionNullifier.toString()
    };

    fs.writeFileSync("input.json", JSON.stringify(input, null, 2));
    console.log("Success: input.json generated and signed.");
}

generateInputs().catch(console.error);