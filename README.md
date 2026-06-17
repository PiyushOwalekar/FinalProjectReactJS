# Cubic-Bezier Motion Sandbox

A GPU-accelerated, neon-styled React sandbox for designing and analyzing cubic-bezier easing curves. Drag P1 (sky blue) and P2 (pink) to reshape the easing. Live tools include a Curve Inspector (x(t), y(t), position/velocity/acceleration), velocity and acceleration graphs, and a physics simulator with multi-object comparison lanes.

Live demo: https://final-project-react-js-gray.vercel.app/

## Tech stack

- React 19 (Vite)
- Vite dev server
- Tailwind CSS (utility classes present in the UI)
- Framer Motion (optional, used for subtle inspector transitions)
- No backend required — static SPA

## Features

- Interactive cubic-bezier curve editor with draggable handles and live coordinate labels (P1, P2).
- Curve Inspector: parameter t slider with precise x(t) and y(t) (4-decimal precision).
- Real-time physics metrics: Position (y), Velocity (dy/dx), Acceleration (d²y/dt²) computed analytically and shown in animated cards.
- Visual marker on the SVG curve that follows t and shows a tooltip (t, x(t), y(t)).
- Velocity and Acceleration profiling charts with Peak/Min/Average metrics.
- Physics Simulator with multi-object runner (Car, Block, Circle) and Compare Mode (side-by-side lanes for Custom, Linear, Ease, Ease-In-Out).
- Preserve the neon / cyberpunk UI, glassmorphism cards, responsive layout, and shareable URL system.

## Setup (Developer)

1. Clone the repo and change into the project folder:

```bash
git clone <repo-url> finalProject
cd finalProject/finalProject
```

2. Install dependencies (this project uses npm):

```bash
npm install
```

3. Start the dev server:

```bash
npm run dev
```

4. Open the app in your browser:

```
http://localhost:5173/  (or the port Vite selects such as 5174)
```

Notes:
- If you see an import error for `framer-motion`, run `npm install framer-motion` in the project root and restart the dev server. The README includes `framer-motion` as a dependency in `package.json`.

## Build for production

```bash
npm run build
npm run preview
```

## Project architecture

- `src/components` — React components for the Curve Graph, Inspector, Controls, Stats, and Simulator
- `src/utils/bezierMath.js` — cubic-bezier math utilities (position, derivative, second derivative, solver)
- `src/App.jsx` — application wiring and layout
- `public/` — static assets (drop screenshots into `public/screenshots`)

## Troubleshooting

- Vite port conflict: if port 5173 is taken, Vite will select another port (e.g., 5174). Open the port shown in the terminal.
- Missing dependencies: run `npm install` and `npm install framer-motion` if needed.
- If you experience styling issues, ensure Tailwind is configured correctly (this repo uses utility classes; a PostCSS/Tailwind build step may be necessary depending on your environment).

## Contributing

Open an issue or submit a PR. If you want help converting the project to TypeScript or adding unit tests for the math utilities, I can do that.

---

If you want, I can now:
- Add the attached screenshots directly into `public/screenshots/` and commit them.
- Convert the `src/types.js` to a `types.d.ts` file for tighter typing.
- Add unit tests for `bezierMath.js` and a small test runner.

Tell me which and I'll proceed.
