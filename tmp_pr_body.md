Summary:
- Tokenized theme polish: background, shadow, glow, fonts (Source/src/theme/theme-vars.css)
- `FloatingCard.css` tokenization and central-panel emphasis (opacity + radial tweaks)
- Radial gradient mix adjusted 36%→38% for stronger glow
- Playwright smoke+diff validated locally: playwright-smoke.png diff=21839, playwright-future-mode.png diff=21800 (within thresholds)

Validation steps performed locally:
1. npm run build
2. npm run smoke:ci
3. npm run smoke:diff

Notes:
- Changes are incremental and minimal to keep visual diffs small.
- If CI shows font/DPR variance, consider adding font preload in index template.

Please review UI polish tokens and the FloatingCard central emphasis. If approved, I can follow up with additional incremental polish or split further tweaks into separate PRs.
