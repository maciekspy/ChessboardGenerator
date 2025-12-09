const SVG_NS = "http://www.w3.org/2000/svg";
const FILES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

// --- Configuration Mapping ---
// Defines all inputs, their types, and relationships
const CONFIG = [
    { key: 'light',      id: 'cLight',           type: 'color' },
    { key: 'dark',       id: 'cDark',            type: 'color' },
    { key: 'borderCol',  id: 'cBorder',          type: 'color' },
    { key: 'text',       id: 'cText',            type: 'color' },
    { key: 'size',       id: 'nSize',            type: 'int',    sliderId: 'rSize' },
    { key: 'borderW',    id: 'nBorder',          type: 'int',    sliderId: 'rBorder' },
    { key: 'fontS',      id: 'nFontSize',        type: 'int',    sliderId: 'rFontSize' },
    { key: 'cOuter',     id: 'cOuterFrame',      type: 'color' },
    { key: 'wOuter',     id: 'nOuterFrameWidth', type: 'int',    sliderId: 'rOuterFrameWidth' },
    { key: 'cInner',     id: 'cInnerFrame',      type: 'color' },
    { key: 'wInner',     id: 'nInnerFrameWidth', type: 'int',    sliderId: 'rInnerFrameWidth' }
];

// Presets Definition
const PRESETS = {
    basic:   { name: 'Basic (Black & White)',   values: { light: '#ffffff', dark: '#000000', borderCol: '#ffffff', text: '#000000', cOuter: '#000000', wOuter:  0, cInner: '#000000', wInner: 3, size: 60, borderW: 30, fontS: 15 } },
    classic: { name: 'Classic (Greyish)',       values: { light: '#FFFFFF', dark: '#404040', borderCol: '#202020', text: '#FFFFFF', cOuter: '#000000', wOuter: 10, cInner: '#FFFFFF', wInner: 5, size: 60, borderW: 30, fontS: 15 } },
    wood:    { name: 'Wooden',                  values: { light: '#F0D9B5', dark: '#B58863', borderCol: '#5C4033', text: '#FFFFFF', cOuter: '#3E2723', wOuter: 15, cInner: '#D7CCC8', wInner: 8, size: 70, borderW: 35, fontS: 18 } },
    blue:    { name: 'Ocean Blue',              values: { light: '#DEE3E6', dark: '#8CA2AD', borderCol: '#405055', text: '#FFFFFF', cOuter: '#2F3538', wOuter: 12, cInner: '#FFFFFF', wInner: 6, size: 65, borderW: 32, fontS: 16 } },
    green:   { name: 'Forest Green',            values: { light: '#EEF0C2', dark: '#769656', borderCol: '#3E4F2B', text: '#FFFFFF', cOuter: '#283618', wOuter: 18, cInner: '#F0F2D5', wInner: 9, size: 75, borderW: 40, fontS: 20 } },
    purple:  { name: 'Royal Purple',            values: { light: '#E2D1F0', dark: '#7C4D9F', borderCol: '#4A2563', text: '#FFFFFF', cOuter: '#2D1B36', wOuter: 10, cInner: '#F3E5F5', wInner: 5, size: 60, borderW: 30, fontS: 15 } }
};

// --- DOM Elements ---
const container = document.getElementById('previewContainer');
const boardSizeDisplay = document.getElementById('boardSizeDisplay');
const inputs = {}; // Populated dynamically

// --- Initialization ---

function init() {
    CONFIG.forEach(item => {
        const input = document.getElementById(item.id);
        if (!input) return;
        
        inputs[item.key] = input;
        
        input.addEventListener('input', () => {
            syncSlider(item);
            generateBoard();
        });

        if (item.sliderId) {
            const slider = document.getElementById(item.sliderId);
            if (slider) {
                inputs[item.key + '_slider'] = slider;
                slider.addEventListener('input', () => {
                    input.value = slider.value;
                    generateBoard();
                });
                syncSlider(item); 
            }
        }
    });

    const presetSelector = document.getElementById('presetSelector');
    Object.keys(PRESETS).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = PRESETS[key].name;
        presetSelector.appendChild(option);
    });

    presetSelector.addEventListener('change', (e) => {
        const preset = PRESETS[e.target.value];
        if (preset && preset.values) {
            applyPreset(preset.values);
            generateBoard();
        }
    });

    loadFromHash();
    generateBoard();
}

function syncSlider(item) {
    if (item.sliderId && inputs[item.key + '_slider']) {
        inputs[item.key + '_slider'].value = inputs[item.key].value;
    }
}

function generateBoard() {
    const vals = {};
    CONFIG.forEach(item => {
        const val = inputs[item.key].value;
        vals[item.key] = item.type === 'int' ? parseInt(val) || 0 : val;
    });

    const maxFont = vals.borderW > 5 ? vals.borderW - 5 : 3;
    vals.fontS = Math.max(3, Math.min(vals.fontS, maxFont));

    const boardPx = vals.size * 8;
    const totalSize = boardPx + (vals.borderW * 2) + (vals.wInner * 2) + (vals.wOuter * 2);

    const svg = createSVG('svg', {
        width: totalSize,
        height: totalSize,
        viewBox: `0 0 ${totalSize} ${totalSize}`,
        xmlns: SVG_NS
    });

    if (vals.wOuter > 0) {
        svg.appendChild(createRect(0, 0, totalSize, totalSize, vals.cOuter));
    }

    const labelBgSize = totalSize - (vals.wOuter * 2);
    if (labelBgSize > 0) {
        svg.appendChild(createRect(vals.wOuter, vals.wOuter, labelBgSize, labelBgSize, vals.borderCol));
    }

    const innerStart = vals.wOuter + vals.borderW;
    const innerSize = boardPx + (vals.wInner * 2);
    if (vals.wInner > 0) {
        svg.appendChild(createRect(innerStart, innerStart, innerSize, innerSize, vals.cInner));
    }

    const boardStart = innerStart + vals.wInner;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const x = boardStart + (col * vals.size);
            const y = boardStart + (row * vals.size);
            const fill = (row + col) % 2 === 0 ? vals.light : vals.dark;
            svg.appendChild(createRect(x, y, vals.size, vals.size, fill));
        }
    }

    if (vals.borderW > 0) {
        drawLabels(svg, vals, boardStart, totalSize);
    }

    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'board-wrapper';
    wrapper.appendChild(svg);
    container.appendChild(wrapper);

    boardSizeDisplay.textContent = `Board Size: ${totalSize}px x ${totalSize}px`;

    updateURLHash();
}

function drawLabels(svg, vals, boardStart, totalSize) {
    const halfSq = vals.size / 2;
    const midMargin = vals.borderW / 2;
    
    const topY = vals.wOuter + midMargin;
    const botY = totalSize - vals.wOuter - midMargin;
    const leftX = vals.wOuter + midMargin;
    const rightX = totalSize - vals.wOuter - midMargin;

    for (let i = 0; i < 8; i++) {
        const center = boardStart + (i * vals.size) + halfSq;

        svg.appendChild(createText(FILES[i], center, topY, vals.fontS, vals.text));
        svg.appendChild(createText(FILES[i], center, botY, vals.fontS, vals.text));

        svg.appendChild(createText(RANKS[i], leftX, center, vals.fontS, vals.text));
        svg.appendChild(createText(RANKS[i], rightX, center, vals.fontS, vals.text));
    }
}

function createSVG(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k]));
    return el;
}

function createRect(x, y, w, h, fill) {
    return createSVG('rect', { x, y, width: w, height: h, fill });
}

function createText(content, x, y, fontSize, color) {
    const el = createSVG('text', {
        x, y, fill: color,
        'font-family': 'Arial, sans-serif',
        'font-size': fontSize,
        'font-weight': 'bold',
        'text-anchor': 'middle',
        'dominant-baseline': 'middle'
    });
    el.textContent = content;
    return el;
}

function applyPreset(values) {
    Object.keys(values).forEach(key => {
        if (inputs[key]) {
            inputs[key].value = values[key];
            const item = CONFIG.find(c => c.key === key);
            if (item) syncSlider(item);
        }
    });
}

function updateURLHash() {
    const params = new URLSearchParams();
    CONFIG.forEach(item => {
        let val = inputs[item.key].value;
        if (item.type === 'color' && val.startsWith('#')) {
            val = val.substring(1);
        }
        params.set(item.key, val);
    });
    history.replaceState(null, null, '#' + params.toString());
}

function loadFromHash() {
    if (!window.location.hash) return;
    const params = new URLSearchParams(window.location.hash.substring(1));
    
    CONFIG.forEach(item => {
        if (params.has(item.key)) {
            let val = params.get(item.key);
            if (item.type === 'color' && !val.startsWith('#')) {
                val = '#' + val;
            }
            inputs[item.key].value = val;
            syncSlider(item);
        }
    });
}

function downloadSVG() {
    const svgEl = container.querySelector('svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    triggerDownload(URL.createObjectURL(new Blob([svgData], { 
        type: "image/svg+xml;charset=utf-8" })), "chessboard.svg");
}

function downloadPNG() {
    const svgEl = container.querySelector('svg');
    if (!svgEl) return;
    
    const w = parseInt(svgEl.getAttribute('width'));
    const h = parseInt(svgEl.getAttribute('height'));
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const url = URL.createObjectURL(new Blob([svgData], { type: "image/svg+xml;charset=utf-8" }));
    
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.onload = () => {
        ctx.drawImage(img, 0, 0);
        triggerDownload(canvas.toDataURL("image/png"), "chessboard.png");
        URL.revokeObjectURL(url);
    };
    img.src = url;
}

function triggerDownload(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function shareConfig() {
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({
            title: 'Chessboard Configuration',
            text: 'Check out this chessboard configuration!',
            url: url
        }).catch(err => {
            console.log('Share failed:', err);
            copyToClipboard(url);
        });
    } else {
        copyToClipboard(url);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Configuration URL copied to clipboard!');
    }, (err) => {
        console.error('Could not copy text: ', err);

        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            alert('Configuration URL copied to clipboard!');
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
            alert('Failed to copy URL. Please copy it manually from the address bar.');
        }
        document.body.removeChild(textArea);
    });
}

init();