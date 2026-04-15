pragma circom 2.1.0;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/bitify.circom";

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

template SparseMerkleProcess(levels) {
    signal input root;
    signal input key;
    signal input value;
    signal input siblings[levels];

    // 1. Derive path indices from the key
    component n2b = Num2Bits(levels);
    n2b.in <== key;

    // 2. The leaf in an SMT is usually Hash(value) or Hash(key, value)
    // Here we use Hash(value) for simplicity
    component leafHasher = Poseidon(1);
    leafHasher.inputs[0] <== value;

    signal hashes[levels + 1];
    hashes[0] <== leafHasher.out;

    component hashers[levels];
    component muxers[levels];

    for (var i = 0; i < levels; i++) {
        muxers[i] = DualMux();
        muxers[i].currHash <== hashes[i];
        muxers[i].pElement <== siblings[i];
        // The i-th bit of the key decides the direction
        muxers[i].s <== n2b.out[i];

        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== muxers[i].leftout;
        hashers[i].inputs[1] <== muxers[i].rightout;

        hashes[i + 1] <== hashers[i].out;
    }

    root === hashes[levels];
}

// Depth 40 allows for 2^40 possible keys
component main {public [root]} = SparseMerkleProcess(40);