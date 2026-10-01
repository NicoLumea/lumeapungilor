export function isAuthorizedOrder(
  orderUserId: string | null,
  authenticatedUserId: string | null,
  storedGuestHash: string | null,
  presentedGuestHash: string | null,
): boolean {
  if (orderUserId) return orderUserId === authenticatedUserId;
  return !!storedGuestHash && !!presentedGuestHash && storedGuestHash === presentedGuestHash;
}
