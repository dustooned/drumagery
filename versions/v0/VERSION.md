# Version v0

Date: 2026-04-27

## Summary

Initial working browser visual instrument scaffold.

## Included

- Vite + TypeScript + PixiJS.
- `InputRouter`.
- `StateEngine`.
- Keyboard input.
- Touch input.
- Optional Web MIDI input.
- Debug panel.
- Four loop placeholders.
- Four pooled burst placeholders.
- MIDI debug monitor.

## Validation

```powershell
npm.cmd run build
```

Result: pass.

## Notes

MIDI requires desktop Chrome or Edge with Web MIDI permission granted. The Codex in-app browser may deny the Web MIDI API.

## Restore

The saved source is in:

```text
versions/v0/source
```
