# 0001: Embed Knap and create standard Markdown notes

Date: 2026-09-12

Status: accepted

## Context

Obsidian products such as Importer and Web Clipper embed Knap. The core Templates plugin and normal note renderer do not interpret Knap templates.

A separate command-line workflow works on desktop, but it does not work on mobile. It also leaves the render action outside Obsidian.

## Decision

Bundle the official `knap` package in one Obsidian community plugin.

The plugin reads templates and JSON data through the Obsidian vault API. It renders a live preview, then creates a standard Markdown note.

The template stays unchanged. The plugin never replaces an existing output file.

The first release uses an explicit render command. It does not replace the normal editor or hide template source automatically.

The runtime uses no Node.js or Electron API. This keeps the same feature set on desktop and mobile.

Regular-expression filters stay off by default. Users can enable them for trusted templates.

## Consequences

Rendered notes need no plugin and remain portable. Source templates remain readable and editable as plain text.

Users must start a render command to see a preview. A later release can add a dedicated template view without changing the file format.

JSON gives agents and scripts one stable data contract. The plugin does not need to invent a second Knap variable syntax.
