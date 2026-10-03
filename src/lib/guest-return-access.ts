type GuestReturnProof = {
  orderEmail: string;
  suppliedEmail: string;
  storedTokenHash: string | null;
  suppliedTokenHash: string | null;
  verifiedAccountEmail: string | null;
};

export function hasGuestReturnProof(proof: GuestReturnProof): boolean {
  const email = proof.orderEmail.trim().toLowerCase();
  if (!email || email !== proof.suppliedEmail.trim().toLowerCase()) return false;
  return (
    (!!proof.storedTokenHash &&
      !!proof.suppliedTokenHash &&
      proof.storedTokenHash === proof.suppliedTokenHash) ||
    (!!proof.verifiedAccountEmail && proof.verifiedAccountEmail.trim().toLowerCase() === email)
  );
}
