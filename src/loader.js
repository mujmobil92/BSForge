/*!
 * BSForge Loader v0.1.0
 * Bootstrap Extension Library
 * https://github.com/YOUR_USERNAME/BSForge
 */

(function () {
    'use strict';

    // --- Konfigurace ---
    const VERSION = '0.1.0';
    const BASE_URL = 'https://cdn.jsdelivr.net/gh/YOUR_USERNAME/BSForge@latest/dist/components';

    // Whitelist povolených komponent — bezpečnost
    const REGISTERED = ['otp', 'skeleton', 'dropzone', 'datepicker'];

    // Cache — každá komponenta se načte jen jednou
    const loaded = new Set();

    // --- Načtení JS souboru ---
    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`BSForge: Nepodařilo se načíst ${url}`));
            document.head.appendChild(script);
        });
    }

    // --- Načtení CSS souboru ---
    function loadStyle(url) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
    }

    // --- Načtení komponenty ---
    async function loadComponent(name) {
        // Bezpečnost — jen povolené komponenty
        if (!REGISTERED.includes(name)) {
            console.warn(`BSForge: Neznámá komponenta "${name}". Zkontroluj dokumentaci.`);
            return;
        }

        // Už načteno — přeskoč
        if (loaded.has(name)) return;
        loaded.add(name);

        try {
            loadStyle(`${BASE_URL}/${name}/${name}.css`);
            await loadScript(`${BASE_URL}/${name}/${name}.js`);
        } catch (err) {
            console.error(err);
            loaded.delete(name); // umožni retry
        }
    }

    // --- Skenování DOM ---
    function scan() {
        const elements = document.querySelectorAll('[data-bsforge]');

        if (elements.length === 0) return;

        // Unikátní komponenty na stránce
        const needed = new Set();
        elements.forEach(el => {
            const name = el.dataset.bsforge?.trim().toLowerCase();
            if (name) needed.add(name);
        });

        // Načti každou jednou
        needed.forEach(name => loadComponent(name));
    }

    // --- Spuštění ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scan);
    } else {
        scan();
    }

    // --- Veřejné API (volitelné ruční načtení) ---
    window.BSForge = {
        version: VERSION,
        load: loadComponent,
        scan: scan,
    };

})();
