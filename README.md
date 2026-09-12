# Knap Templates

Knap Templates renders Knap templates into standard Markdown notes inside Obsidian.

The plugin embeds the official Knap engine. It does not need a shell, a global package, or an external service.

## Status

The project is in private alpha. The repository is ready for an open-source release after desktop and mobile acceptance tests.

## Features

- Select templates from one or more vault folders.
- Load template variables from a JSON file.
- Open configured templates as rendered Knap previews.
- Edit JSON data and inspect a live Markdown preview.
- Create a new Markdown note without replacing the template or an existing note.
- Validate the active template from the command palette.
- Run on desktop and mobile with the same plugin bundle.

## Requirements

- Obsidian 1.12.7 or later
- A Knap template in a configured template folder
- One JSON object for template data

## Install from source

Use a separate test vault during development. Obsidian recommends this step because a plugin can change vault files.

1. Clone this repository.
2. Run `npm install`.
3. Run `npm run build`.
4. Copy `main.js`, `manifest.json`, and `styles.css` to `.obsidian/plugins/knap-templates/` in the test vault.
5. Reload Obsidian and enable Knap Templates in Community plugins.

## Use the plugin

1. Open Knap Templates in Obsidian settings.
2. Enter one template folder per line.
3. Open a configured template to see its rendered Knap preview.
4. Select the pencil action to edit the template source, or select the file-output action to create a note.
5. Review the data and output path, then select **Create note**.

The plugin also adds **Render with Knap** to the file menu for templates in a configured folder.

## Template data

Add an optional Knap comment to link a default JSON file:

```markdown
{# Knap input: examples/machine.json #}
---
{{ title | yaml_property:"title" }}
tags:
  - lab
---

# {{ title }}

{{ services | table_pretty }}
```

The path starts at the template folder. If no relative file exists, the plugin checks the same path from the vault root.

```json
{
  "title": "Hope WSL",
  "services": [
    {
      "name": "SSH",
      "port": 22
    }
  ]
}
```

The JSON editor accepts one object. Its keys become Knap variables.

## Commands

| Command | Result |
| --- | --- |
| Create note from template | Select a configured template and open the render screen. |
| Open active template preview | Render the active configured template in its editor tab. |
| Render active template | Open the render screen for the active Markdown or Knap file. |
| Validate active template | Check Knap syntax and show the first source error. |

## Safe file behavior

The plugin creates standard Markdown notes. It never replaces a template or an existing note.

If an output file exists, the plugin adds a number to the new file name. It also rejects paths outside the vault.

Regular-expression filters are off by default. Turn them on only for templates that you trust.

Template and JSON files are plain vault files. The plugin does not encrypt or hide their content. Do not store secrets in them.

## Privacy

Knap Templates works offline. It has no telemetry, accounts, ads, or network requests. It reads configured templates and selected JSON files.

## Architecture

The repository follows the current Obsidian sample-plugin and community-review standards.

- `src/core/` contains the Knap adapter and pure validation functions.
- `src/services/` owns vault file access.
- `src/ui/` contains the Knap preview view, template picker, and render modal.
- `tests/` contains unit tests for rendering, data, and paths.
- `.github/workflows/` checks every change and creates attested draft releases.

The runtime imports no Node.js or Electron APIs. Esbuild includes Knap in `main.js` and leaves only Obsidian APIs external.

## Development

```bash
npm install
npm run dev
npm run check
```

`npm run check` runs lint, unit tests, type checks, a production build, and release checks.

## Release

1. Update `CHANGELOG.md`.
2. Run `npm version patch`, `npm version minor`, or `npm version major`.
3. Push the version commit and its version tag.
4. Review the attested draft release on GitHub.
5. Publish the release after the manual acceptance tests pass.

The GitHub tag must match the version in `manifest.json`. Release assets include `main.js`, `manifest.json`, and `styles.css`.

## Credits

Knap Templates uses [Knap](https://github.com/obsidianmd/knap), the Markdown template engine from Obsidian.

## License

MIT
