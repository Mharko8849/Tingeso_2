// Utility to map status strings to Badge variant names
/**
 * Maps a status string to a Badge variant name.
 * Input: status string
 * Output: badge variant string ('green', 'yellow', 'red', 'blue') or undefined
 */
export function statusToBadgeVariant(status) {
  const s = (status == null) ? '' : String(status).toUpperCase().trim();

  if (s === 'ACTIVO') return 'green';
  if (s === 'PENDIENTE') return 'yellow';
  if (s === 'RESTRINGIDO') return 'red';
  if (s === 'FINALIZADO') return 'blue';

  return undefined;
}

export default statusToBadgeVariant;
