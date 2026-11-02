# Contributing to Hourhand

Thanks for taking the time to contribute! Here is everything you need to get started.

---

## Code of Conduct

Be respectful and constructive. Discrimination, harassment, or any behaviour that makes this project unwelcoming to others will not be tolerated.

---

## How to Contribute

### Reporting Bugs

Before opening an issue, search existing ones to avoid duplicates. When filing a bug report, include:

- A clear title and description
- Steps to reproduce the issue
- Expected vs actual behaviour
- Browser / OS / Node.js version
- Any relevant error messages or screenshots

### Suggesting Features

Open an issue with the label `enhancement`. Describe the use case and why it would benefit the project.

### Submitting a Pull Request

1. **Fork** the repository and create a branch from `main`:

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Install** dependencies:

   ```bash
   npm install
   ```

3. **Set up** your `.env` file (see [README.md](README.md) for instructions).

4. **Make your changes.** Follow the coding conventions below.

5. **Type-check and lint** before committing:

   ```bash
   npm run typecheck
   npm run lint
   ```

6. **Commit** with a clear message:

   ```bash
   git commit -m "feat: add availability calendar to provider dashboard"
   ```

7. **Push** your branch and **open a Pull Request** against `main`.

---

## Coding Conventions

- **Language**: TypeScript — avoid `any`. Define types in `src/lib/supabase.ts` for shared data shapes.
- **Components**: one component per file, named with PascalCase. Place them in `src/components/`.
- **Styling**: Tailwind CSS utility classes only. Do not add raw CSS except in `src/index.css` for global tokens.
- **Icons**: use [Lucide React](https://lucide.dev) — do not add other icon libraries.
- **Data fetching**: use the shared `supabase` client from `src/lib/supabase.ts`. Keep Supabase calls inside components or dedicated hooks.
- **Error handling**: always handle Supabase errors and surface a user-readable message via state (not `console.error` alone).
- **No secrets in code**: never commit real Supabase keys. Use `.env` (which is git-ignored).

---

## Branch Naming

| Prefix | Use for |
|---|---|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `chore/` | Maintenance, dependency updates |
| `docs/` | Documentation only |
| `refactor/` | Code restructuring with no behaviour change |

---

## Database Migrations

If your change requires a schema update:

1. Create a new migration file in `supabase/migrations/` following the existing timestamp naming pattern.
2. Include both the change and any required RLS policy updates.
3. Test the migration against a local Supabase instance before opening a PR.

---

## Questions?

Open a [GitHub Discussion](https://github.com/prince-sinha75/On-Demand-Service-Platform/discussions) or file an issue with the `question` label.
