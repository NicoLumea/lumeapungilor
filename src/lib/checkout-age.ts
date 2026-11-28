/** Self-reported contractual eligibility, not independent age verification. */
export const AGE_CONFIRMATION_ERROR =
  "Pentru a plasa comanda, trebuie să confirmați că aveți minimum 18 ani.";

export function isAgeConfirmed(value: unknown): value is true {
  return value === true;
}
