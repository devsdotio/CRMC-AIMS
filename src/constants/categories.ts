export interface CategoryStyleMeta {
  bg: string;
  text: string;
  label: string;
  cssVar?: string;
}

export const CATEGORY_STYLES: Record<string, CategoryStyleMeta> = {
  transport: { bg: "bg-category-transport-bg", text: "text-category-transport-text", label: "Transport", cssVar: "var(--color-category-transport-bg)" },
  computing: { bg: "bg-category-computing-bg", text: "text-category-computing-text", label: "Computing", cssVar: "var(--color-category-computing-bg)" },
  av:        { bg: "bg-category-av-bg",        text: "text-category-av-text",        label: "AV Equipment", cssVar: "var(--color-category-av-bg)" },
  furniture: { bg: "bg-category-furniture-bg", text: "text-category-furniture-text", label: "Furniture", cssVar: "var(--color-category-furniture-bg)" },
};

export function getCategoryStyle(category: string, fallbackLabel?: string): CategoryStyleMeta {
  const normalizedCategory = category.toLowerCase();
  
  if (CATEGORY_STYLES[normalizedCategory]) {
    return CATEGORY_STYLES[normalizedCategory];
  }

  // Dynamic fallback for custom user categories
  return {
    bg: "bg-surface",
    text: "text-text",
    label: fallbackLabel ?? (category.charAt(0).toUpperCase() + category.slice(1)),
    cssVar: "var(--color-text-secondary)", // Fallback chart color
  };
}
