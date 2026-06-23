# Project Context — Shadow Guessing Audience Game
_Updated: 2026-06-22_

## What this project is

This is an MVP for a school event audience game. A notebook connects to a large LED screen by HDMI. Students use mobile phones or tablets to join through a QR/link and answer A/B/C/D.

The product is not a Kahoot clone. The core value is shared participation while students wait for the main event.

Core loop:

```txt
Show shadow -> Students answer -> Close answers -> Show result -> Reveal real answer -> Next question
```

## Current architecture decision

Use:

```txt
Frontend: Next.js + React + TypeScript + Tailwind CSS
Runtime: Cloudflare Workers via OpenNext
Game state: Cloudflare Durable Objects
Realtime: WebSocket
Data: hardcoded TypeScript questions
Images: mostly static assets with fallback artwork where needed
Package manager: pnpm
```

Do not add these in MVP unless the product requirement changes:

- D1
- KV
- Redis
- Supabase/Firebase
- Login/auth provider
- Admin CMS
- Leaderboard
- Multi-room dashboard

Reason: the game state is room-scoped and short-lived. Durable Object per `gameId` is enough for answer counting, one-device-one-answer, and host-controlled state.

## Routes

```txt
/                     Landing page for dev/testing links
/teacher/[gameId]?key=   LED display + teacher controls in one MVP screen
/play/[gameId]           Student mobile/tablet answer screen
/api/game/[gameId]/ws WebSocket endpoint handled by Worker + Durable Object
```

Future v2 routes if teacher trial proves the need:

```txt
/display/[gameId]     Clean LED display only
/control/[gameId]     Teacher remote control screen
/admin                Question/image management
```

## UX direction

Style:

- Minimal, light, high contrast
- Large readable typography for LED
- System font stack with Thai + English readability
- No decorative gradients/orbs
- No heavy animation in MVP

LED/Teacher Control screen:

- Shows current question, shadow/answer artwork, choices, answered count, result bars, and controls
- Teacher controls are visible in MVP because notebook + HDMI is the expected test setup
- Code should keep display/control concerns easy to split later

Student screen:

- Mobile-first
- No images
- Large A/B/C/D buttons
- Shows clear states: waiting, answer open, submitted, closed, revealed, finished

## Teacher key

MVP uses a simple host key to stop students from opening the host page and controlling the game.

Default local key:

```txt
teacher-demo
```

Teacher Control URL:

```txt
/teacher/hall?key=teacher-demo
```

This is not production-grade authentication. It is an MVP guard.

Local Cloudflare preview reads `.dev.vars`. Copy `.dev.vars.example` to `.dev.vars` if the file is missing.

Smoke test command:

```txt
pnpm run test:smoke
```

Health endpoint:

```txt
/api/health
```

## Game data

Questions live in:

```txt
src/data/questions.ts
```

Types live in:

```txt
src/types/game.ts
```

Current MVP has:

- 9 animal questions
- 3 teacher bonus rounds

## Image asset TODO

Most question images are still missing, so `GameVisual` renders fallback artwork when an asset is unavailable. Real assets should live under:

```txt
public/images/animals/
public/images/teachers/
```

Question fields already define intended paths:

```ts
shadowImageUrl: "/images/animals/elephant-shadow.png"
realImageUrl: "/images/animals/elephant.png"
```

When adding or replacing assets, keep the `shadowImageUrl` and `realImageUrl` paths aligned with the files in `public/images/*`.

## Important implementation notes

- Next.js renders the UI.
- `src/worker/index.ts` wraps the generated OpenNext worker and intercepts `/api/game/*`.
- `src/worker/game-room.ts` owns the Durable Object room state.
- `src/components/game/use-game-socket.ts` owns client WebSocket connection state.
- Student `playerId` is stored in `localStorage` per `gameId`, so one device can answer once per question.

## MVP acceptance checklist

- Teacher can open `/teacher/hall?key=teacher-demo`
- Student can open `/play/hall`
- Teacher can start question
- Student sees A/B/C/D and answers once
- Teacher sees answered count update
- Teacher can close answers
- Teacher can show result percentages
- Teacher can reveal correct answer
- Teacher can go to next question
- Teacher can reset game
- `pnpm run test:smoke` passes against the preview runtime

## Product decisions already made

- One preconfigured room for MVP
- `gameId` represents a short game/session, not a full multi-room platform yet
- Teacher Control and display are combined in MVP for easiest teacher testing
- `/display` and `/control` are v2 candidates
- Placeholder imagery is acceptable for the first dev pass, but asset replacement location must remain documented
