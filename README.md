# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## UI Improvements (this branch)

I made small accessibility, responsiveness and UX improvements to the demo app:

- Added light/dark theme support (persists in localStorage).
- Improved focus outlines and keyboard accessibility for interactive controls.
- Added ARIA labels and roles for better screen-reader experience.
- Improved responsive spacing and card sizing on small screens.
- Inline non-blocking copy/share feedback.

### Run locally

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:5173/ and interact with the curve editor.

If you want broader changes (re-skin, layout redesign, or new features), tell me which screens you'd like refreshed and I will implement them.
