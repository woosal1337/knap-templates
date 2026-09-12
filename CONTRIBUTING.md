# Contributing

Contributions are welcome.

## Development setup

1. Install Node.js 22 or later.
2. Clone the repository.
3. Run `npm ci`.
4. Run `npm run dev` for a watch build.
5. Load the built plugin in a separate Obsidian test vault.

Do not develop against a vault that contains important notes.

## Required checks

Run this command before you open a pull request:

```bash
npm run check
```

Add or update tests when behavior changes. Keep `main.js` out of commits because the release workflow builds it from source.

## Code structure

- Keep Knap behavior in `src/core/`.
- Keep vault reads and writes in `src/services/`.
- Keep Obsidian interface code in `src/ui/`.
- Keep `src/main.ts` limited to plugin lifecycle and command registration.

Use Obsidian APIs for vault paths and files. Do not add Node.js or Electron APIs to runtime code.

## Interface rules

Use Obsidian components and CSS variables. Every field needs a visible label, a keyboard path, and an actionable error.

Use sentence case for interface text. Do not add default hotkeys, telemetry, ads, or network calls.

## Pull requests

Describe the user problem and the result. Link the related issue and list the checks that you ran.

Keep each pull request focused. Do not reformat unrelated code.
