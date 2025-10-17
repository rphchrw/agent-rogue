# agent-rogue

This project is bootstrapped with [Vite](https://vitejs.dev/) using the React + TypeScript template.

## Available Scripts

- `npm install` – install project dependencies.
- `npm run dev` – start the Vite development server.
- `npm run build` – create a production build.
- `npm run lint` – run ESLint across the project.
- `npm run preview` – preview the built app locally.
- `npm run test` – run the Vitest suite once.
- `npm run test:watch` – run Vitest in watch mode.

## How to run

```bash
npm install
npm run dev
npm run test
```

## Development

Run `npm run dev` and open the provided local URL to view the default React welcome page.

## Random Events

- Events live in [`src/core/events.ts`](src/core/events.ts). Each entry defines gating rules, a weight used for selection, and pure `apply` handlers for its choices.
- Event weights are relative. Higher numbers make an event more likely when it is eligible, but events with `minDay`/`minWeek` restrictions are skipped until those thresholds are met.
- To add a new event, append to the exported `EVENTS` array and provide choice handlers that return a new `GameState` (clamped via the shared helpers in the same file).
