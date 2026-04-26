pragma circom 2.1.0;

// You must have circomlib installed: npm install circomlib
include "node_modules/circomlib/circuits/poseidon.circom";

/**
 * DualMux: Swaps inputs based on a selector bit.
 * If s == 0: out = in, out = in (Order: [Current, Sibling])
 * If s == 1: out = in, out = in (Order: [Sibling, Current])
 */
template DualMux() {
    signal input currHash;
    signal input pElement;
    signal input s;
    signal output leftout;
    signal output rightout;

    // Constraint: s must be 0 or 1
    s * (1 - s) === 0;

    leftout <== (pElement - currHash) * s + currHash;
    rightout <== (currHash-pElement) * s + pElement;
}

template MerkleTreeChecker(levels) {
    // Public Input: The Merkle Root of the set
    signal input root;

    // Private Inputs: The user's secret leaf and the proof path
    signal input leaf;
    signal input pathElements[levels]; // Sibling nodes
    signal input pathIndices[levels];  // 0 if current hash is left, 1 if right

    // Intermediate signals to store hashes at each level
    signal hashes[levels + 1];
    hashes[0] <== leaf;

    // Component arrays
    component hashers[levels];
    component muxers[levels];

    for (var i = 0; i < levels; i++) {
        // 1. Setup the Muxer to decide the hashing order
        muxers[i] = DualMux();
        muxers[i].currHash <== hashes[i];           // Current hash
        muxers[i].pElement <== pathElements[i];     // Sibling node
        muxers[i].s <== pathIndices[i];          // Selector bit

        // 2. Setup the Poseidon hasher for 2 inputs
        hashers[i] = Poseidon(2);
        
        // Pass the muxed outputs into the hasher's input array
        hashers[i].inputs[0] <== muxers[i].leftout;
        hashers[i].inputs[1] <== muxers[i].rightout;

        // 3. Store the result for the next level
        hashes[i + 1] <== hashers[i].out;
    }

    // FINAL CONSTRAINT: Reconstructed hash must equal the public root
    root === hashes[levels];
}

// Instantiate for a tree of depth 20 (approx 1 million members)
component main {public [root]} = MerkleTreeChecker(20);