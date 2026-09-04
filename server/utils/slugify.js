// Reusable URL-friendly slug generator with collision resolution
export const generateSlug = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-word chars
    .replace(/[\s_-]+/g, '-') // replace spaces & underscores with single dash
    .replace(/^-+|-+$/g, ''); // trim leading & trailing dashes
};
