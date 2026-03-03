# Superset Monorepo Guide

Guidelines for agents and developers working in this repository.

## Structure

Bun + Turbo monorepo with:
- **Apps**:
  - `apps/web` - Main web application (app.superset.sh)
  - `apps/marketing` - Marketing site (superset.sh)
  - `apps/admin` - Admin dashboard
  - `apps/api` - API backend
  - `apps/desktop` - Electron desktop application
  - `apps/docs` - Documentation site
  - `apps/mobile` - React Native mobile app (Expo)
- **Packages**:
  - `packages/ui` - Shared UI components (shadcn/ui + TailwindCSS v4).
    - Add components: `npx shadcn@latest add <component>` (run in `packages/ui/`)
  - `packages/db` - Drizzle ORM database schema
  - `packages/auth` - Authentication
  - `packages/agent` - Agent logic
  - `packages/trpc` - Shared tRPC definitions
  - `packages/shared` - Shared utilities
  - `packages/mcp` - MCP integration
  - `packages/desktop-mcp` - Desktop MCP server
  - `packages/local-db` - Local SQLite database
  - `packages/durable-session` - Durable session management
  - `packages/email` - Email templates/sending
  - `packages/scripts` - CLI tooling
- **Tooling**:
  - `tooling/typescript` - Shared TypeScript configs

## Tech Stack

- **Package Manager**: Bun (no npm/yarn/pnpm)
- **Build System**: Turborepo
- **Database**: Drizzle ORM + Neon PostgreSQL
- **UI**: React + TailwindCSS v4 + shadcn/ui
- **Code Quality**: Biome (formatting + linting at root)
- **Next.js**: Version 16 - NEVER create `middleware.ts`. Next.js 16 renamed middleware to `proxy.ts`. Always use `proxy.ts` for request interception.

## Common Commands

```bash
# Development
bun dev                    # Start all dev servers
bun test                   # Run tests
bun build                  # Build all packages

# Code Quality
bun run lint               # Check for lint issues (no changes)
bun run lint:fix           # Fix auto-fixable lint issues
bun run format             # Format code only
bun run format:check       # Check formatting only (CI)
bun run typecheck          # Type check all packages

# Maintenance
bun run clean              # Clean root node_modules
bun run clean:workspaces   # Clean all workspace node_modules
```

## Code Quality

**Biome runs at root level** (not per-package) for speed:
- `biome check --write --unsafe` = format + lint + organize imports + fix all auto-fixable issues
- `biome check` = check only (no changes)
- `biome format` = format only
- Use `bun run lint:fix` to fix all issues automatically

## Agent Rules
1. **Type safety** - avoid `any` unless necessary
2. **Prefer `gh` CLI** - when performing git operations (PRs, issues, checkout, etc.), prefer the GitHub CLI (`gh`) over raw `git` commands where possible
3. **Shared command source** - keep command definitions in `.agents/commands/` only. `.claude/commands` and `.cursor/commands` should be symlinks to `../.agents/commands`. (`packages/chat` discovers slash commands from `.claude/commands`.)
4. **Workspace MCP config** - keep shared MCP servers in `.mcp.json`; `.cursor/mcp.json` should link to `../.mcp.json`. Codex uses `.codex/config.toml` (run with `CODEX_HOME=.codex codex ...`). OpenCode uses `opencode.json` and should mirror the same MCP set using OpenCode's `remote`/`local` schema.
5. **Mastracode fork workflow** - for Superset's internal `mastracode` fork bundle and release process, follow `docs/mastracode-fork-workflow.md`.

---

## Project Structure

All projects in this repo should be structured like this:

```
app/
├── page.tsx
├── dashboard/
│   ├── page.tsx
│   ├── components/
│   │   └── MetricsChart/
│   │       ├── MetricsChart.tsx
│   │       ├── MetricsChart.test.tsx      # Tests co-located
│   │       ├── index.ts
│   │       └── constants.ts
│   ├── hooks/                             # Hooks used only in dashboard
│   │   └── useMetrics/
│   │       ├── useMetrics.ts
│   │       ├── useMetrics.test.ts
│   │       └── index.ts
│   ├── utils/                             # Utils used only in dashboard
│   │   └── formatData/
│   │       ├── formatData.ts
│   │       ├── formatData.test.ts
│   │       └── index.ts
│   ├── stores/                            # Stores used only in dashboard
│   │   └── dashboardStore/
│   │       ├── dashboardStore.ts
│   │       └── index.ts
│   └── providers/                         # Providers for dashboard context
│       └── DashboardProvider/
│           ├── DashboardProvider.tsx
│           └── index.ts
└── components/
    ├── Sidebar/
    │   ├── Sidebar.tsx
    │   ├── Sidebar.test.tsx               # Tests co-located
    │   ├── index.ts
    │   ├── components/                    # Used 2+ times IN Sidebar
    │   │   └── SidebarButton/             # Shared by SidebarNav + SidebarFooter
    │   │       ├── SidebarButton.tsx
    │   │       ├── SidebarButton.test.tsx
    │   │       └── index.ts
    │   ├── SidebarNav/
    │   │   ├── SidebarNav.tsx
    │   │   └── index.ts
    │   └── SidebarFooter/
    │       ├── SidebarFooter.tsx
    │       └── index.ts
    └── HeroSection/
        ├── HeroSection.tsx
        ├── HeroSection.test.tsx           # Tests co-located
        ├── index.ts
        └── components/                    # Used ONLY by HeroSection
            └── HeroCanvas/
                ├── HeroCanvas.tsx
                ├── HeroCanvas.test.tsx
                ├── HeroCanvas.stories.tsx
                ├── index.ts
                └── config.ts

components/                                # Used in 2+ pages (last resort)
└── Header/
```

1. **One folder per component**: `ComponentName/ComponentName.tsx` + `index.ts` for barrel export
2. **Co-locate by usage**: If used once, nest under parent's `components/`. If used 2+ times, promote to **highest shared parent's** `components/` (or `components/` as last resort)
3. **One component per file**: No multi-component files
4. **Co-locate dependencies**: Utils, hooks, constants, config, tests, stories live next to the file using them

### Exception: shadcn/ui Components

The `src/components/ui/` and `src/components/ai-elements` directories contain shadcn/ui components. These use **kebab-case single files** (e.g., `button.tsx`, `base-node.tsx`) instead of the folder structure above. This is intentional—shadcn CLI expects this format for updates via `bunx shadcn@latest add`.

## Database Rules

** IMPORTANT ** - Never touch the production database unless explicitly asked to. Even then, confirm with the user first.

- Schema in `packages/db/src/`
- Use Drizzle ORM for all database operations

## DB migrations
- Always spin up a new neon branch to create migrations. Update our root .env files to point at the neon branch locally.
- Use drizzle to manage the migration. You can see the schema at packages/db/src/schema. Never run a migration yourself.
- Create migrations by changing drizzle schema then running `bunx drizzle-kit generate --name="<sample_name_snake_case>"`
- `NEON_ORG_ID` and `NEON_PROJECT_ID` env vars are set in .env
- list_projects tool requires org_id passed in
- **NEVER manually edit files in `packages/db/drizzle/`** - this includes `.sql` migration files, `meta/_journal.json`, and snapshot files. These are auto-generated by Drizzle. If you need to create a migration, only modify the schema files in `packages/db/src/schema/` and ask the user to run `drizzle-kit generate`.

## Cursor Cloud specific instructions

### Environment overview

The VM snapshot has **Bun 1.3.6** and **Caddy** pre-installed. The update script runs `bun install` on startup.

### Running dev servers

Start individual Next.js apps from their directory using the `dev` script in each app's `package.json` (they use `dotenv-cli` to load the root `.env`). Examples:

```bash
cd apps/api && bun run dev      # API on port 3001
cd apps/web && bun run dev      # Web on port 3000
cd apps/docs && bun run dev     # Docs on port 3004
cd apps/marketing && bun run dev # Marketing on port 3002
```

The root `bun dev` starts web, api, desktop, electric-proxy, and Caddy via Turborepo TUI. In headless environments, prefer starting apps individually.

### External service dependencies

Most apps (web, api, marketing, admin) require a **Neon PostgreSQL** `DATABASE_URL` to render pages. Without it, pages return 500 because `@neondatabase/serverless` throws when called with an empty connection string. The `SKIP_ENV_VALIDATION=1` flag only skips env schema validation at import time — it does **not** mock database calls.

The **docs site** (`apps/docs`) works fully without any external credentials.

The **API** has some endpoints that work without DB (e.g., `GET /api/desktop/version`), but most routes require auth/DB.

### Desktop app (Electron)

The desktop app (`apps/desktop`) cannot run in headless cloud environments. It builds and typechecks fine, and its `bun test` suite (1477 tests) runs without a display. Native deps (`better-sqlite3`, `node-pty`) are compiled during `bun install` via the postinstall script.

### Lint / Test / Typecheck

See "Common Commands" above. All three work without external services:
- `bun run lint` — Biome check (2148 files)
- `bun test` — Bun test runner (1477 tests across 86 files)
- `bun run typecheck` — TypeScript across all 20 packages

### Env file setup

If `.env` does not exist, create it from `.env.example` and append `SKIP_ENV_VALIDATION=1`:
```bash
cp .env.example .env
echo 'SKIP_ENV_VALIDATION=1' >> .env
```

Also copy `Caddyfile.example` to `Caddyfile` (required by root `bun dev`):
```bash
cp Caddyfile.example Caddyfile
```
