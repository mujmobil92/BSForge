/*!
 * BSForge — Dropzone v0.1.0
 *
 * Attributes:
 *   data-accept       — allowed file types e.g. ".pdf,.jpg,.png" (default: all)
 *   data-max-size     — max file size e.g. "10MB", "500KB" (default: unlimited)
 *   data-multiple     — "true" — allow multiple files (default: false)
 *   data-max-files    — max number of files e.g. "5" (default: unlimited)
 *   data-name         — input name for form submit (default: files)
 *   data-label        — custom label text (default: "Drop files here or click to browse")
 *   data-onchange     — global function called when files change (files)
 *
 * Public API (via wrapper._bsforge):
 *   getFiles()        — returns current FileList array
 *   reset()           — clears all files
 *   disable()         — disables the dropzone
 *   enable()          — enables the dropzone
 *
 * DOM Events:
 *   bsforge:change    — fires when files change  → detail: { files }
 *   bsforge:error     — fires on validation fail → detail: { message }
 */

(function () {
    'use strict';

    function parseSize(str) {
        if (!str) return Infinity;
        const match = String(str).match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB)?$/i);
        if (!match) return Infinity;
        const num  = parseFloat(match[1]);
        const unit = (match[2] || 'B').toUpperCase();
        return num * ({ B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 }[unit] || 1);
    }

    function formatSize(bytes) {
        if (bytes < 1024)        return bytes + ' B';
        if (bytes < 1024 ** 2)   return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 ** 3)   return (bytes / 1024 ** 2).toFixed(1) + ' MB';
        return (bytes / 1024 ** 3).toFixed(1) + ' GB';
    }

    function fileIcon(type) {
        if (type.startsWith('image/'))                         return 'bi-file-earmark-image';
        if (type === 'application/pdf')                        return 'bi-file-earmark-pdf';
        if (type.includes('word'))                             return 'bi-file-earmark-word';
        if (type.includes('excel') || type.includes('sheet')) return 'bi-file-earmark-excel';
        if (type.includes('zip') || type.includes('rar'))     return 'bi-file-earmark-zip';
        if (type.startsWith('video/'))                        return 'bi-file-earmark-play';
        if (type.startsWith('audio/'))                        return 'bi-file-earmark-music';
        if (type.startsWith('text/'))                         return 'bi-file-earmark-text';
        return 'bi-file-earmark';
    }

    function initDropzone(el) {
        const accept    = el.dataset.accept   || '';
        const maxSize   = parseSize(el.dataset.maxSize);
        const multiple  = el.dataset.multiple === 'true';
        const maxFiles  = el.dataset.maxFiles ? parseInt(el.dataset.maxFiles) : Infinity;
        const name      = el.dataset.name     || 'files';
        const label     = el.dataset.label    || 'Drop files here or click to browse';
        const onChange  = el.dataset.onchange || null;

        let files = [];
        let disabled = false;

        // Bootstrap Icons loaded?
        const hasIcons = document.querySelector('link[href*="bootstrap-icons"]');
        if (!hasIcons) {
            const link = document.createElement('link');
            link.rel  = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';
            document.head.appendChild(link);
        }

        // Wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'bsforge-dropzone';
        if (el.id) wrapper.id = el.id;

        // Accept info string
        const acceptLabel = accept
            ? accept.split(',').map(a => a.trim().replace('.', '').toUpperCase()).join(', ')
            : 'All file types';
        const sizeLabel = maxSize !== Infinity
            ? `up to ${el.dataset.maxSize}`
            : '';

        wrapper.innerHTML = `
            <div class="bsforge-dropzone__zone" tabindex="0" role="button"
                 aria-label="Drop zone — ${label}">
                <i class="bi bi-cloud-upload bsforge-dropzone__icon"></i>
                <p class="bsforge-dropzone__label mb-1">${label}</p>
                <p class="bsforge-dropzone__hint text-secondary small mb-0">
                    ${acceptLabel}${sizeLabel ? ' · ' + sizeLabel : ''}
                    ${multiple && maxFiles !== Infinity ? ' · max ' + maxFiles + ' files' : ''}
                </p>
            </div>
            <ul class="bsforge-dropzone__list list-unstyled mb-0"></ul>
            <input type="file" class="bsforge-dropzone__input visually-hidden"
                   name="${name}"
                   ${accept   ? `accept="${accept}"` : ''}
                   ${multiple ? 'multiple' : ''}>
        `;

        const zone  = wrapper.querySelector('.bsforge-dropzone__zone');
        const list  = wrapper.querySelector('.bsforge-dropzone__list');
        const input = wrapper.querySelector('.bsforge-dropzone__input');

        // Fire events
        function fireEvent(evtName, detail) {
            wrapper.dispatchEvent(new CustomEvent(evtName, { bubbles: true, detail }));
        }

        function showError(message) {
            fireEvent('bsforge:error', { message });
            zone.classList.add('bsforge-dropzone__zone--error');
            setTimeout(() => zone.classList.remove('bsforge-dropzone__zone--error'), 1200);
        }

        function validate(file) {
            if (maxSize !== Infinity && file.size > maxSize) {
                showError(`"${file.name}" is too large (max ${el.dataset.maxSize})`);
                return false;
            }
            if (accept) {
                const allowed = accept.split(',').map(a => a.trim().toLowerCase());
                const ext     = '.' + file.name.split('.').pop().toLowerCase();
                const mime    = file.type.toLowerCase();
                const ok      = allowed.some(a => a === ext || mime.startsWith(a.replace('*', '')));
                if (!ok) {
                    showError(`"${file.name}" is not an allowed file type`);
                    return false;
                }
            }
            return true;
        }

        function renderFiles() {
            list.innerHTML = '';
            files.forEach((file, index) => {
                const isImage = file.type.startsWith('image/');
                const li      = document.createElement('li');
                li.className  = 'bsforge-dropzone__item d-flex align-items-center gap-2';

                if (isImage) {
                    const img    = document.createElement('img');
                    img.className = 'bsforge-dropzone__thumb';
                    img.src      = URL.createObjectURL(file);
                    img.alt      = file.name;
                    li.appendChild(img);
                } else {
                    const icon    = document.createElement('i');
                    icon.className = `bi ${fileIcon(file.type)} bsforge-dropzone__file-icon`;
                    li.appendChild(icon);
                }

                const info      = document.createElement('div');
                info.className  = 'flex-grow-1 overflow-hidden';
                info.innerHTML  = `
                    <div class="bsforge-dropzone__filename text-truncate small fw-semibold">${file.name}</div>
                    <div class="text-secondary" style="font-size:.75rem">${formatSize(file.size)}</div>
                `;
                li.appendChild(info);

                const remove      = document.createElement('button');
                remove.type       = 'button';
                remove.className  = 'btn btn-sm btn-link text-danger p-0 bsforge-dropzone__remove';
                remove.innerHTML  = '<i class="bi bi-x-lg"></i>';
                remove.setAttribute('aria-label', `Remove ${file.name}`);
                remove.addEventListener('click', () => {
                    files.splice(index, 1);
                    renderFiles();
                    updateInput();
                    notifyChange();
                });
                li.appendChild(remove);

                list.appendChild(li);
            });

            wrapper.classList.toggle('bsforge-dropzone--has-files', files.length > 0);
        }

        function updateInput() {
            const dt = new DataTransfer();
            files.forEach(f => dt.items.add(f));
            input.files = dt.files;
        }

        function notifyChange() {
            if (onChange) {
                const fn = window[onChange];
                if (typeof fn === 'function') fn([...files]);
            }
            fireEvent('bsforge:change', { files: [...files] });
        }

        function addFiles(newFiles) {
            if (disabled) return;
            for (const file of newFiles) {
                if (!validate(file)) continue;
                if (!multiple) { files = [file]; break; }
                if (files.length >= maxFiles) {
                    showError(`Maximum ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed`);
                    break;
                }
                // Avoid duplicates
                if (!files.find(f => f.name === file.name && f.size === file.size)) {
                    files.push(file);
                }
            }
            renderFiles();
            updateInput();
            notifyChange();
        }

        // Click to browse
        zone.addEventListener('click', () => { if (!disabled) input.click(); });
        zone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') input.click(); });

        // File input change
        input.addEventListener('change', () => addFiles(Array.from(input.files)));

        // Drag events
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!disabled) zone.classList.add('bsforge-dropzone__zone--over');
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('bsforge-dropzone__zone--over'));
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('bsforge-dropzone__zone--over');
            if (!disabled) addFiles(Array.from(e.dataTransfer.files));
        });

        // Paste (Ctrl+V)
        document.addEventListener('paste', (e) => {
            if (disabled || !wrapper.isConnected) return;
            const items = Array.from(e.clipboardData.items)
                .filter(i => i.kind === 'file')
                .map(i => i.getAsFile())
                .filter(Boolean);
            if (items.length) addFiles(items);
        });

        // Public API
        const api = {
            getFiles()  { return [...files]; },
            reset()     { files = []; renderFiles(); updateInput(); notifyChange(); },
            disable()   { disabled = true;  wrapper.classList.add('bsforge-dropzone--disabled'); input.disabled = true; },
            enable()    { disabled = false; wrapper.classList.remove('bsforge-dropzone--disabled'); input.disabled = false; },
        };

        el.replaceWith(wrapper);
        wrapper._bsforge = api;
    }

    document.querySelectorAll('[data-bsforge="dropzone"]').forEach(initDropzone);

})();
