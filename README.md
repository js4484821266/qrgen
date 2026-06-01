# QR Studio

No ads. No malware. No tracking. No uploads.

QR Studio is a static QR code generator made because random QR generator apps are hard to trust. Everything runs in your browser: the QR data, uploaded logo images, colors, and generated downloads stay local to your device.

## Features

- Static GitHub Pages hosting with no backend, PHP, login, or database
- Content presets for text, URL, phone, SMS, email, Wi-Fi, vCard, geo location, calendar events, and custom raw payloads
- Strict validation so ambiguous QR payloads do not get generated silently
- Error correction level control: `L`, `M`, `Q`, `H`
- Local logo image insertion with size, margin, and hidden-background-dot controls
- QR-grid-aligned dot text for center or corner placement
- Dot, corner, eye, foreground, and background styling
- PNG download with final logo and dot text composition
- SVG download for the base styled QR code

## Trust Model

This project is intentionally small and inspectable.

- No ads: there is no ad script or ad network integration.
- No tracking: there is no analytics script.
- No uploads: image files are loaded locally in the browser.
- No server storage: GitHub Pages only serves static files.
- No account system: there is no signup, login, or database.

## Development

```bash
pnpm install
pnpm dev
```

Build for GitHub Pages:

```bash
pnpm build
```

The Vite base path is configured as `/qrgen/` for a project page such as:

```text
https://<user>.github.io/qrgen/
```

## License

MIT License. See [LICENSE](./LICENSE).
