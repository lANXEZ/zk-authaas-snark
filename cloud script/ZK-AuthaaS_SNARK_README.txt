1. Install Rust
	On window:
	1.1. go to: https://rust-lang.org/
	1.2. click "Install"
	1.3. select the RUSTUP-INIT.EXE version suitable to your machine
	(1.3.1. Install C++ build tool if necessary)
	1.4. select the default configuration ( 1)Proceed with standard installation)

	On Linux or MacOS:
	1.1 run the following command: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
	1.2 rustup default stable

	check with: rustc --version
2. Install Circom
	On window:
	2.1 git clone https://github.com/iden3/circom.git
	2.2 In the circom directory: cargo build --release
	2.3 In the circom directory: cargo install --path circom
	2.4 check: circom --version
3. Install NodeJS from the official repository
4. Install snark.js globally, run: npm install -g snarkjs
5. Install circomlib, run: npm install circomlib

Create SNARK Circuit:
note: the node_modules is moved to the /circuits folder

Running to create a circuit, set up, get pk vk, generate witness, generate proof, verif

1. Create the circuit
circom circuits/SNARK.circom --r1cs --wasm --sym -l node_modules -o outputs

2. Setup with Powers of Tau
snarkjs groth16 setup outputs/SNARK.r1cs pot/pot22.ptau outputs/SNARK_final.zkey

3. Export the keys
snarkjs zkey export verificationkey outputs/SNARK_final.zkey outputs/verification_key.json

Considered as Prover's proof generation phase:{
4. Prover generates witness
node outputs/SNARK_js/generate_witness.js outputs/SNARK_js/SNARK.wasm inputs/input.json outputs/witness.wtns

5. Prover generates proof
snarkjs groth16 prove outputs/SNARK_final.zkey outputs/witness.wtns outputs/proof.json outputs/public.json
}

Considered as the Verifier's verification phase:{
6. Verify
snarkjs groth16 verify outputs/verification_key.json outputs/public.json outputs/proof.json
}

To simulate test:
1. Use the proof.json, public.json, and witness.wtns located in the 'outputs' folder as the user's payload.
2. These files will need to be submitted to the verifier.
3. The verifier.js is a verifier that uses verification_key.json (located in 'outputs' folder) to verify the proof.json, public.json, verification_key.json, and the witness.wtns if they are correlated

Note:
-input_generation.js is the js script used to generate a mock user input (sk,c,IPK,etc.)
-circuits/SNARK.circom is the circuit script
-outputs/SNARK_final.zkey is the pk and vk
-outputs/SNARK.r1cs is the actual circuit
-SNARK.sym is the symbol file generated alongside the circuit
-to replicate the set up with powers of tau, you will require the .ptau file (very large) but it is not required to replicate when testing.
