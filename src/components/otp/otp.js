/*!
 * BSForge — OTP Input v0.5.0
 *
 * Attributes:
 *   data-length           — number of inputs (default: 6)
 *   data-type             — "numeric" | "alphanumeric" (default: numeric)
 *   data-name             — hidden input name for form submit (default: otp)
 *   data-size             — "sm" | "md" | "lg" (default: md)
 *   data-gap              — "sm" | "md" | "lg" (default: md)
 *   data-variant          — "outlined" | "filled" | "underline" (default: outlined)
 *   data-autofocus        — "true" — focus first input on load
 *   data-separator        — number — divider after N inputs (e.g. "3" → 123 – 456)
 *   data-separator-char   — custom separator character (default: –)
 *   data-placeholder      — placeholder char shown in empty inputs (default: none)
 *   data-oncomplete       — global function name called with completed code string
 *   data-onchange         — global function name called on every keystroke (value, complete)
 *   data-mask             — "true" — show dots instead of digits
 *   data-readonly         — "true" — display only, no editing
 *   data-disabled         — "true" — fully disabled
 *   data-required         — "true" — validates on form submit
 *   data-timeout          — seconds — auto-clear after completing
 *   data-secure-clear     — seconds — auto-clear after page load regardless of state
 *   data-pattern          — custom regex string for allowed characters
 *
 * Public API (via wrapper._bsforge):
 *   getValue()            — returns code string or null if incomplete
 *   setValue("1234")      — sets code programmatically
 *   reset()               — clears all inputs
 *   setError(bool)        — true = error state, false = success state
 *   disable()             — disables the OTP
 *   enable()              — enables the OTP
 *
 * DOM Events (fired on the wrapper element):
 *   bsforge:change        — fires on every input change  → detail: { value, complete }
 *   bsforge:complete      — fires when all inputs filled → detail: { value }
 *   bsforge:reset         — fires on reset               → detail: {}
 */

(function () {
    'use strict';

    function initOTP(el) {
        const length        = parseInt(el.dataset.length) || 6;
        const type          = el.dataset.type || 'numeric';
        const name          = el.dataset.name || 'otp';
        const size          = el.dataset.size || 'md';
        const gap           = el.dataset.gap || 'md';
        const variant       = el.dataset.variant || 'outlined';
        const autofocus     = el.dataset.autofocus === 'true';
        const separator     = el.dataset.separator ? parseInt(el.dataset.separator) : null;
        const separatorChar = el.dataset.separatorChar || '–';
        const placeholder   = el.dataset.placeholder || '';
        const onComplete    = el.dataset.oncomplete || null;
        const onChange      = el.dataset.onchange || null;
        const mask          = el.dataset.mask === 'true';
        const readonly      = el.dataset.readonly === 'true';
        const disabled      = el.dataset.disabled === 'true';
        const required      = el.dataset.required === 'true';
        const timeout       = el.dataset.timeout     ? parseInt(el.dataset.timeout)     * 1000 : null;
        const secureClear   = el.dataset.secureClear ? parseInt(el.dataset.secureClear) * 1000 : null;
        const customPattern = el.dataset.pattern || null;
        const inputMode     = type === 'numeric' ? 'numeric' : 'text';

        let timeoutHandle = null;

        // ── Wrapper ──
        const wrapper = document.createElement('div');
        wrapper.className = [
            'bsforge-otp',
            `bsforge-otp--${size}`,
            `bsforge-otp--gap-${gap}`,
            `bsforge-otp--${variant}`,
            'd-flex align-items-center',
        ].join(' ');

        if (el.id)    wrapper.id = el.id;
        if (disabled) wrapper.classList.add('bsforge-otp--disabled');

        // Hidden input for forms
        const hidden  = document.createElement('input');
        hidden.type   = 'hidden';
        hidden.name   = name;
        if (required) hidden.required = true;
        wrapper.appendChild(hidden);

        // ── Build inputs ──
        const inputs = [];

        for (let i = 0; i < length; i++) {
            if (separator && i > 0 && i % separator === 0) {
                const sep       = document.createElement('span');
                sep.className   = 'bsforge-otp__separator';
                sep.textContent = separatorChar;
                sep.setAttribute('aria-hidden', 'true');
                wrapper.appendChild(sep);
            }

            const input        = document.createElement('input');
            input.type         = mask ? 'password' : 'text';
            input.maxLength    = 1;
            input.inputMode    = inputMode;
            input.className    = 'bsforge-otp__input';
            input.autocomplete = 'one-time-code';
            input.placeholder  = placeholder;
            input.setAttribute('aria-label', `Digit ${i + 1} of ${length}`);

            if (readonly) { input.readOnly = true; input.tabIndex = -1; }
            if (disabled) { input.disabled = true; }

            inputs.push(input);
            wrapper.appendChild(input);
        }

        // Secure clear — starts immediately on page load
        if (secureClear) {
            setTimeout(() => {
                api.reset();
                api.disable();
            }, secureClear);
        }

        // ── Helpers ──

        function isValid(char) {
            if (customPattern) return new RegExp(customPattern).test(char);
            return type === 'numeric'
                ? /^[0-9]$/.test(char)
                : /^[A-Za-z0-9]$/.test(char);
        }

        function firstEmptyIndex() {
            const i = inputs.findIndex(inp => !inp.value);
            return i === -1 ? length - 1 : i;
        }

        function fireEvent(evtName, detail) {
            wrapper.dispatchEvent(new CustomEvent(evtName, { bubbles: true, detail }));
        }

        function clearError() {
            inputs.forEach(inp => inp.classList.remove('is-invalid', 'is-valid'));
            wrapper.classList.remove('bsforge-otp--error', 'bsforge-otp--success');
        }

        function updateValue() {
            hidden.value   = inputs.map(inp => inp.value).join('');
            const complete = hidden.value.length === length;

            // data-onchange callback — every keystroke
            if (onChange) {
                const fn = window[onChange];
                if (typeof fn === 'function') fn(hidden.value, complete);
            }

            fireEvent('bsforge:change', { value: hidden.value, complete });

            if (complete) {
                wrapper.classList.add('bsforge-otp--pulse');
                setTimeout(() => wrapper.classList.remove('bsforge-otp--pulse'), 400);

                // data-oncomplete callback
                if (onComplete) {
                    const fn = window[onComplete];
                    if (typeof fn === 'function') fn(hidden.value);
                }

                fireEvent('bsforge:complete', { value: hidden.value });

                if (timeout) {
                    clearTimeout(timeoutHandle);
                    timeoutHandle = setTimeout(() => api.reset(), timeout);
                }
            }
        }

        // ── Events ──

        inputs.forEach((input, index) => {

            input.addEventListener('input', (e) => {
                if (readonly || disabled) return;
                clearError();
                const val = e.target.value;

                if (val.length > 1) {
                    const chars = val.split('').filter(isValid);
                    chars.forEach((char, i) => {
                        if (inputs[index + i]) inputs[index + i].value = char;
                    });
                    inputs[Math.min(index + chars.length, length - 1)]?.focus();
                } else {
                    if (!isValid(val)) { input.value = ''; return; }
                    if (inputs[index + 1]) inputs[index + 1].focus();
                }

                updateValue();
            });

            input.addEventListener('keydown', (e) => {
                if (readonly || disabled) return;
                if (e.key === 'Backspace' && !input.value && inputs[index - 1]) {
                    inputs[index - 1].focus();
                    inputs[index - 1].value = '';
                    updateValue();
                }
                if (e.key === 'ArrowLeft'  && inputs[index - 1]) inputs[index - 1].focus();
                if (e.key === 'ArrowRight' && inputs[index + 1]) inputs[index + 1].focus();
            });

            input.addEventListener('focus', () => {
                if (readonly || disabled) return;
                const target = firstEmptyIndex();
                if (index !== target) { inputs[target].focus(); return; }
                input.select();
            });
        });

        wrapper.addEventListener('paste', (e) => {
            if (readonly || disabled) return;
            e.preventDefault();
            clearError();
            const text = e.clipboardData.getData('text').split('').filter(isValid);
            text.forEach((char, i) => { if (inputs[i]) inputs[i].value = char; });
            inputs[Math.min(text.length, length - 1)]?.focus();
            updateValue();
        });

        // Native form.reset() support
        wrapper.addEventListener('reset-bsforge', () => api.reset());
        const form = el.closest('form') || wrapper.closest('form');
        if (form) {
            // Form submit validation
            if (required) {
                form.addEventListener('submit', (e) => {
                    if (hidden.value.length < length) {
                        e.preventDefault();
                        api.setError(true);
                    }
                });
            }
            // Native form reset
            form.addEventListener('reset', () => {
                setTimeout(() => api.reset(), 0);
            });
        }

        if (autofocus) setTimeout(() => inputs[0]?.focus(), 50);

        // ── Public API ──
        const api = {
            // Returns code string if complete, null if incomplete
            getValue() {
                const val = inputs.map(inp => inp.value).join('');
                return val.length === length ? val : null;
            },

            setValue(code) {
                String(code).split('').filter(isValid).forEach((c, i) => {
                    if (inputs[i]) inputs[i].value = c;
                });
                updateValue();
            },

            reset() {
                clearTimeout(timeoutHandle);
                inputs.forEach(inp => inp.value = '');
                clearError();
                hidden.value = '';
                // Only focus if user is already inside this OTP
                if (wrapper.contains(document.activeElement)) {
                    inputs[0]?.focus();
                }
                fireEvent('bsforge:reset', {});
            },

            setError(state) {
                clearError();
                if (state === true) {
                    inputs.forEach(inp => inp.classList.add('is-invalid'));
                    wrapper.classList.add('bsforge-otp--error');
                }
                if (state === false) {
                    inputs.forEach(inp => inp.classList.add('is-valid'));
                    wrapper.classList.add('bsforge-otp--success');
                }
            },

            disable() {
                inputs.forEach(inp => inp.disabled = true);
                wrapper.classList.add('bsforge-otp--disabled');
            },

            enable() {
                inputs.forEach(inp => inp.disabled = false);
                wrapper.classList.remove('bsforge-otp--disabled');
            },
        };

        el.replaceWith(wrapper);
        wrapper._bsforge = api;
    }

    document.querySelectorAll('[data-bsforge="otp"]').forEach(initOTP);

})();
