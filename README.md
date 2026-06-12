# BSForge 🔨

> Bootstrap Extension Library — komponenty které Bootstrap nemá, stejnou filozofií.

[![jsDelivr](https://img.shields.io/badge/CDN-jsDelivr-orange)](https://www.jsdelivr.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.x-7952b3)](https://getbootstrap.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## Instalace

### CDN (čistý HTML)
```html
<script src="https://cdn.jsdelivr.net/gh/YOUR_USERNAME/BSForge@latest/dist/loader.js" defer></script>
```

### npm / Vite
```bash
npm install bsforge
```
```js
import 'bsforge';
```

## Použití

Stačí přidat `data-bsforge` atribut — loader automaticky načte co potřebuje:

```html
<!-- OTP Input -->
<div data-bsforge="otp" data-length="6"></div>

<!-- S vlastním nastavením -->
<div data-bsforge="otp" data-length="4" data-type="numeric"></div>
```

## Komponenty

| Komponenta | Stav | Atributy |
|---|---|---|
| OTP Input | ✅ v0.1.0 | `data-length`, `data-type`, `data-name` |
| Skeleton | 🔜 brzy | — |
| Dropzone | 🔜 brzy | — |
| Datepicker | 🔜 brzy | — |

## Filosofie

- **Bootstrap-native** — používá `var(--bs-*)` proměnné, funguje s jakýmkoli tématem
- **Zero config** — žádná inicializace, jen HTML atributy
- **Modulární** — načítá se jen to co stránka potřebuje
- **Bez závislostí** — žádný jQuery, žádný npm nutný

## Dokumentace

👉 [BSForge Docs](https://YOUR_USERNAME.github.io/BSForge)

## Licence

MIT
