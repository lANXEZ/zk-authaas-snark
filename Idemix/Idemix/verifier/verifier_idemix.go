package main

import (
	"crypto/ecdsa"
	"crypto/x509"
	"fmt"
	"os"

	"github.com/golang/protobuf/proto"
	"github.com/hyperledger/fabric-amcl/amcl/FP256BN"
	"github.com/hyperledger/fabric/idemix"
)

func main() {
	// 1. Load the Issuer Public Key (IPK)
	ipkBytes, err := os.ReadFile("issuer_public_key.bin")
	if err != nil {
		panic(fmt.Sprintf("Failed to read IPK: %v", err))
	}
	ipk := &idemix.IssuerPublicKey{}
	if err := proto.Unmarshal(ipkBytes, ipk); err != nil {
		panic(fmt.Sprintf("Failed to unmarshal IPK: %v", err))
	}

	// 2. Load the Revocation Public Key (Using x509)
	revPkBytes, err := os.ReadFile("revocation_public_key.bin")
	if err != nil {
		panic("Could not read revocation_public_key.bin. Did you run the updated Prover?")
	}

	// Parse the generic public key
	genericPk, err := x509.ParsePKIXPublicKey(revPkBytes)
	if err != nil {
		panic(fmt.Sprintf("Failed to parse revocation key: %v", err))
	}

	// Cast it back to an ECDSA Public Key
	revPk, ok := genericPk.(*ecdsa.PublicKey)
	if !ok {
		panic("Revocation public key is not of type ECDSA")
	}

	// 3. Load the Proof (Signature)
	proofBytes, err := os.ReadFile("idemix_proof.bin")
	if err != nil {
		panic(fmt.Sprintf("Failed to read proof: %v", err))
	}
	signature := &idemix.Signature{}
	if err := proto.Unmarshal(proofBytes, signature); err != nil {
		panic(fmt.Sprintf("Failed to unmarshal proof: %v", err))
	}

	// 4. Setup the Expected Revealed Attributes
	// The prover used disclosure := []byte{1, 1, 0, 0}
	disclosure := []byte{1, 1, 0, 0}

	// CRITICAL FIX: The array MUST be exactly length 4 (total number of attributes).
	// We populate indices 0 and 1. Indices 2 and 3 must remain nil (hidden).
	revealedAttrs := make([]*FP256BN.BIG, 4)
	revealedAttrs[0] = FP256BN.NewBIGint(1) // Matches OU
	revealedAttrs[1] = FP256BN.NewBIGint(1) // Matches Role

	// The message must match exactly what the prover signed
	msg := []byte("auth-challenge-123")

	// 5. Verify the Zero-Knowledge Proof
	// Ver signature: (disclosure, ipk, msg, revealedAttrs, nym, rhIndex, revPk, epoch)
	err = signature.Ver(
		disclosure,
		ipk,
		msg,
		revealedAttrs,
		0,     // rhIndex
		revPk, // Pass the parsed ECDSA Revocation Public Key
		0)

	if err != nil {
		fmt.Printf("Verification Failed: %v\n", err)
	} else {
		fmt.Println("Verification Successful: The zero-knowledge proof is valid and attributes match!")
	}
}
