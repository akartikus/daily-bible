/**
 * Validation de l'intervalle — data-model.md, contrainte verbatim :
 * « entier, 1 ≤ x ≤ 1440 » (FR-004/FR-008). Toute valeur invalide est
 * refusée et la dernière valeur valide est conservée (edge case spec).
 */

export function isValidIntervalMinutes(intervalMinutes: number): boolean {
  return (
    Number.isInteger(intervalMinutes) &&
    intervalMinutes >= 1 &&
    intervalMinutes <= 1440
  );
}
