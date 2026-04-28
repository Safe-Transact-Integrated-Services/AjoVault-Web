# Ajovault Project Context

Last updated: 2026-04-27

This file stores durable context for Ajovault app development so future work in this repo can start with the same shared understanding. It was added after checking the codebase for similar context files; the only existing markdown project file was `README.md`.

## Project Snapshot

- App: Ajovault Web, a React frontend for wallet, savings, circles, group goals, fundraising, cooperative, agent, and admin workflows.
- Workspace: `ajovault-web`
- Stack: Vite, React 18, TypeScript, Tailwind CSS, shadcn-ui/Radix, React Router, TanStack Query, Vitest.
- Main entry points: `src/main.tsx` renders `src/App.tsx`; `src/App.tsx` owns providers, layouts, route guards, and route registration.
- API base URL: `VITE_API_BASE_URL`, defaulting locally to `https://localhost:51707` with fallback to `http://localhost:51707` when no env override is configured.

## Local Commands

```sh
npm install
npm start
npm run dev
npm run build
npm run lint
npm test
```

- `npm start` runs Vite on `http://localhost:8080`.
- `npm run dev` uses the default Vite dev server.
- `.env.example` currently sets `VITE_API_BASE_URL=https://localhost:51707`.

## App Structure

- `src/App.tsx`: top-level providers and routes.
- `src/pages`: route-level screens grouped by domain.
- `src/components/layout`: app, mobile, agent, admin layouts and route guards.
- `src/components/ui`: shadcn-ui/Radix primitives.
- `src/components/shared`: shared product components such as receipts, PIN pad, invite picker, and empty table states.
- `src/contexts`: auth providers for customer/agent and admin sessions.
- `src/services`: API modules by domain.
- `src/lib/api`: shared HTTP, auth event, and session utilities.
- `src/types`: shared TypeScript models.

## Primary Feature Areas

- Public/auth: welcome, signup, login, forgot/reset password, forgot/reset PIN.
- Customer app: dashboard, wallet funding/transfers/bills/history, notifications, profile, settings, KYC, support.
- Savings: create savings, savings detail, contributions, invitations.
- Circles: create/join circles, circle detail, contributions, invites, payout.
- Group goals: create/join goals, detail, contributions, invites.
- Fundraising: campaign list/create/detail/invite/manage/withdraw/donate.
- Cooperative: home, members, programs, loans.
- Agent: login, apply, dashboard, transact, register, history, customers, commissions, ledger, settlements, support.
- Admin: login, dashboard, users, agents, transactions, disputes, messaging, settings.

## API And Auth Conventions

- Use `apiRequest` from `src/lib/api/http.ts` for backend calls.
- Domain service modules in `src/services/*Api.ts` should wrap endpoint-specific request/response shapes.
- `apiRequest` adds JSON headers, attaches the bearer token by default, handles `204`, converts error responses to `ApiError`, and clears auth state on authenticated `401` responses.
- Use `getApiErrorMessage` for user-facing error fallback text when possible.
- Auth session values are stored in `localStorage` by `src/lib/api/session.ts` under `ajovault_*` keys.
- Sensitive JSON keys such as `password`, `pin`, `otp`, and tokens are blocked unless the app and API origins are secure or local.
- Customer and agent auth flow through `AuthProvider`; admin auth flow through `AdminAuthProvider`.

## UI And Styling Conventions

- Tailwind config lives in `tailwind.config.ts`; global tokens live in `src/index.css`.
- Font families: `DM Sans` for body text and `Plus Jakarta Sans` for headings.
- shadcn aliases are configured in `components.json`, including `@/components`, `@/lib`, `@/hooks`, and `@/components/ui`.
- Reuse existing `src/components/ui` primitives and local layout patterns before adding new UI foundations.
- Preserve the mobile app layout patterns where routes are inside `MobilePageLayout` or `AppLayout`.
- Prefer `lucide-react` icons where icon buttons or navigation affordances are needed.

## Current Feature Flags

- `src/lib/features.ts` sets `BILL_PAYMENTS_ENABLED = false`.
- Bill payment UI should respect `BILL_PAYMENTS_UNAVAILABLE_MESSAGE` until the provider integration is live.

## Testing Notes

- Vitest is configured with `src/test/setup.ts`.
- There is an example test at `src/test/example.test.ts`.
- For changes touching route behavior, auth/session logic, API wrappers, or payment flows, run targeted checks plus `npm run build` when practical.

## Working Agreement For Future Codex Work

- Treat this chat and file as Ajovault app development context.
- Check existing patterns before adding abstractions or new dependencies.
- Keep changes scoped to the requested feature or fix.
- Do not overwrite user changes in a dirty worktree.
- Avoid storing secrets in this file or committing local `.env` values.
- When adding backend integration, document any expected endpoint shape in the relevant service or type file.
