README for simulating SNARK variation of ZK-AuthaaS prove generation and verfification 
(folder: ZK-AuthaaS_Full)

Programs and libraries used to construct the said simulation
(Does not need to be replicated - the results are provided)
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
4. Install snark.js globally
	run: npm install -g snarkjs
5. Install circomlib
	run: npm install circomlib
6. Install circomlibjs
	run: npm install circomlibjs


The following are the steps taken to construct the simulation, however, they are not necessary to replicate.

Simulating the actual user input
-The system require pairing operations, hence, actual realistic values are needed.
-The provided script: "input_generation.js" is used to construct the user input.
-Result: "input.json" located in: "inputs/input.json"


Circuit and System setup 
0. The circuit logic was written in circom - "SNARK.circom" located in: "circuits/SNARK.circom"

1. Compile the circuit to r1cs
terminal command: circom circuits/SNARK.circom --r1cs --wasm --sym -l node_modules -o outputs

2. Setup with Powers of Tau
(The Power of Tau was downloaded outsource and not included in the zip file due to size)
terminal command: snarkjs groth16 setup outputs/SNARK.r1cs pot/pot22.ptau outputs/SNARK_final.zkey

3. Export the keys
terminal command: snarkjs zkey export verificationkey outputs/SNARK_final.zkey outputs/verification_key.json

Results that are used for the testing simulation:
    - "SNARK.wasm" located in: "outputs/SNARK_js/SNARK.wasm"
    - "SNARK_final.zkey" located in: "outputs/SNARK_final.zkey" (this is the pk)
    - "verfication_key.json" located in: "outputs/verification_key.json" (this is the vk)


The following are the steps to simulate the prover side procedure:
Required: 
    - "input.json"          The simulated user input
    - "SNARK_final.zkey"    The proving key (pk)
    - "SNARK.wasm"          The circuit logic
    - "prover.js"           The script that construct the proof

1. Run prover.js by running the terminal command: node prover.js

Result: 
    - "proof.json" located in: "outputs/proof.json"
    - "public.json" located in: "outputs/public.json"
In the system, these 2 files are sent to the verifier to be verified using the verification key (vk)

The following are the steps to simulate the verifier side procedure:
Required:
    - "proof.json"                  The proof
    - "public.json"                 The public signals used alongside a proof
    - "verification_key.json"       The verification key (vk)
    - "verifier.js"                 The script that verifies proofs

1. Run verifier.js by running the terminal command: node prover.js

Result: Accept or Reject 
(however this simulation always return Accept since we used a legitimate proof and public signals)

REMARK:
The procedure can be used for other zk-SNARK based testing including: MT-zk and SMT-zk, however some files may differ in name.
