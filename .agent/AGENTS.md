# Layout & Height Conventions

- **Viewport Height Ownership**: Exactly one element in the tree owns `h-screen` (or `h-full` on `html` and `body` at the outermost app shell). Every layout container below it uses `h-full` to inherit, never a second `h-screen` or `min-h-screen`.
- **Scoped Scrolling**: Any container that scrolls independently (sidebar nav, main content area, modal body) must have `overflow-y-auto` scoped directly to itself — never let scroll behavior default to the entire document/page.
- **Skeleton & Loading Heights**: Skeleton/loading states must match the real content's height exactly, or use the same component in a loading prop-state rather than a separate placeholder with its own hardcoded/fixed height.

# Tailwind & CSS Variable Conventions

- **Theme Utility Precedence**: Before writing any arbitrary-value class using CSS-variable syntax (`rounded-(--x)`, `text-(--x)`, `bg-[var(--x)]`, etc.), check `globals.css`'s `@theme` block first. If the variable is already mapped to a named utility there, use the named utility (`rounded-lg`, `text-text`, `bg-bg-subtle`) — never the raw variable reference.
- **Design Tokens in `@theme`**: Arbitrary CSS-variable syntax is only acceptable for one-off values that are NOT part of the design token system. If a new design token is needed repeatedly, add it to `@theme` in `globals.css` first, then use its generated utility.
