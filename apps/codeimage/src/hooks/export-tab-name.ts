export function exportTabName(
  name: string | null,
  index: number,
  extension: string,
) {
  const safeName =
    (name ?? '')
      .replace(/[<>:"/\\|?*\u0000-\u001f\u007f\s]+/g, '-')
      .replace(/^[. -]+|[. -]+$/g, '')
      .slice(0, 120) || 'untitled';
  return `${String(index + 1).padStart(2, '0')}-${safeName}.${extension}`;
}
