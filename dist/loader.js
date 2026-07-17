/*!
 * BSForge Loader v0.1.0
 * Bootstrap Extension Library
 */

(function () {
    'use strict';

    // --- Configuration ---
    const VERSION = '0.1.0';
    const BASE_URL = 'https://cdn.jsdelivr.net/gh/mujmobil92/BSForge@latest/dist/components';

    // Whitelist of allowed components — security
    const REGISTERED = ['otp', 'skeleton', 'dropzone', 'datepicker'];

    // Cache — each component is loaded only once
    const loaded = new Set();

    // --- Load JS file ---
    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`BSForge: Failed to load ${url}`));
            document.head.appendChild(script);
        });
    }

    // --- Load CSS file ---
    function loadStyle(url) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
    }

    // --- Load component ---
    async function loadComponent(name) {
        // Security — only allowed components
        if (!REGISTERED.includes(name)) {
            console.warn(`BSForge: Unknown component "${name}". Check the documentation.`);
            return;
        }

        // Already loaded — skip
        if (loaded.has(name)) return;
        loaded.add(name);

        try {
            loadStyle(`${BASE_URL}/${name}/${name}.css`);
            await loadScript(`${BASE_URL}/${name}/${name}.js`);
        } catch (err) {
            console.error(err);
            loaded.delete(name); // allow retry
        }
    }

    // --- Scan the DOM ---
    function scan() {
        const elements = document.querySelectorAll('[data-bsforge]');

        if (elements.length === 0) return;

        // Unique components on the page
        const needed = new Set();
        elements.forEach(el => {
            const name = el.dataset.bsforge?.trim().toLowerCase();
            if (name) needed.add(name);
        });

        // Load each one once
        needed.forEach(name => loadComponent(name));
    }

    // --- Run ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scan);
    } else {
        scan();
    }

    // --- Public API (optional manual loading) ---
    window.BSForge = {
        version: VERSION,
        load: loadComponent,
        scan: scan,
    };

})();