pragma circom 2.0.0;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/eddsaposeidon.circom"; // For signature verification

template ZKAuthaaS() {
    // --- Private Inputs (Witness) ---
    signal input sk;             // User Secret Key [cite: 368]
    signal input r;              // Randomness for commitment [cite: 368]
    signal input c;              // Commitment value [cite: 368]
    signal input sigma_R8[2];          // Issuer's signature on commitment [cite: 368]
    signal input sigma_S;

    // --- Public Inputs ---
    signal input IPK[2];            // Issuer Public Key [cite: 368]
    signal input domainID;       // Application Domain Identifier [cite: 368]
    signal input challenge;      // Random nonce for session freshness [cite: 368]
    signal input pseudoID;       // Derived pseudonymous identifier [cite: 368]
    signal input sessionNullifier; // Replay protection identifier [cite: 368]

    // --- 1. Credential Binding ---
    // In practice, this verifies c = Commit(sk, r). 
    // The paper specifies Pedersen, but Poseidon is standard for SNARK efficiency.
    component commitHasher = Poseidon(2);
    commitHasher.inputs[0] <== sk;
    commitHasher.inputs[1] <== r;
    commitHasher.out === c; // Constraint: sk and r must match the signed commitment [cite: 276, 788]

    // --- 2. Signature Verification ---
    // Verifies that the Issuer signed the commitment 'c' using IPK.
    // This proves the user has a valid credential from a trusted authority[cite: 810].
    // Note: Standard EdDSA verification template would be used here.
    
    
    component sigVerifier = EdDSAPoseidonVerifier();
    sigVerifier.enabled <== 1;
    sigVerifier.Ax <== IPK[0];
    sigVerifier.Ay <== IPK[1];
    sigVerifier.R8x <== sigma_R8[0];
    sigVerifier.R8y <== sigma_R8[1];
    sigVerifier.S <== sigma_S;
    sigVerifier.M <== c;
    

    // --- 3. PseudoID Generation ---
    // PseudoID = H(sk || domainID) [cite: 321, 368]
    component pseudoHasher = Poseidon(2);
    pseudoHasher.inputs[0] <== sk;
    pseudoHasher.inputs[1] <== domainID;
    pseudoHasher.out === pseudoID; // Constraint: Link user to this specific domain anonymously

    // --- 4. Session Freshness (Replay Protection) ---
    // Session Nullifier = H(sk || challenge) [cite: 321, 368, 682]
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== sk;
    nullifierHasher.inputs[1] <== challenge;
    nullifierHasher.out === sessionNullifier; // Constraint: One-time use per challenge
}

component main {public [IPK, domainID, challenge, pseudoID, sessionNullifier]} = ZKAuthaaS();