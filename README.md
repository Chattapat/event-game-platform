# Shadow Guessing Audience Game

MVP web game for school events: a notebook drives the LED screen, students join by mobile/tablet, and the room guesses shadow images together.

## Quickstart

```bash
pnpm install
pnpm run preview
```

Open:

- Teacher Control: `http://localhost:8788/teacher/hall?key=teacher-demo`
- Student Play: `http://localhost:8788/play/hall`

`pnpm run preview` builds the Next.js app with OpenNext and runs the Cloudflare Worker/Durable Object runtime locally. Use this for real game testing.

After starting preview, run:

```bash
pnpm run test:smoke
```

This checks landing, Teacher Control, Student Play, health, and the basic realtime flow.

For UI-only Next.js development:

```bash
pnpm run dev
```

## Current MVP Scope

- One preconfigured game room
- Teacher Control page combines LED display and controls
- Student Play page only shows answer buttons and status
- 12 hardcoded animal questions, including 3 teacher bonus rounds
- Durable Object stores room state and answers
- WebSocket sync between host and students
- No D1, KV, auth provider, leaderboard, or admin CMS

## Useful Docs

- [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) - read this first before changing architecture or UX.
