# Security policy

## Supported versions

Security fixes apply to the latest released version.

## Report a vulnerability

Use a private GitHub security advisory. Do not include sensitive vault content in an issue, discussion, screenshot, or test fixture.

Include the plugin version, Obsidian version, operating system, impact, and minimum reproduction steps.

## Security model

Knap Templates works inside the Obsidian plugin sandbox and uses the Obsidian vault API.

The plugin does not use a network connection, telemetry, dynamic code download, `eval`, Node.js, Electron, or an external process.

The embedded Knap engine interprets a limited template language. It does not execute JavaScript.

The plugin disables regular-expression filters by default. Knap also applies limits to template size, output size, value size, operations, and nesting.

The plugin renders Markdown through Obsidian. Treat links and HTML from untrusted template data as untrusted content.

The plugin creates a new file for each result. It does not replace an existing note.

Template and JSON data remain plain files in the vault. Do not use this plugin as a secret store.
