package main

import (
	"crypto/x509"
	"fmt"
	"os"

	"github.com/golang/protobuf/proto"
	"github.com/hyperledger/fabric-amcl/amcl"
	"github.com/hyperledger/fabric-amcl/amcl/FP256BN"
	"github.com/hyperledger/fabric/idemix"
)

func main() {
	rng := amcl.NewRAND()
	rng.Seed(0, []byte{1, 2, 3})

	// 1. Setup: Issuer Key
	attributeNames := []string{"OU", "Role", "EnrollmentID", "RevocationHandle"}
	key, _ := idemix.NewIssuerKey(attributeNames, rng)

	ipkBytes, _ := proto.Marshal(key.Ipk)
	os.WriteFile("issuer_public_key.bin", ipkBytes, 0644)

	// 2. Attributes
	attrs := make([]*FP256BN.BIG, len(attributeNames))
	attrs[0] = FP256BN.NewBIGint(1)
	attrs[1] = FP256BN.NewBIGint(1)
	attrs[2] = FP256BN.NewBIGint(12345)
	attrs[3] = FP256BN.NewBIGint(100)

	sk := FP256BN.NewBIGint(6789)

	// 3. CredRequest & Credential
	ni := []byte("nonce")
	req := idemix.NewCredRequest(sk, ni, key.Ipk, rng)

	cred, err := idemix.NewCredential(key, req, attrs, rng)
	if err != nil || cred == nil {
		panic(fmt.Sprintf("Credential generation failed: %v", err))
	}

	// 4. Generate the Signature (The Proof)
	// IMPORTANT: Ensure disclosure matches the length of attributeNames
	disclosure := []byte{1, 1, 0, 0}
	msg := []byte("auth-challenge-123")

	// If it still panics, it's likely expecting the nym or the rhIndex.
	// We generate a dummy Nym (Pseudonym) which is often required by the logic.
	nym, rNym := idemix.MakeNym(sk, key.Ipk, rng)

	revocationKey, err := idemix.GenerateLongTermRevocationKey()
	if err != nil {
		panic(fmt.Sprintf("Failed to generate revocation key: %v", err))
	}
	revPkBytes, err := x509.MarshalPKIXPublicKey(&revocationKey.PublicKey)
	if err != nil {
		panic(fmt.Sprintf("Failed to marshal revocation public key: %v", err))
	}
	os.WriteFile("revocation_public_key.bin", revPkBytes, 0644)

	// FIX: Pass the revocation key instead of nil.
	// Because alg is ALG_NO_REVOCATION, unrevokedHandles can remain nil.
	cri, err := idemix.CreateCRI(revocationKey, nil, 0, idemix.ALG_NO_REVOCATION, rng)
	if err != nil {
		panic(fmt.Sprintf("Failed to create CRI: %v", err))
	}

	signature, err := idemix.NewSignature(
		cred,
		sk,
		nym,  // Try passing the Nym instead of nil
		rNym, // rhIndex
		key.Ipk,
		disclosure,
		msg,
		0,
		cri,
		rng,
	)

	if err != nil {
		panic(fmt.Sprintf("Signature failed: %v", err))
	}

	proofBytes, _ := proto.Marshal(signature)
	os.WriteFile("idemix_proof.bin", proofBytes, 0644)
	fmt.Println("Success: Realistic Idemix proof generated.")
}
