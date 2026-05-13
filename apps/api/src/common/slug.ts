export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function requireSlug(value: string, fallback: string): string {
  const slug = slugify(value);
  return slug.length > 0 ? slug : fallback;
}
