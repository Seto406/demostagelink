
/**
 * Calculates the reservation fee based on ticket price and producer niche.
 *
 * Logic:
 * - Indie/Student (University): Flat ₱15
 * - Local/Community: Flat ₱20
 * - Professional/Commercial (Others): 10% of ticket price
 *
 * @param price - The total ticket price
 * @param niche - The producer's niche ("university", "local", etc.)
 * @returns The calculated reservation fee
 */
export function calculateReservationFee(price: number, niche: string | null): number {
  if (price <= 0) return 0;

  let fee = 0;

  if (niche === "university") {
    fee = 15;
  } else if (niche === "local") {
    fee = 20;
  } else {
    // Default logic for other niches (Professional/Commercial)
    // 10% of the ticket price
    fee = Math.round(price * 0.10);
  }

  // Ensure reservation fee does not exceed ticket price
  return Math.min(fee, price);
}
