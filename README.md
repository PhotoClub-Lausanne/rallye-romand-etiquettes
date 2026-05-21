# rallye-romand-etiquettes

Generate printable name tags and meal coupons from an Excel sheet.

## Architecture

- Static single-page app built with **Vite + React + TypeScript**
- Runs entirely in the browser, no backend required
- Parses Excel files with **SheetJS (`xlsx`)**
- Generates printable PDFs with **pdf-lib**
- Optimized for **GitHub Pages** deployment

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to GitHub Pages

```bash
npm run deploy
```

> The Vite config uses `base: '/rallye-romand-etiquettes/'` for GitHub Pages project-site hosting.

## Features

- Name tags: detect `Prénom` + `Nom`
- Meal coupons: detect `Choisis le menu`
- Grid-based PDF layout with customizable rows/columns
- Optional color-coded coupon printing
