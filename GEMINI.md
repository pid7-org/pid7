# Project Guidelines — pid7

This repository contains **pid7**, a minimalist developer blog and portfolio built with Astro, Tailwind CSS v4, Catppuccin themes, and Fontsource typography.

---

## 1. Code Comment Guidelines

- **Target Audience**: Always assume the code is being read by senior software engineers.
- **No Low-Level / Beginner Comments**: Never state the obvious (e.g. `// render component`, `// increment i by 1`). Code should be self-documenting.
- **High-Value Context Only**: Comments must explain non-obvious design choices, architectural rationale, browser/CSS quirks, performance considerations, or edge-case handling.
- **Standard Alert Markers**: Use standardized uppercase markers when necessary:
  - `NOTE:` Helpful architectural context or design rationale.
  - `IMPORTANT:` Critical requirements or dependencies.
  - `WARN:` Potential performance traps, race conditions, or browser incompatibilities.
  - `ALERT:` High-risk logic or side-effects.

---

## 2. Git Commit Guidelines

- **Analyze History First**: Always inspect the past few commits (`git log -n 5`) to maintain repository conventions.
- **Allowed Commit Labels**:
  - `feat:` New features or capabilities
  - `fix:` Bug fixes
  - `setup:` Project configuration, dependencies, tooling
  - `docs:` Documentation or guideline updates
  - `anim:` Animations, micro-interactions, motion effects
  - `content:` Writing, blog posts, markdown content
  - `style:` Pure CSS/UI/layout design tweaks
  - `refactor:` Code restructuring without behavioral changes
- **Brevity & Context**: Keep commit messages concise, on-point, and focused (imperative mood, ~50 characters max). Avoid fluff or overly long paragraphs.

---

## 3. Tech Stack & Conventions

- **Framework**: Astro (v7+) with static generation (`output: 'static'`).
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss"`) with `@catppuccin/tailwindcss` plugin.
  - **Dark Mode (Default)**: Catppuccin Macchiato
  - **Light Mode**: Catppuccin Latte
  - **Accents**: Mauve, Blue, Green, Peach
  - **Dynamic Tinting**: Background dynamically blends with active accent color via `color-mix()`.
- **Typography (Fontsource)**:
  - **Title / Logo**: `Playwrite IN` (`var(--font-playwrite)`)
  - **Body / Blog / Prose**: `Source Serif 4 Variable` (`var(--font-serif)`)
  - **UI / Code / Metadata**: `JetBrains Mono Variable` (`var(--font-mono)`)
  - **Blog Articles**: Formatted using `@tailwindcss/typography` (`.prose`).
- **Layout Grid**: Constrained layout width `max-w-screen-md` (`max-w-3xl` / 768px), centered with `mx-auto px-6`.
