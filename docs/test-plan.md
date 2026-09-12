# Test plan

## Automated checks

Run `npm run check`. It must complete the lint, unit tests, type checks, production build, manifest check, and bundle check.

## Desktop acceptance

### Open and inspect

1. Install the release assets in a clean test vault.
2. Add a template folder and one Knap template.
3. Open the template and confirm that its Knap preview replaces the raw template text.
4. Compare the title, margins, and readable width with a native Obsidian reading view.
5. Use the preview actions to refresh the preview and open the source editor.

### Create a note

1. Select the Obsidian reading-view button and confirm that the rendered Knap preview returns.
2. Open the create command with only the keyboard.
3. Load a JSON file and inspect the rendered preview.
4. Create the note and make sure the template stays unchanged.

Repeat step 4 with an existing output name. The plugin must create a numbered file and keep the existing file unchanged.

Enter invalid JSON. The editor must show an actionable error and receive focus after a create attempt.

Enter invalid Knap syntax. The modal must show the source line and column.

## Mobile acceptance

1. Install the same release assets on iOS or Android.
2. Complete the create flow at a 320 CSS-pixel width.
3. Use VoiceOver or TalkBack to read every field and action.
4. Create a note from a template with a relative JSON path.
5. Confirm that the plugin makes no network request.

## Release gate

Do not publish the release until the automated, desktop, and mobile checks pass.
