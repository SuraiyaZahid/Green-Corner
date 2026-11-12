/** Converts a human readable name into a URL friendly slug. */
export function slugify(value: string): string {
  return value
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Ensures a slug is unique by appending `-2`, `-3`, ... when needed.
 * `exists` receives the candidate slug and must resolve true when taken.
 */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || 'item';
  if (!(await exists(root))) {
    return root;
  }

  let suffix = 2;
  while (await exists(`${root}-${suffix}`)) {
    suffix += 1;
  }

  return `${root}-${suffix}`;
}
