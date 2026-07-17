# BSForge 🔨

> Bootstrap extension library — missing components, same philosophy, zero config.

[![jsDelivr](https://img.shields.io/badge/CDN-jsDelivr-orange)](https://www.jsdelivr.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.x-7952b3)](https://getbootstrap.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## Installation

### CDN (plain HTML)
```html
<script src="https://cdn.jsdelivr.net/gh/mujmobil92/BSForge@latest/dist/loader.js" defer></script>
```

### npm / Vite
```bash
npm install bsforge
```
```js
import 'bsforge';
```

## Usage

Add a `data-bsforge` attribute — the loader automatically fetches only what the page needs:

```html
<!-- OTP Input -->
<div data-bsforge="otp" data-length="6"></div>

<!-- With options -->
<div data-bsforge="otp" data-length="4" data-variant="filled" data-mask="true"></div>
```

No configuration, no imports, no build step required.

## Components

| Component | Status | Key attributes |
|---|---|---|
| OTP Input | ✅ v0.5.0 | `data-length`, `data-variant`, `data-mask`, `data-timeout`, `data-secure-clear` |
| Skeleton  | 🔜 soon | — |
| Dropzone  | 🔜 soon | — |
| Datepicker | 🔜 soon | — |

## Philosophy

- **Bootstrap-native** — uses `var(--bs-*)` CSS variables, works with any theme or dark mode automatically
- **Zero config** — no initialization, just HTML attributes
- **Modular** — only loads what the page actually uses
- **No dependencies** — no jQuery, no npm required

## Documentation

👉 [BSForge Docs](https://mujmobil92.github.io/BSForge)

## License

MIT
