# 0002: Open configured templates in a Knap preview

Date: 2026-09-13

Status: accepted

## Context

The first implementation required an explicit render command. In Obsidian reading view, users still saw raw Knap expressions because the Markdown renderer does not run Knap.

Knap defines template syntax and rendering. It does not define how an Obsidian plugin discovers template files.

## Decision

Use configured template folders as the discovery boundary. Treat `.md` and `.knap` files in those folders as templates, except files named `README`.

Open a configured template in a dedicated Knap preview by default. Keep actions in the preview to edit the source and create a standard Markdown note.

Do not scan the full vault or infer template status from isolated Knap expressions. Users must keep ordinary Markdown notes outside configured template folders.

## Consequences

Opening a configured template shows rendered output without changing the source file. The reading-view button returns an edited template to the Knap preview.

Folder configuration is part of the template contract. A future Knap discovery standard can replace this rule without changing template syntax.
