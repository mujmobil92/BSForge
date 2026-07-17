/*!
 * BSForge — OTP Input v0.3.0
 *
 * Attributes:
 *   data-length       — number of inputs (default: 6)
 *   data-type         — "numeric" | "alphanumeric" (default: numeric)
 *   data-name         — hidden input name for form submit (default: otp)
 *   data-size         — "sm" | "md" | "lg" (default: md)
 *   data-autofocus    — "true" — focus first input on load
 *   data-separator    — number — divider after N inputs (e.g. "3" → 123 – 456)
 *   data-oncomplete   — global function name called with completed code
 *   data-mask         — "true" — show dots instead of digits
 *   data-readonly     — "true" — display only, no editing
 *   data-disabled     — "true" — fully disabled
 *   data-required     — "true" — validates on form submit
 *   data-timeout      — seconds — auto-clear after N seconds
 *   data-gap          — "sm" | "md" | "lg" — gap between inputs
 *
 * Public API (via el._bsforge):
 *   getValue()        — returns current code string
 *   setValue("1234")  — sets code programmatically
 *   reset()           — clears all inputs
 *   setError(bool)    — true = error state, false = success state
 *   disable()         — disables the OTP
 *   enable()          — enables the OTP
 *
 * DOM Events (fired on the wrapper element):
 *   bsforge:change    — fires on every input change, detail: { value, complete }
 *   bsforge:complete  — fires when all inputs are filled, detail: { value }
 *   bsforge:reset     — fires on reset
 */

(function () {
    'use strict';

    function initOTP(el) {
        const length     = parseInt(el.dataset.length) || 6;
        const type       = el.dataset.type || 'numeric';
        const name       = el.dataset.name || 'otp';
        const size       = el.dataset.size || 'md';
        const gap        = el.dataset.gap || 'md';
        const autofocus  = el.dataset.autofocus === 'true';
        const separator  = el.dataset.separator ? parseInt(el.dataset.separator) : null;
        const onComplete = el.dataset.oncomplete || null;
        const mask       = el.dataset.mask === 'true';
        const readonly   = el.dataset.readonly === 'true';
        const disabled   = el.dataset.disabled === 'true';
        const required   = el.dataset.required === 'true';
        const timeout    = el.dataset.timeout ? parseInt(el.dataset.timeout) * 1000 : null;
        const inputMode  = type === 'numeric' ? 'numeric' : 'text';

        let timeoutHandle = null;

        // Wrapper
        const wrapper = document.createElement('div');
        wrapper.className = `bsforge-otp bsforge-otp--${size} bsforge-otp--gap-${gap} d-flex align-items-center`;
        if (disabled) wrapper.classList.add('bsforge-otp--disabled');

        // Hidden input for form submit
        const hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = name;
        if (required) hidden.required = true;
        wrapper.appendChild(hidden);

        // Build inputs
        const inputs = [];
        for (let i = 0; i < length; i++) {
            if (separator && i > 0 && i % separator === 0) {
                const sep = document.createElement('span');
                sep.className = 'bsforge-otp__separator text-secondary';
                sep.textContent = '–';
                wrapper.appendChild(sep);
            }

            const input = document.createElement('input');
            input.type         = mask ? 'password' : 'text';
            input.maxLength    = 1;
            input.inputMode    = inputMode;
            input.className    = 'form-control text-center bsforge-otp__input';
            input.autocomplete = 'one-time-code';
            input.setAttribute('aria-label', `Digit ${i + 1} of ${length}`);
            if (readonly)  { input.readOnly  = true; input.tabIndex = -1; }
            if (disabled)  { input.disabled  = true; }

            inputs.push(input);
            wrapper.appendChild(input);
        }

        // ── Helpers ──

        function isValid(char) {
            return type === 'numeric' ? /^[0-9]$/.test(char) : /^[A-Za-z0-9]$/.test(char);
        }

        function firstEmptyIndex() {
            const i = inputs.findIndex(inp => !inp.value);
            return i === -1 ? length - 1 : i;
        }

        function fireEvent(name, detail) {
            wrapper.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
        }

        function updateValue() {
            hidden.value = inputs.map(i => i.value).join('');
            const complete = hidden.value.length === length;

            fireEvent('bsforge:change', { value: hidden.value, complete });

            if (complete) {
                // Animate success pulse
                wrapper.classList.add('bsforge-otp--pulse');
                setTimeout(() => wrapper.classList.remove('bsforge-otp--pulse'), 400);

                // data-oncomplete callback
                if (onComplete) {
                    const fn = window[onComplete];
                    if (typeof fn === 'function') fn(hidden.value);
                }

                fireEvent('bsforge:complete', { value: hidden.value });

                // Auto-clear timeout
                if (timeout) {
                    clearTimeout(timeoutHandle);
                    timeoutHandle = setTimeout(() => api.reset(), timeout);
                }
            }
        }

        function clearError() {
            inputs.forEach(i => i.classList.remove('is-invalid', 'is-valid'));
            wrapper.classList.remove('bsforge-otp--error', 'bsforge-otp--success');
        }

        // ── Events ──

        inputs.forEach((input, index) => {

            input.addEventListener('input', (e) => {
                if (readonly || disabled) return;
                clearError();
                const val = e.target.value;

                if (val.length > 1) {
                    const chars = val.split('').filter(isValid);
                    chars.forEach((char, i) => { if (inputs[index + i]) inputs[index + i].value = char; });
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

        // Paste on wrapper
        wrapper.addEventListener('paste', (e) => {
            if (readonly || disabled) return;
            e.preventDefault();
            clearError();
            const text = e.clipboardData.getData('text').split('').filter(isValid);
            text.forEach((char, i) => { if (inputs[i]) inputs[i].value = char; });
            inputs[Math.min(text.length, length - 1)]?.focus();
            updateValue();
        });

        // Form validation
        if (required) {
            const form = el.closest('form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    if (hidden.value.length < length) {
                        e.preventDefault();
                        api.setError(true);
                    }
                });
            }
        }

        if (autofocus) setTimeout(() => inputs[0]?.focus(), 50);

        // ── Public API ──
        const api = {
            getValue()      { return inputs.map(i => i.value).join(''); },
            setValue(code)  {
                String(code).split('').filter(isValid).forEach((c, i) => { if (inputs[i]) inputs[i].value = c; });
                updateValue();
            },
            reset() {
                clearTimeout(timeoutHandle);
                inputs.forEach(i => i.value = '');
                clearError();
                hidden.value = '';
                inputs[0]?.focus();
                fireEvent('bsforge:reset', {});
            },
            setError(state) {
                clearError();
                if (state === true)  { inputs.forEach(i => i.classList.add('is-invalid'));  wrapper.classList.add('bsforge-otp--error'); }
                if (state === false) { inputs.forEach(i => i.classList.add('is-valid'));    wrapper.classList.add('bsforge-otp--success'); }
            },
            disable() { inputs.forEach(i => i.disabled = true);  wrapper.classList.add('bsforge-otp--disabled'); },
            enable()  { inputs.forEach(i => i.disabled = false); wrapper.classList.remove('bsforge-otp--disabled'); },
        };

        el.replaceWith(wrapper);
        wrapper._bsforge = api;
    }

    document.querySelectorAll('[data-bsforge="otp"]').forEach(initOTP);

})();
