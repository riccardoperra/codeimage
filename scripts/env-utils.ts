export function makeEnvFile(
  obj: Record<string, string | number | boolean>,
): string {
  return Object.entries(obj).reduce(
    (acc, [key, value]) => (key ? acc + `${key}=${String(value)}\n` : acc),
    '',
  );
}
