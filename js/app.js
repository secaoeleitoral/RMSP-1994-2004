/**
 * Seção Eleitoral - RMSP 1994-2004
 * Main application logic for the redesigned layout.
 */

(function () {
    'use strict';

    const DEFAULT_CENTER = [-23.55, -46.63];
    const DEFAULT_ZOOM = 10;
    const INVALID_CODES = new Set(['95', '96']);
    const TILE_LAYERS = {
        dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    };
    const TILE_ATTRIBUTION =
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> ' +
        '&copy; <a href="https://carto.com/attributions">CARTO</a> | Dados: CEM/CEBRAP';

    const state = {
        geojson: null,
        map: null,
        baseLayer: null,
        markersLayer: null,
        allBounds: null,
        currentCargo: 'presidente_1t',
        currentMunicipio: '',
        currentBairro: null,
        currentLocalId: null,
        colorMode: 'gradient',
        vizMode: 'vencedor',
        perfCandidateCode: null,
        perfFilterPct: 0,
        perfFilterMaxPct: 100,
        perfStats: null,
        colorOverrides: getInitialColorOverrides(),
        activeColorFamily: null,
        activeColorLabel: '',
        activeColorAnchor: null,
        draftColorValue: '',
        selectedFeatureId: null,
        selectedFeature: null,
        selectedMarker: null,
        candidatesExpanded: false,
        vencidosCandidateCode: null,
        theme: getInitialTheme(),
        currentYear: '2002',
        suppressNextMapClick: false
    };

    const dom = {
        loading: document.getElementById('loading'),
        searchInput: document.getElementById('searchInput'),
        searchClear: document.getElementById('searchClear'),
        searchDropdown: document.getElementById('searchDropdown'),
        bairroInput: document.getElementById('bairroInput'),
        bairroClear: document.getElementById('bairroClear'),
        bairroDropdown: document.getElementById('bairroDropdown'),
        btnSomarBairro: document.getElementById('btnSomarBairro'),
        loadingText: document.querySelector('.loading-text'),
        panelLeft: document.getElementById('panelLeft'),
        panelRight: document.getElementById('panelRight'),
        expandLeft: document.getElementById('expandLeft'),
        expandRight: document.getElementById('expandRight'),
        collapseLeft: document.getElementById('collapseLeft'),
        collapseRight: document.getElementById('collapseRight'),
        themeToggle: document.getElementById('themeToggle'),
        selectCargo: document.getElementById('selectCargo'),
        selectTurno: document.getElementById('selectTurno'),
        selectMunicipio: document.getElementById('selectMunicipio'),
        chipSolid: document.getElementById('chipSolid'),
        chipGradient: document.getElementById('chipGradient'),
        colorModal: document.getElementById('colorModal'),
        colorModalPanel: document.getElementById('colorModalPanel'),
        closeColorModal: document.getElementById('closeColorModal'),
        colorModalTitle: document.getElementById('colorModalTitle'),
        colorPresetGrid: document.getElementById('colorPresetGrid'),
        customColorInput: document.getElementById('customColorInput'),
        resetColorButton: document.getElementById('resetColorButton'),
        applyColorButton: document.getElementById('applyColorButton'),
        legendItems: document.getElementById('legendItems'),
        rightTitle: document.getElementById('rightTitle'),
        placeholder: document.getElementById('placeholder'),
        localInfo: document.getElementById('localInfo'),
        localName: document.getElementById('localName'),
        localMeta: document.getElementById('localMeta'),
        metricsGrid: document.getElementById('metricsGrid'),
        candidatesTitle: document.getElementById('candidatesTitle'),
        candidatesGrid: document.getElementById('candidatesGrid'),
        btnVerMais: document.getElementById('btnVerMais'),
        chipYear2004: document.getElementById('chipYear2004'),
        chipYear2002: document.getElementById('chipYear2002'),
        chipYear2000: document.getElementById('chipYear2000'),
        chipYear1998: document.getElementById('chipYear1998'),
        chipYear1996: document.getElementById('chipYear1996'),
        chipYear1994: document.getElementById('chipYear1994'),
        chipVencedor: document.getElementById('chipVencedor'),
        chipVencidos: document.getElementById('chipVencidos'),
        chipDesempenho: document.getElementById('chipDesempenho'),
        vencedorOptions: document.getElementById('vencedorOptions'),
        vencidosOptions: document.getElementById('vencidosOptions'),
        desempenhoOptions: document.getElementById('desempenhoOptions'),
        selectPerfCandidate: document.getElementById('selectPerfCandidate'),
        selectVencidosCandidate: document.getElementById('selectVencidosCandidate'),
        gradientBar: document.getElementById('gradientBar'),
        gradientMin: document.getElementById('gradientMin'),
        gradientMax: document.getElementById('gradientMax'),
        perfSummary: document.getElementById('perfSummary'),
        perfFilterSlider: document.getElementById('perfFilterSlider'),
        perfFilterSliderMax: document.getElementById('perfFilterSliderMax'),
        rangeSelection: document.getElementById('rangeSelection'),
        perfFilterLabel: document.getElementById('perfFilterLabel')
    };

    function getInitialTheme() {
        try {
            const stored = window.localStorage.getItem('secao-eleitoral-theme');
            if (stored === 'light' || stored === 'dark') {
                return stored;
            }
        } catch (error) {
            // Ignore localStorage errors and fall back to DOM theme.
        }

        return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    }

    function getInitialColorOverrides() {
        return {};
    }

    function persistColorOverrides() {
        // Removido: cores customizadas agora resetam no reload da pÃ¡gina.
    }

    function applyColorOverridesFromState() {
        if (typeof applyColorOverrides === 'function') {
            applyColorOverrides(state.colorOverrides);
        }
    }

    function initMap() {
        state.map = L.map('map', {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            preferCanvas: true,
            zoomControl: true
        });

        state.map.zoomControl.setPosition('bottomright');
        updateBaseLayer();

        state.map.on('zoomend', handleMapZoomEnd);
        state.map.on('click', clearSelection);

        setupBoxSelect();
    }    // ── BOX SELECT ─────────────────────────────────────────────────────────────
    function setupBoxSelect() {
        const map = state.map;
        const mapContainer = map.getContainer();

        // Rubber-band overlay
        const rb = document.createElement('div');
        rb.id = 'rubberBand';
        Object.assign(rb.style, {
            display: 'none', position: 'absolute', zIndex: '1000',
            pointerEvents: 'none', border: '2px dashed #3b82f6',
            background: 'rgba(59,130,246,0.12)',
            boxShadow: '0 0 0 1px rgba(59,130,246,0.25)'
        });
        mapContainer.appendChild(rb);

        // Control button
        let active = false;
        let btnEl = null;

        const BoxSelectControl = L.Control.extend({
            options: { position: 'bottomright' },
            onAdd() {
                const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control box-select-btn');
                btn.id = 'btnBoxSelect';
                btn.title = 'Selecionar locais por arrasto';
                btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="2" width="12" height="12" rx="1" stroke-dasharray="3 2"/><circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none"/></svg>`;
                L.DomEvent.disableClickPropagation(btn);
                L.DomEvent.on(btn, 'click', () => {
                    active = !active;
                    btn.style.background = active ? 'var(--accent,#2563eb)' : '';
                    btn.style.color      = active ? '#fff' : '';
                    btn.classList.toggle('active-select', active);
                    if (active) {
                        map.dragging.disable();
                        mapContainer.style.cursor = 'crosshair';
                    } else {
                        map.dragging.enable();
                        mapContainer.style.cursor = '';
                        rb.style.display = 'none';
                    }
                });
                btnEl = btn;
                return btn;
            }
        });
        map.addControl(new BoxSelectControl());

        // Drag state
        let dragging = false;
        let startPx, startLatLng;

        function getXY(e) {
            const r = mapContainer.getBoundingClientRect();
            const s = e.touches ? e.touches[0] : e;
            return { x: s.clientX - r.left, y: s.clientY - r.top };
        }

        // Mousedown on map container
        mapContainer.addEventListener('mousedown', (e) => {
            if (!active || e.button !== 0) return;
            dragging = true;
            startPx = getXY(e);
            startLatLng = map.containerPointToLatLng([startPx.x, startPx.y]);
            Object.assign(rb.style, {
                display: 'block', left: startPx.x + 'px', top: startPx.y + 'px',
                width: '0px', height: '0px'
            });
            e.stopPropagation();
            e.preventDefault();
        }, true);

        // Mousemove anywhere (capture out-of-map)
        document.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            const cur = getXY(e);
            const x = Math.min(cur.x, startPx.x);
            const y = Math.min(cur.y, startPx.y);
            Object.assign(rb.style, {
                left: x + 'px', top: y + 'px',
                width:  Math.abs(cur.x - startPx.x) + 'px',
                height: Math.abs(cur.y - startPx.y) + 'px'
            });
        });

        // Mouseup anywhere
        document.addEventListener('mouseup', (e) => {
            if (!dragging) return;
            dragging = false;
            rb.style.display = 'none';

            // Compute end latLng
            const r = mapContainer.getBoundingClientRect();
            const endPx = { x: e.clientX - r.left, y: e.clientY - r.top };
            const endLatLng = map.containerPointToLatLng([endPx.x, endPx.y]);
            const bounds = L.latLngBounds(startLatLng, endLatLng);

            // Deactivate mode without using btn.click() to avoid re-triggering
            active = false;
            if (btnEl) {
                btnEl.style.background = '';
                btnEl.style.color = '';
                btnEl.classList.remove('active-select');
            }
            map.dragging.enable();
            mapContainer.style.cursor = '';

            // Suppress the Leaflet map click that fires after mouseup
            state.suppressNextMapClick = true;

            aggregateInBounds(bounds);
        });
    }

    function aggregateInBounds(bounds) {
        if (!state.markersLayer) return;

        const features = [];
        state.markersLayer.eachLayer((marker) => {
            if (!marker._featureData) return;
            const [lon, lat] = marker._featureData.geometry.coordinates;
            if (bounds.contains([lat, lon])) {
                features.push(marker._featureData);
            }
        });

        if (!features.length) return;

        const cargoData = getCandidates()[state.currentCargo] || { candidates: {} };
        const aggregated = {};

        features.forEach((feature) => {
            const votes = feature.properties[state.currentCargo] || {};
            for (const code in votes) {
                aggregated[code] = (aggregated[code] || 0) + (Number(votes[code]) || 0);
            }
        });

        const entries = Object.entries(aggregated)
            .map(([code, total]) => {
                const info = cargoData.candidates[code] || { nome: `Candidato ${code}`, partido: '', cor: '#737373' };
                const isInvalid = INVALID_CODES.has(code);
                return { code, votos: total, info: { ...info }, isInvalid };
            })
            .sort((a, b) => b.votos - a.votos);

        const validEntries   = entries.filter((e) => !e.isInvalid);
        const invalidEntries = entries.filter((e) => e.isInvalid);
        const validTotal     = validEntries.reduce((s, e) => s + e.votos, 0);
        const invalidTotal   = invalidEntries.reduce((s, e) => s + e.votos, 0);
        const total          = validTotal + invalidTotal;
        const winner         = validEntries[0] || null;
        const runnerUp       = validEntries[1] || null;
        const winnerPct      = winner && validTotal > 0 ? (winner.votos / validTotal) * 100 : 0;
        const marginVotes    = winner ? winner.votos - (runnerUp?.votos || 0) : 0;
        const marginPct      = validTotal > 0 ? (marginVotes / validTotal) * 100 : 0;

        const munCount = {};
        features.forEach((f) => { const m = f.properties.municipio || ''; munCount[m] = (munCount[m] || 0) + 1; });
        const dominantMun = Object.entries(munCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

        const summary    = { entries, validEntries, invalidEntries, validTotal, invalidTotal, total, winner, runnerUp, winnerPct, marginVotes, marginPct };
        const props      = { municipio: dominantMun, distrito: '' };
        const cargoLabel = getCandidates()[state.currentCargo]?.label || 'Cargo';

        if (dom.placeholder) dom.placeholder.style.display = 'none';
        if (dom.localInfo)   dom.localInfo.style.display = 'block';
        if (dom.localName)   dom.localName.textContent = `Seleção — ${features.length} local${features.length !== 1 ? 'is' : ''}`;
        if (dom.localMeta)   dom.localMeta.innerHTML = [
            `Municípios: ${Object.keys(munCount).map(titleCase).join(', ')}`,
            `Soma de ${features.length} locais de votação`
        ].map((item) => `<span>${item}</span>`).join('');

        renderMetrics(summary, props);
        renderCandidateCards(summary, cargoLabel, { properties: props });
    }

    function handleMapZoomEnd() {
        if (!state.markersLayer) {
            return;
        }

        const radius = getMarkerRadius(state.map.getZoom());
        state.markersLayer.eachLayer((layer) => {
            if (layer.setRadius) {
                layer.setRadius(radius);
            }
        });
    }

    function updateBaseLayer() {
        if (!state.map) {
            return;
        }

        if (state.baseLayer) {
            state.map.removeLayer(state.baseLayer);
        }

        const themeKey = state.theme === 'light' ? 'light' : 'dark';

        state.baseLayer = L.tileLayer(TILE_LAYERS[themeKey], {
            attribution: TILE_ATTRIBUTION,
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(state.map);
    }

    function getCandidates() {
        if (state.currentYear === '2004' && typeof CANDIDATES_2004 !== 'undefined') return CANDIDATES_2004;
        if (state.currentYear === '1998' && typeof CANDIDATES_1998 !== 'undefined') return CANDIDATES_1998;
        if (state.currentYear === '1996' && typeof CANDIDATES_1996 !== 'undefined') return CANDIDATES_1996;
        if (state.currentYear === '1994' && typeof CANDIDATES_1994 !== 'undefined') return CANDIDATES_1994;
        return CANDIDATES;
    }

    async function loadData() {
        if (dom.loading) dom.loading.classList.remove('hidden');
        try {
            const fileMap = { '2004': 'data/EL2004_web.geojson', '2000': 'data/EL2000_web.geojson', '1998': 'data/EL1998_web.geojson', '1996': 'data/EL1996_web.geojson', '1994': 'data/EL1994_web.geojson' };
            const fileName = fileMap[state.currentYear] || 'data/stations.geojson';
            const response = await fetch(fileName);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            state.geojson = await response.json();
            state.allBounds = buildBounds(getAllFeatures());
            searchIndex = null; // reset search index with fresh data

            populateMunicipios();
            populatePerfCandidates();
            populateVencidosCandidates();
            updateHeader();
            renderMarkers({ refit: true });
            syncDetailPanel();
            hideLoading();
        } catch (error) {
            console.error('Erro ao carregar o GeoJSON:', error);
            if (dom.loadingText) {
                dom.loadingText.textContent =
                    window.location.protocol === 'file:'
                        ? 'Nao foi possivel carregar os dados via file://. Rode um servidor local para abrir o projeto.'
                        : 'Erro ao carregar data/stations.geojson. Verifique o arquivo e tente novamente.';
            }
        }
    }

    function hideLoading() {
        if (!dom.loading) {
            return;
        }

        window.setTimeout(() => {
            dom.loading.classList.add('hidden');
        }, 250);
    }

    function populateMunicipios() {
        if (!dom.selectMunicipio || !state.geojson) {
            return;
        }

        const municipios = [...new Set(getAllFeatures().map((feature) => feature.properties.municipio))]
            .sort((a, b) => a.localeCompare(b, 'pt-BR'));

        dom.selectMunicipio.innerHTML = '';

        const allOption = document.createElement('option');
        allOption.value = '';
        allOption.textContent = `Todos os municipios (${municipios.length})`;
        dom.selectMunicipio.appendChild(allOption);

        municipios.forEach((municipio) => {
            const option = document.createElement('option');
            option.value = municipio;
            option.textContent = titleCase(municipio);
            dom.selectMunicipio.appendChild(option);
        });
    }

    function getResolvedColorValue(familyKey) {
        return state.colorOverrides[familyKey] || familyKey;
    }

    function getPreviewHexForValue(value) {
        if (typeof normalizeColorOverrideValue === 'function') {
            const normalized = normalizeColorOverrideValue(value);
            if (/^#[0-9a-f]{6}$/i.test(normalized)) {
                return normalized;
            }
        }

        if (typeof getPartyColor === 'function') {
            return getPartyColor(value, 60);
        }

        return '#3d3d3d';
    }

    function renderColorPresetGrid() {
        if (!dom.colorPresetGrid || typeof getAvailableColorOptions !== 'function') {
            return;
        }

        dom.colorPresetGrid.innerHTML = '';
        const fragment = document.createDocumentFragment();

        getAvailableColorOptions().forEach((option) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `color-preset-btn${state.draftColorValue === option.key ? ' active' : ''}`;
            button.title = option.label;
            button.setAttribute('aria-label', option.label);
            button.addEventListener('click', () => {
                state.draftColorValue = option.key;
                syncColorPickerUI();
            });

            const swatch = document.createElement('span');
            swatch.style.background = getPreviewHexForValue(option.key);
            button.appendChild(swatch);
            fragment.appendChild(button);
        });

        dom.colorPresetGrid.appendChild(fragment);
    }

    function positionColorPicker() {
        if (!dom.colorModalPanel) {
            return;
        }

        const panel = dom.colorModalPanel;
        const anchorRect = state.activeColorAnchor?.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        const margin = 12;

        let left = anchorRect
            ? anchorRect.left - 10
            : Math.round((window.innerWidth - panelRect.width) / 2);
        let top = anchorRect
            ? anchorRect.bottom + 8
            : Math.round((window.innerHeight - panelRect.height) / 2);

        if (left + panelRect.width > window.innerWidth - margin) {
            left = window.innerWidth - panelRect.width - margin;
        }

        if (left < margin) {
            left = margin;
        }

        if (top + panelRect.height > window.innerHeight - margin && anchorRect) {
            top = anchorRect.top - panelRect.height - 8;
        }

        if (top < margin) {
            top = margin;
        }

        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
        panel.style.visibility = 'visible';
    }

    function syncColorPickerUI() {
        if (!state.activeColorFamily || !dom.colorModal) {
            return;
        }

        const previewHex = getPreviewHexForValue(state.draftColorValue);

        if (dom.colorModalTitle) {
            dom.colorModalTitle.textContent = state.activeColorLabel;
        }

        if (dom.customColorInput) {
            dom.customColorInput.value = previewHex.toUpperCase();
        }

        renderColorPresetGrid();
        window.requestAnimationFrame(positionColorPicker);
    }

    function openColorPicker(familyKey, label, anchorElement) {
        state.activeColorFamily = familyKey;
        state.activeColorLabel = label || familyKey;
        state.activeColorAnchor = anchorElement || null;
        state.draftColorValue = getResolvedColorValue(familyKey);

        if (dom.colorModal) {
            dom.colorModal.hidden = false;
        }

        if (dom.colorModalPanel) {
            dom.colorModalPanel.style.visibility = 'hidden';
        }

        syncColorPickerUI();
    }

    function closeColorPicker() {
        state.activeColorFamily = null;
        state.activeColorLabel = '';
        state.activeColorAnchor = null;
        state.draftColorValue = '';

        if (dom.colorModal) {
            dom.colorModal.hidden = true;
        }
    }

    function applyColorDraft() {
        if (!state.activeColorFamily) {
            return;
        }

        const familyKey = state.activeColorFamily;
        const normalizedValue = typeof normalizeColorOverrideValue === 'function'
            ? normalizeColorOverrideValue(state.draftColorValue)
            : state.draftColorValue;

        if (state.draftColorValue && state.draftColorValue !== familyKey && !normalizedValue) {
            return;
        }

        if (!normalizedValue || normalizedValue === familyKey) {
            delete state.colorOverrides[familyKey];
        } else {
            state.colorOverrides[familyKey] = normalizedValue;
        }

        persistColorOverrides();
        applyColorOverridesFromState();
        renderMarkers();
        updateLegend();
        syncDetailPanel();
        closeColorPicker();
    }

    function getAllFeatures() {
        return state.geojson?.features || [];
    }

    function getVisibleFeatures() {
        const features = getAllFeatures();

        return features.filter((feature) => {
            if (state.vizMode === 'vencidos' && state.vencidosCandidateCode) {
                const votes = feature.properties[state.currentCargo] || {};
                let maxVotes = -1;
                let topCode = null;
                for (const code in votes) {
                    if (typeof INVALID_CODES !== 'undefined' && !INVALID_CODES.has(code)) {
                        const v = Number(votes[code]) || 0;
                        if (v > maxVotes) {
                            maxVotes = v;
                            topCode = code;
                        }
                    }
                }
                if (topCode !== state.vencidosCandidateCode) {
                    return false;
                }
            }

            if (state.currentLocalId) {
                return getFeatureId(feature) === state.currentLocalId;
            }

            if (state.currentBairro) {
                return feature.properties.municipio === state.currentMunicipio &&
                       feature.properties.distrito === state.currentBairro;
            }

            if (state.currentMunicipio) {
                return feature.properties.municipio === state.currentMunicipio;
            }

            return true;
        });
    }

    function renderMarkers(options = {}) {
        const { refit = false } = options;

        if (!state.map) {
            return;
        }

        if (state.markersLayer) {
            state.map.removeLayer(state.markersLayer);
            state.markersLayer = null;
        }

        state.selectedMarker = null;

        if (state.vizMode === 'desempenho') {
            computePerformanceStats();
        }

        const markers = [];
        const visibleFeatures = getVisibleFeatures();

        visibleFeatures.forEach((feature) => {
            const summary = summarizeFeature(feature);
            if (!summary.winner) {
                return;
            }

            if (state.vizMode === 'desempenho' && state.perfCandidateCode && (state.perfFilterPct > 0 || state.perfFilterMaxPct < 100)) {
                const entry = summary.entries.find((e) => e.code === state.perfCandidateCode);
                const candidateVotes = entry ? entry.votos : 0;
                const pct = summary.validTotal > 0 ? (candidateVotes / summary.validTotal) * 100 : 0;
                
                if (pct < state.perfFilterPct || pct > state.perfFilterMaxPct) {
                    return;
                }
            }

            if (state.vizMode === 'desempenho' && state.perfCandidateCode && (state.currentYear === '2004' || state.currentYear === '2000' || state.currentYear === '1996')) {
                const entry = summary.entries.find((e) => e.code === state.perfCandidateCode);
                if (!entry || entry.isInvalid) {
                    return;
                }
            }

            const [lon, lat] = feature.geometry.coordinates;
            const marker = L.circleMarker([lat, lon], {
                ...buildMarkerStyle(summary, false),
                bubblingMouseEvents: false
            });

            marker._featureId = getFeatureId(feature);
            marker._featureData = feature;
            marker._summary = summary;

            marker.bindTooltip(buildTooltipHtml(feature, summary), {
                direction: 'top',
                offset: [0, -8]
            });

            marker.on('click', () => {
                selectFeature(feature, marker, { resetExpansion: true });
            });

            markers.push(marker);
        });

        state.markersLayer = L.layerGroup(markers).addTo(state.map);
        restoreSelection();

        if (state.vizMode === 'desempenho') {
            updatePerformanceView();
        }

        if (refit) {
            fitVisibleBounds(visibleFeatures);
        }
    }

    function buildMarkerStyle(summary, isSelected) {
        const outlineColor = state.theme === 'light'
            ? 'rgba(23, 23, 23, 0.35)'
            : 'rgba(255, 255, 255, 0.35)';

        return {
            radius: getMarkerRadius(state.map ? state.map.getZoom() : DEFAULT_ZOOM),
            fillColor: getMarkerFillColor(summary),
            fillOpacity: getMarkerOpacity(summary.winnerPct),
            color: isSelected ? getCssVar('--accent') : outlineColor,
            opacity: isSelected ? 1 : 0.9,
            weight: isSelected ? 2.2 : 0.8
        };
    }

    function getMarkerOpacity(winnerPct) {
        if (state.vizMode === 'desempenho') {
            return 0.92;
        }

        if (state.colorMode === 'solid') {
            return 0.9;
        }

        return mapRange(winnerPct, 25, 85, 0.82, 0.98);
    }

    function getMarkerFillColor(summary) {
        if (state.vizMode === 'desempenho' && state.perfCandidateCode) {
            const entry = summary.entries.find((e) => e.code === state.perfCandidateCode);
            
            if (!entry || entry.isInvalid) {
                return state.theme === 'light' ? '#d4d4d4' : '#262626';
            }

            const candidateVotes = entry.votos;
            const pct = summary.validTotal > 0 ? (candidateVotes / summary.validTotal) * 100 : 0;
            const stats = state.perfStats;

            if (!stats || stats.max <= 0) {
                return state.theme === 'light' ? '#f0f0f0' : '#2a2a2a';
            }

            const range = stats.max - stats.min;
            const ratio = range > 0 ? Math.max(0, Math.min(1, (pct - stats.min) / range)) : 0.5;
            const candidateInfo = getCandidates()[state.currentCargo]?.candidates[state.perfCandidateCode];

            if (!candidateInfo) {
                return '#737373';
            }

            if (candidateInfo.escala && typeof mixHexColors === 'function') {
                const discreteLevels = [20, 30, 40, 50, 60, 70, 80, 90];
                const scaled = ratio * (discreteLevels.length - 1);
                const lowerIndex = Math.floor(scaled);
                const upperIndex = Math.ceil(scaled);
                const fraction = scaled - lowerIndex;
                
                const color1 = candidateInfo.escala[discreteLevels[lowerIndex]];
                const color2 = candidateInfo.escala[discreteLevels[upperIndex]];
                
                return mixHexColors(color1, color2, fraction);
            }

            const lightColor = state.theme === 'light' ? '#f5f0eb' : '#3d3530';
            return mixHexColors(lightColor, candidateInfo.cor, ratio);
        }

        if (!summary?.winner?.info) {
            return '#737373';
        }

        // Empate: primeiro e segundo colocados com a mesma quantidade de votos
        if (summary.marginVotes === 0 && summary.runnerUp) {
            return '#ffffff';
        }

        if (state.colorMode === 'solid') {
            return summary.winner.info.cor;
        }

        const scaleLevel = getScaleLevelForPct(summary.winnerPct);
        const family = summary.winner.info.familia || summary.winner.info.partido;

        if (typeof getPartyColor === 'function') {
            return getPartyColor(family, scaleLevel, state.colorOverrides);
        }

        return summary.winner.info.cor;
    }

    function getScaleLevelForPct(value) {
        if (!Number.isFinite(value) || value <= 0) {
            return 20;
        }

        if (value < 25) return 20;
        if (value < 32) return 30;
        if (value < 39) return 40;
        if (value < 47) return 50;
        if (value < 55) return 60;
        if (value < 63) return 70;
        if (value < 72) return 80;
        return 90;
    }

    function getMarkerRadius(zoom) {
        if (zoom >= 15) return 9;
        if (zoom >= 13) return 7;
        if (zoom >= 11) return 5;
        if (zoom >= 9) return 4;
        return 3;
    }

    function fitVisibleBounds(features) {
        if (!state.map) {
            return;
        }

        const bounds = buildBounds(features);

        if (!bounds) {
            if (state.allBounds) {
                state.map.fitBounds(state.allBounds, { padding: [28, 28] });
            } else {
                state.map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
            }
            return;
        }

        if (features.length === 1) {
            const [lon, lat] = features[0].geometry.coordinates;
            state.map.setView([lat, lon], 14);
            return;
        }

        state.map.fitBounds(bounds, {
            padding: [36, 36],
            maxZoom: state.currentMunicipio ? 14 : 11
        });
    }

    function buildBounds(features) {
        if (!features.length) {
            return null;
        }

        return L.latLngBounds(
            features.map((feature) => [feature.geometry.coordinates[1], feature.geometry.coordinates[0]])
        );
    }

    function summarizeFeature(feature) {
        const cargoData = getCandidates()[state.currentCargo] || { candidates: {} };
        const votes = feature.properties[state.currentCargo] || {};

        const entries = Object.entries(votes)
            .map(([code, total]) => {
                let info = cargoData.candidates[code] || {
                    nome: `Candidato ${code}`,
                    partido: '',
                    cor: '#737373'
                };

                let isInvalid = INVALID_CODES.has(code);

                const MUNICIPIOS_ANO = state.currentYear === '2004' ? (typeof MUNICIPIOS_2004 !== 'undefined' ? MUNICIPIOS_2004 : null)
                                     : state.currentYear === '1996' ? (typeof MUNICIPIOS_1996 !== 'undefined' ? MUNICIPIOS_1996 : null)
                                     : state.currentYear === '2000' ? (typeof MUNICIPIOS_2000 !== 'undefined' ? MUNICIPIOS_2000 : null)
                                     : null;
                if (MUNICIPIOS_ANO) {
                    const mun = feature.properties.municipio;
                    if (mun && MUNICIPIOS_ANO[mun]) {
                        if (MUNICIPIOS_ANO[mun][code]) {
                            info = {
                                ...info,
                                nome: MUNICIPIOS_ANO[mun][code].nome,
                                partido: MUNICIPIOS_ANO[mun][code].partido
                            };
                        } else if (code !== '95' && code !== '96') {
                            isInvalid = true;
                        }
                    }
                }

                return {
                    code,
                    votos: Number(total) || 0,
                    info,
                    isInvalid
                };
            })
            .sort((left, right) => {
                if (right.votos !== left.votos) {
                    return right.votos - left.votos;
                }
                return left.info.nome.localeCompare(right.info.nome, 'pt-BR');
            });

        const validEntries = entries.filter((entry) => !entry.isInvalid);
        const invalidEntries = entries.filter((entry) => entry.isInvalid);
        const validTotal = validEntries.reduce((sum, entry) => sum + entry.votos, 0);
        const invalidTotal = invalidEntries.reduce((sum, entry) => sum + entry.votos, 0);
        const total = validTotal + invalidTotal;
        const winner = validEntries[0] || null;
        const runnerUp = validEntries[1] || null;
        const winnerPct = winner && validTotal > 0 ? (winner.votos / validTotal) * 100 : 0;
        const marginVotes = winner ? winner.votos - (runnerUp?.votos || 0) : 0;
        const marginPct = validTotal > 0 ? (marginVotes / validTotal) * 100 : 0;

        return {
            entries,
            validEntries,
            invalidEntries,
            validTotal,
            invalidTotal,
            total,
            winner,
            runnerUp,
            winnerPct,
            marginVotes,
            marginPct
        };
    }

    function createEmptyState(message) {
        const empty = document.createElement('div');
        empty.className = 'metric-item';
        empty.style.textAlign = 'center';
        empty.style.color = 'var(--muted)';
        empty.style.padding = '14px';
        empty.textContent = message;
        return empty;
    }

    function populatePerfCandidates() {
        if (!dom.selectPerfCandidate) {
            return;
        }

        const cargoData = getCandidates()[state.currentCargo];

        if (!cargoData) {
            return;
        }

        const previousCode = state.perfCandidateCode;
        dom.selectPerfCandidate.innerHTML = '';

        let entries = Object.entries(cargoData.candidates).filter(([code]) => !INVALID_CODES.has(code));

        if (state.currentYear === '2004' || state.currentYear === '2000' || state.currentYear === '1996') {
            const MUNICIPIOS_ANO = state.currentYear === '2004' ? (typeof MUNICIPIOS_2004 !== 'undefined' ? MUNICIPIOS_2004 : null)
                                 : state.currentYear === '1996' ? (typeof MUNICIPIOS_1996 !== 'undefined' ? MUNICIPIOS_1996 : null)
                                 : (typeof MUNICIPIOS_2000 !== 'undefined' ? MUNICIPIOS_2000 : null);
            if (state.currentMunicipio && MUNICIPIOS_ANO && MUNICIPIOS_ANO[state.currentMunicipio]) {
                const localStr = MUNICIPIOS_ANO[state.currentMunicipio];
                entries = entries
                    .filter(([code]) => localStr[code])
                    .map(([code, info]) => [code, { ...info, nome: localStr[code].nome }]);
            } else {
                const allMuns = MUNICIPIOS_ANO ? Object.keys(MUNICIPIOS_ANO).filter((k) => k !== 'NM_UE') : [];
                entries = entries
                    .filter(([code]) => {
                        if (!allMuns.length) return false;
                        return allMuns.some((mun) => MUNICIPIOS_ANO[mun] && MUNICIPIOS_ANO[mun][code]);
                    })
                    .map(([code, info]) => [code, { ...info, nome: `Partido ${info.partido}` }]);
            }
        } else {
            entries = entries.filter(([code, info]) => !info.nome.toUpperCase().startsWith('CANDIDATO '));
        }

        entries.sort(([, a], [, b]) => a.nome.localeCompare(b.nome, 'pt-BR'));

        entries.forEach(([code, info]) => {
            const option = document.createElement('option');
            option.value = code;
            const showParty = info.partido && !info.nome.toUpperCase().includes(info.partido.toUpperCase());
            option.textContent = showParty
                ? `${info.nome.toUpperCase()} (${info.partido})`
                : info.nome.toUpperCase();
            dom.selectPerfCandidate.appendChild(option);
        });

        const validCodes = new Set(entries.map(([code]) => code));

        if (previousCode && validCodes.has(previousCode)) {
            state.perfCandidateCode = previousCode;
        } else if (entries.length > 0) {
            state.perfCandidateCode = entries[0][0];
        } else {
            state.perfCandidateCode = null;
        }

        if (state.perfCandidateCode) {
            dom.selectPerfCandidate.value = state.perfCandidateCode;
        }
    }

    function populateVencidosCandidates() {
        if (!dom.selectVencidosCandidate) {
            return;
        }

        const cargoData = getCandidates()[state.currentCargo];

        if (!cargoData) {
            return;
        }

        const previousCode = state.vencidosCandidateCode;
        dom.selectVencidosCandidate.innerHTML = '';

        let entries = Object.entries(cargoData.candidates).filter(([code]) => !INVALID_CODES.has(code));

        if (state.currentYear === '2004' || state.currentYear === '2000' || state.currentYear === '1996') {
            const MUNICIPIOS_ANO = state.currentYear === '2004' ? (typeof MUNICIPIOS_2004 !== 'undefined' ? MUNICIPIOS_2004 : null)
                                 : state.currentYear === '1996' ? (typeof MUNICIPIOS_1996 !== 'undefined' ? MUNICIPIOS_1996 : null)
                                 : (typeof MUNICIPIOS_2000 !== 'undefined' ? MUNICIPIOS_2000 : null);
            if (state.currentMunicipio && MUNICIPIOS_ANO && MUNICIPIOS_ANO[state.currentMunicipio]) {
                const localStr = MUNICIPIOS_ANO[state.currentMunicipio];
                entries = entries
                    .filter(([code]) => localStr[code])
                    .map(([code, info]) => [code, { ...info, nome: localStr[code].nome }]);
            } else {
                entries = entries
                    .filter(([code]) => {
                        if (!MUNICIPIOS_ANO) return false;
                        for (const mun in MUNICIPIOS_ANO) {
                            if (MUNICIPIOS_ANO[mun] && MUNICIPIOS_ANO[mun][code]) return true;
                        }
                        return false;
                    })
                    .map(([code, info]) => [code, { ...info, nome: `Partido ${info.partido}` }]);
            }
        } else {
            entries = entries.filter(([code, info]) => !info.nome.toUpperCase().startsWith('CANDIDATO '));
        }

        const activeWinners = new Set();
        if (state.geojson) {
            state.geojson.features.forEach((feature) => {
                if (state.currentLocalId && getFeatureId(feature) !== state.currentLocalId) return;
                if (state.currentBairro && (feature.properties.municipio !== state.currentMunicipio || feature.properties.distrito !== state.currentBairro)) return;
                if (state.currentMunicipio && feature.properties.municipio !== state.currentMunicipio) return;

                let votes = feature.properties[state.currentCargo];
                if (!votes) {
                    const baseCargo = state.currentCargo.replace('_1t', '').replace('_2t', '');
                    votes = feature.properties[baseCargo] || feature.properties[`votos_${baseCargo}`] || {};
                }
                
                if (typeof votes === 'string') {
                    try { 
                        votes = JSON.parse(votes.replace(/'/g, '"')); 
                    } catch(e) { 
                        votes = {}; 
                    }
                }
                if (typeof votes !== 'object' || votes === null) votes = {};
                let maxVotes = -1;
                let topCode = null;
                for (const code in votes) {
                    if (typeof INVALID_CODES !== 'undefined' && !INVALID_CODES.has(code)) {
                        const v = Number(votes[code]) || 0;
                        if (v > maxVotes) {
                            maxVotes = v;
                            topCode = code;
                        }
                    }
                }
                if (topCode && maxVotes > 0) {
                    activeWinners.add(topCode);
                }
            });
        }

        entries = entries.filter(([code]) => activeWinners.has(code));

        entries.sort(([, a], [, b]) => a.nome.localeCompare(b.nome, 'pt-BR'));

        entries.forEach(([code, info]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${info.nome.toUpperCase()} (${info.partido || 'Sem partido'})`;
            dom.selectVencidosCandidate.appendChild(option);
        });

        const validCodes = new Set(entries.map(([code]) => code));

        if (previousCode && validCodes.has(previousCode)) {
            state.vencidosCandidateCode = previousCode;
        } else if (entries.length > 0) {
            state.vencidosCandidateCode = entries[0][0];
        } else {
            state.vencidosCandidateCode = null;
        }

        if (state.vencidosCandidateCode) {
            dom.selectVencidosCandidate.value = state.vencidosCandidateCode;
        }
    }

    function computePerformanceStats() {
        if (state.vizMode !== 'desempenho' || !state.perfCandidateCode) {
            state.perfStats = null;
            return;
        }

        const visibleFeatures = getVisibleFeatures();
        let min = Infinity;
        let max = -Infinity;
        let sum = 0;
        let count = 0;

        visibleFeatures.forEach((feature) => {
            const summary = summarizeFeature(feature);
            const entry = summary.entries.find((e) => e.code === state.perfCandidateCode);

            if (!entry || entry.isInvalid) {
                return;
            }

            const candidateVotes = entry ? entry.votos : 0;

            if (summary.validTotal > 0) {
                const pct = (candidateVotes / summary.validTotal) * 100;

                if (pct < min) {
                    min = pct;
                }

                if (pct > max) {
                    max = pct;
                }

                if (pct >= state.perfFilterPct && pct <= state.perfFilterMaxPct) {
                    sum += pct;
                    count++;
                }
            }
        });

        if (min === Infinity) {
            state.perfStats = null;
            return;
        }

        state.perfStats = { min, max, avg: count > 0 ? sum / count : 0, count };
    }

    function updatePerformanceView() {
        const stats = state.perfStats;
        const candidateInfo = getCandidates()[state.currentCargo]?.candidates[state.perfCandidateCode];

        if (!stats || !candidateInfo) {
            if (dom.gradientBar) {
                dom.gradientBar.style.background = 'var(--border)';
            }

            if (dom.perfSummary) {
                dom.perfSummary.textContent = 'Sem dados disponÃ­veis';
            }

            if (dom.perfFilterSlider) {
                dom.perfFilterSlider.max = 0;
            }

            if (dom.perfFilterSliderMax) {
                dom.perfFilterSliderMax.max = 0;
            }

            if (dom.perfFilterLabel) {
                dom.perfFilterLabel.style.opacity = '0';
            }

            return;
        }

        if (dom.gradientBar) {
            if (candidateInfo.escala) {
                const colors = [20, 30, 40, 50, 60, 70, 80, 90].map((level) => candidateInfo.escala[level]);
                dom.gradientBar.style.background = `linear-gradient(to right, ${colors.join(', ')})`;
            } else {
                const lightColor = state.theme === 'light' ? '#f5f0eb' : '#3d3530';
                dom.gradientBar.style.background = `linear-gradient(to right, ${lightColor}, ${candidateInfo.cor})`;
            }
        }

        if (dom.gradientMin) {
            dom.gradientMin.textContent = `\u25BC ${formatPercent(stats.min)}`;
            dom.gradientMin.style.color = candidateInfo.escala ? candidateInfo.escala[20] : candidateInfo.cor;
        }

        if (dom.gradientMax) {
            dom.gradientMax.textContent = `${formatPercent(stats.max)} \u25B2`;
            dom.gradientMax.style.color = candidateInfo.escala ? candidateInfo.escala[90] : candidateInfo.cor;
        }

        if (dom.perfSummary) {
            dom.perfSummary.textContent = `MÃ©dia: ${formatPercent(stats.avg)} \u00B7 ${formatNumber(stats.count)} locais`;
        }

        if (dom.perfFilterSlider && dom.perfFilterSliderMax) {
            if (stats.max > 0) {
                const maxVal = stats.max.toFixed(2);
                dom.perfFilterSlider.max = maxVal;
                dom.perfFilterSliderMax.max = maxVal;
                // Se o max ainda estÃ¡ em 100 (padrÃ£o) e o max real Ã© menor, ajusta
                if (parseFloat(dom.perfFilterSliderMax.value) > parseFloat(maxVal)) {
                    dom.perfFilterSliderMax.value = maxVal;
                    state.perfFilterMaxPct = parseFloat(maxVal);
                }
            }
            updateRangeSelection();
        }

        if (dom.perfFilterLabel) {
            const isFiltered = state.perfFilterPct > 0 || state.perfFilterMaxPct < parseFloat(dom.perfFilterSliderMax?.max || 100);
            if (isFiltered) {
                dom.perfFilterLabel.textContent = `${formatPercent(state.perfFilterPct)} â€“ ${formatPercent(state.perfFilterMaxPct)}`;
                dom.perfFilterLabel.style.opacity = '1';
                dom.perfFilterLabel.style.color = candidateInfo.cor;
            } else {
                dom.perfFilterLabel.style.opacity = '0';
            }
        }
    }

    function updateRangeSelection() {
        if (!dom.perfFilterSlider || !dom.perfFilterSliderMax || !dom.rangeSelection) return;
        const min = parseFloat(dom.perfFilterSlider.min) || 0;
        const max = parseFloat(dom.perfFilterSlider.max) || 100;
        const valMin = parseFloat(dom.perfFilterSlider.value) || 0;
        const valMax = parseFloat(dom.perfFilterSliderMax.value) || max;
        const leftPct = ((valMin - min) / (max - min)) * 100;
        const rightPct = ((valMax - min) / (max - min)) * 100;
        dom.rangeSelection.style.left = leftPct + '%';
        dom.rangeSelection.style.width = (rightPct - leftPct) + '%';
    }

    function switchVizMode(mode) {
        state.vizMode = mode;

        if (dom.chipVencedor) dom.chipVencedor.classList.toggle('active', mode === 'vencedor');
        if (dom.chipVencidos) dom.chipVencidos.classList.toggle('active', mode === 'vencidos');
        if (dom.chipDesempenho) dom.chipDesempenho.classList.toggle('active', mode === 'desempenho');

        if (dom.vencedorOptions) dom.vencedorOptions.style.display = (mode === 'vencedor' || mode === 'vencidos') ? 'block' : 'none';
        if (dom.vencidosOptions) dom.vencidosOptions.style.display = mode === 'vencidos' ? 'block' : 'none';
        if (dom.desempenhoOptions) dom.desempenhoOptions.style.display = mode === 'desempenho' ? 'block' : 'none';

        if (mode === 'vencidos' && !state.vencidosCandidateCode && dom.selectVencidosCandidate?.options.length) {
            state.vencidosCandidateCode = dom.selectVencidosCandidate.value;
        }

        renderMarkers();
    }

    function syncDetailPanel() {
        updateHeader();

        if (!state.selectedFeature) {
            showPlaceholder();
            return;
        }

        renderDetail(state.selectedFeature);
    }

    function selectFeature(feature, marker, options = {}) {
        const { resetExpansion = true } = options;

        closeColorPicker();
        state.selectedFeatureId = getFeatureId(feature);
        state.selectedFeature = feature;

        if (resetExpansion) {
            state.candidatesExpanded = false;
        }

        applySelectedMarker(marker);
        renderDetail(feature);
        setPanelCollapsed(dom.panelRight, false);
    }

    function clearSelection() {
        // Don't clear right after a box-select aggregation
        if (state.suppressNextMapClick) {
            state.suppressNextMapClick = false;
            return;
        }

        closeColorPicker();

        if (state.selectedMarker) {
            state.selectedMarker.setStyle(buildMarkerStyle(state.selectedMarker._summary, false));
        }

        state.selectedFeatureId = null;
        state.selectedFeature = null;
        state.selectedMarker = null;
        state.candidatesExpanded = false;

        showPlaceholder();
    }

    function restoreSelection() {
        if (state.selectedFeatureId == null || !state.markersLayer) {
            return;
        }

        let matchedMarker = null;
        let matchedFeature = null;

        state.markersLayer.eachLayer((marker) => {
            if (marker._featureId === state.selectedFeatureId) {
                matchedMarker = marker;
                matchedFeature = marker._featureData;
            }
        });

        if (!matchedMarker || !matchedFeature) {
            clearSelection();
            return;
        }

        state.selectedFeature = matchedFeature;
        applySelectedMarker(matchedMarker);
        renderDetail(matchedFeature);
    }

    function applySelectedMarker(marker) {
        if (state.selectedMarker && state.selectedMarker !== marker) {
            state.selectedMarker.setStyle(buildMarkerStyle(state.selectedMarker._summary, false));
        }

        state.selectedMarker = marker;

        if (marker) {
            marker.setStyle(buildMarkerStyle(marker._summary, true));
        }
    }

    function getCandidateDisplayName(info, municipioName) {
        if (!info) return 'Candidato';
        if (info.nome && !info.nome.startsWith('Candidato ')) return info.nome;
        if (state.currentCargo.startsWith('prefeito') && municipioName && municipioName.toUpperCase() !== 'SAO PAULO') {
            return info.partido ? `Partido ${info.partido}` : 'Candidato';
        }
        return info.nome || 'Candidato';
    }

    function renderDetail(feature) {
        const summary = summarizeFeature(feature);
        const props = feature.properties;
        const cargoLabel = getCandidates()[state.currentCargo]?.label || 'Cargo';

        updateHeader();

        if (dom.placeholder) {
            dom.placeholder.style.display = 'none';
        }

        if (dom.localInfo) {
            dom.localInfo.style.display = 'block';
        }

        if (dom.localName) {
            dom.localName.textContent = titleCase(props.nome);
        }

        if (dom.localMeta) {
            dom.localMeta.innerHTML = [
                `Município: ${escapeHtml(titleCase(props.municipio))}`,
                `Distrito: ${escapeHtml(titleCase(props.distrito || props.municipio))}`,
                `Zona ${escapeHtml(String(props.zona))} - ${escapeHtml(titleCase(props.zona_nome || props.municipio))}`,
                `${escapeHtml(props.tipo || 'Local')} - ${escapeHtml(titleCase(props.endereco || 'Endereco nao informado'))}`
            ].map((item) => `<span>${item}</span>`).join('');
        }

        renderMetrics(summary, props);
        renderCandidateCards(summary, cargoLabel, feature);
    }

    function showPlaceholder() {
        updateHeader();

        if (dom.placeholder) {
            dom.placeholder.style.display = 'flex';
        }

        if (dom.localInfo) {
            dom.localInfo.style.display = 'none';
        }
    }

    function renderMetrics(summary, props) {
        if (!dom.metricsGrid) {
            return;
        }

        const blankVotes = summary.invalidEntries.find((entry) => entry.code === '95')?.votos || 0;
        const nullVotes = summary.invalidEntries.find((entry) => entry.code === '96')?.votos || 0;
        const blankPct = summary.total > 0 ? (blankVotes / summary.total) * 100 : 0;
        const nullPct = summary.total > 0 ? (nullVotes / summary.total) * 100 : 0;

        const metrics = [
            { label: 'Comparecimento', value: formatNumber(summary.total) },
            { label: 'Votos válidos', value: formatNumber(summary.validTotal) },
            { label: `Brancos (${formatPercent(blankPct)})`, value: `${formatNumber(blankVotes)} votos` },
            { label: `Nulos (${formatPercent(nullPct)})`, value: `${formatNumber(nullVotes)} votos` },
            {
                label: 'Margem',
                value: summary.winner
                    ? `${formatNumber(summary.marginVotes)} votos`
                    : 'Sem disputa'
            },
            {
                label: 'Vantagem',
                value: summary.winner ? `${formatPercent(summary.marginPct)} p.p.` : '0,0 p.p.'
            }
        ];

        dom.metricsGrid.innerHTML = '';

        metrics.forEach((metric) => {
            const item = document.createElement('div');
            item.className = 'metric-item fade-in';

            const label = document.createElement('span');
            label.textContent = metric.label;

            const value = document.createElement('strong');
            value.textContent = metric.value;
            value.title = metric.value;

            item.append(label, value);
            dom.metricsGrid.appendChild(item);
        });
    }

    function renderCandidateCards(summary, cargoLabel, feature) {
        if (!dom.candidatesGrid || !dom.btnVerMais || !dom.candidatesTitle) {
            return;
        }

        const entries = summary.validEntries.filter((entry) => entry.votos > 0);
        const hiddenCount = Math.max(entries.length - 4, 0);

        dom.candidatesTitle.textContent = cargoLabel;
        dom.candidatesGrid.innerHTML = '';

        if (!entries.length) {
            dom.candidatesGrid.appendChild(createEmptyState('Nenhum voto registrado neste local.'));
            dom.btnVerMais.style.display = 'none';
            return;
        }

        const fragment = document.createDocumentFragment();

        entries.forEach((entry, index) => {
            const percentage = summary.validTotal > 0 ? (entry.votos / summary.validTotal) * 100 : 0;
            const hidden = !state.candidatesExpanded && index >= 4;
            const card = document.createElement('article');
            const familyKey = entry.info.familia || entry.info.partido;

            card.className = `cand fade-in${hidden ? ' cand-hidden' : ''}`;
            card.style.cursor = 'default';
            card.style.borderColor = index === 0 ? `${entry.info.cor}66` : '';

            const badge = entry.info.partido || 'Sem partido';

            card.innerHTML = `
                <div class="cand-header">
                    <button type="button" class="color-trigger" aria-label="Personalizar cor de ${escapeHtml(getCandidateDisplayName(entry.info, feature.properties.municipio))}">
                        <span class="swatch" style="background:${escapeHtml(entry.info.cor)}"></span>
                    </button>
                    <div class="cand-info">
                        <h4>${escapeHtml(getCandidateDisplayName(entry.info, feature.properties.municipio))}</h4>
                        <small>${escapeHtml(badge)}</small>
                    </div>
                </div>
                <div class="cand-stats">
                    <div class="bigPct">${formatPercent(percentage)}</div>
                    <div class="smallVotos">${formatNumber(entry.votos)}<br>votos</div>
                </div>
            `;

            const colorTrigger = card.querySelector('.color-trigger');
            if (colorTrigger) {
                colorTrigger.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    openColorPicker(familyKey, getCandidateDisplayName(entry.info, feature.properties.municipio), colorTrigger);
                });
            }

            fragment.appendChild(card);
        });

        dom.candidatesGrid.appendChild(fragment);

        if (hiddenCount > 0) {
            dom.btnVerMais.style.display = 'block';
            dom.btnVerMais.textContent = state.candidatesExpanded
                ? 'Ver menos'
                : `Ver mais ${hiddenCount}`;
        } else {
            dom.btnVerMais.style.display = 'none';
        }
    }

    function updateHeader() {
        if (!dom.rightTitle) {
            return;
        }

        const cargoLabel = getCandidates()[state.currentCargo]?.label || 'Resultados';
        const municipioLabel = state.currentMunicipio
            ? ` - ${titleCase(state.currentMunicipio)}`
            : '';

        dom.rightTitle.textContent = `${cargoLabel}${municipioLabel}`;
    }

    function buildTooltipHtml(feature, summary) {
        if (state.vizMode === 'desempenho' && state.perfCandidateCode) {
            const entry = summary.entries.find((e) => e.code === state.perfCandidateCode);
            const candidateInfo = entry ? entry.info : getCandidates()[state.currentCargo]?.candidates[state.perfCandidateCode];
            const candidateVotes = entry ? entry.votos : 0;
            const pct = summary.validTotal > 0 ? (candidateVotes / summary.validTotal) * 100 : 0;
            const fillColor = getMarkerFillColor(summary);

            return `
                <strong>${escapeHtml(titleCase(feature.properties.nome))}</strong><br>
                <span>${escapeHtml(titleCase(feature.properties.municipio))}</span><br>
                <span style="color:${escapeHtml(fillColor)}">${escapeHtml(getCandidateDisplayName(candidateInfo, feature.properties.municipio))}: ${formatPercent(pct)}</span><br>
                <span>${formatNumber(candidateVotes)} votos</span>
            `;
        }

        const winner = summary.winner;
        const winnerColor = getMarkerFillColor(summary);
        
        const displayName = winner ? getCandidateDisplayName(winner.info, feature.properties.municipio) : null;
        const subtitle = winner
            ? `${escapeHtml(displayName)} (${escapeHtml(winner.info.partido || 'Sem partido')})`
            : 'Sem vencedor';

        const pct = winner ? formatPercent(summary.winnerPct) : '0,0%';

        return `
            <strong>${escapeHtml(titleCase(feature.properties.nome))}</strong><br>
            <span>${escapeHtml(titleCase(feature.properties.municipio))}</span><br>
            <span style="color:${escapeHtml(winner ? winnerColor : '#737373')}">${subtitle}</span><br>
            <span>${pct} dos votos validos</span>
        `;
    }

    // ===== BUSCA =====

    function normalizeSearch(text) {
        return String(text || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .trim();
    }

    function buildSearchIndex() {
        return getAllFeatures().map((feature) => {
            const p = feature.properties;
            return {
                feature,
                nome: normalizeSearch(p.nome),
                distrito: normalizeSearch(p.distrito),
                municipio: normalizeSearch(p.municipio),
                endereco: normalizeSearch(p.endereco),
                nomeRaw: p.nome || '',
                distritoRaw: p.distrito || '',
                municipioRaw: p.municipio || '',
                enderecoRaw: p.endereco || ''
            };
        });
    }

    let searchIndex = null;

    function getSearchIndex() {
        if (!searchIndex) {
            searchIndex = buildSearchIndex();
        }
        return searchIndex;
    }

    function runLocalSearch(query) {
        const q = normalizeSearch(query);
        if (q.length < 2) return [];

        const index = getSearchIndex();
        const features = [];

        const munFilter = state.currentMunicipio || null;

        index.forEach((entry) => {
            if (munFilter && entry.municipio !== munFilter) return;

            const inNome     = entry.nome.includes(q);
            const inEndereco = entry.endereco.includes(q);

            if (inNome || inEndereco) {
                features.push({
                    tipo: 'local',
                    label: titleCase(entry.nomeRaw),
                    sub: `${titleCase(entry.distritoRaw)} Â· ${titleCase(entry.municipioRaw)}`,
                    endereco: `${titleCase(entry.enderecoRaw)}, ${titleCase(entry.municipioRaw)}`,
                    feature: entry.feature
                });
            }
        });

        return features.slice(0, 12);
    }

    function runBairroSearch(query) {
        const q = normalizeSearch(query);
        if (q.length < 2) return [];

        const index = getSearchIndex();
        const distritos = new Map();

        const munFilter = state.currentMunicipio || null;

        index.forEach((entry) => {
            if (munFilter && entry.municipio !== munFilter) return;
            if (!entry.distrito.includes(q)) return;

            const key = `${entry.municipioRaw}||${entry.distritoRaw}`;
            if (!distritos.has(key)) {
                distritos.set(key, {
                    tipo: 'bairro',
                    label: titleCase(entry.distritoRaw),
                    sub: titleCase(entry.municipioRaw),
                    municipio: entry.municipioRaw,
                    distrito: entry.distritoRaw
                });
            }
        });

        return [...distritos.values()].slice(0, 12);
    }

    function renderSearchDropdown(items, dd) {
        if (!dd) return;

        dd.innerHTML = '';

        if (!items.length) {
            const empty = document.createElement('div');
            empty.style.cssText = 'padding:12px 14px; color:var(--muted); font-size:13px;';
            empty.textContent = 'Nenhum resultado encontrado.';
            dd.appendChild(empty);
            dd.style.display = 'block';
            return;
        }

        items.forEach((item) => {
            const row = document.createElement('button');
            row.type = 'button';
            row.style.cssText = `
                display:flex; align-items:center; gap:10px;
                width:100%; padding:9px 14px; background:none;
                border:none; cursor:pointer; text-align:left;
                color:var(--text);
            `;

            row.addEventListener('mouseenter', () => { row.style.background = 'var(--surface-2)'; });
            row.addEventListener('mouseleave', () => { row.style.background = 'none'; });

            const texts = document.createElement('div');
            texts.style.cssText = 'flex:1; min-width:0;';

            const main = document.createElement('div');
            main.style.cssText = 'font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;';
            main.textContent = item.label;

            const secondary = document.createElement('div');
            secondary.style.cssText = 'font-size:11px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;';
            secondary.textContent = item.tipo === 'local' && item.endereco
                ? item.endereco
                : item.sub;

            texts.append(main, secondary);
            row.appendChild(texts);

            row.addEventListener('click', () => {
                handleSearchSelect(item);
            });

            dd.appendChild(row);
        });

        dd.style.display = 'block';
    }

    function handleSearchSelect(item) {
        closeAllDropdowns();

        if (item.tipo === 'local') {
            const feature = item.feature;
            const [lon, lat] = feature.geometry.coordinates;

            state.currentLocalId = getFeatureId(feature);
            state.currentBairro = null;
            applyMunicipioChange(feature.properties.municipio);

            state.map.setView([lat, lon], 16);
            renderMarkers({ refit: false });

            if (state.markersLayer) {
                state.markersLayer.eachLayer((layer) => {
                    if (layer._featureData === feature) {
                        selectFeature(feature, layer, { resetExpansion: true });
                    }
                });
            }

            if (dom.searchInput) {
                dom.searchInput.value = item.label;
            }
            if (dom.searchClear) dom.searchClear.style.display = 'block';

            // Clear bairro field
            if (dom.bairroInput) dom.bairroInput.value = '';
            if (dom.bairroClear) dom.bairroClear.style.display = 'none';
            if (dom.btnSomarBairro) dom.btnSomarBairro.style.display = 'none';

        } else if (item.tipo === 'bairro') {
            state.currentLocalId = null;
            state.currentBairro = item.distrito;
            applyMunicipioChange(item.municipio);

            renderMarkers({ refit: true });
            syncDetailPanel();

            if (dom.bairroInput) {
                dom.bairroInput.value = `${item.label}, ${titleCase(item.municipio)}`;
            }
            if (dom.bairroClear) dom.bairroClear.style.display = 'block';
            if (dom.btnSomarBairro) dom.btnSomarBairro.style.display = 'inline-block';

            // Clear local field
            if (dom.searchInput) dom.searchInput.value = '';
            if (dom.searchClear) dom.searchClear.style.display = 'none';
        }
    }

    function closeAllDropdowns() {
        if (dom.searchDropdown) dom.searchDropdown.style.display = 'none';
        if (dom.bairroDropdown) dom.bairroDropdown.style.display = 'none';
    }

    function closeSearchDropdown() {
        if (dom.searchDropdown) {
            dom.searchDropdown.style.display = 'none';
        }
    }

    function setupSearchField(input, clear, dropdown, searchFn) {
        if (!input) return;

        let debounceTimer = null;

        input.addEventListener('input', () => {
            const val = input.value;
            if (clear) clear.style.display = val ? 'block' : 'none';

            clearTimeout(debounceTimer);
            if (val.trim().length < 2) {
                if (dropdown) dropdown.style.display = 'none';
                return;
            }

            debounceTimer = setTimeout(() => {
                const results = searchFn(val);
                renderSearchDropdown(results, dropdown);
            }, 180);
        });

        input.addEventListener('focus', () => {
            if (input.value.trim().length >= 2) {
                const results = searchFn(input.value);
                renderSearchDropdown(results, dropdown);
            }
        });

        if (clear) {
            clear.addEventListener('click', () => {
                input.value = '';
                clear.style.display = 'none';
                if (dropdown) dropdown.style.display = 'none';
                input.focus();

                state.currentBairro = null;
                state.currentLocalId = null;
                if (state.geojson) {
                    renderMarkers({ refit: true });
                }
            });
        }

        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !dropdown?.contains(e.target)) {
                if (dropdown) dropdown.style.display = 'none';
            }
        });

        input.addEventListener('keydown', (e) => {
            if (!dropdown || dropdown.style.display === 'none') return;

            const buttons = [...dropdown.querySelectorAll('button')];
            const focused = dropdown.querySelector('button:focus');
            const idx = focused ? buttons.indexOf(focused) : -1;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = buttons[idx + 1] || buttons[0];
                next?.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = buttons[idx - 1] || buttons[buttons.length - 1];
                prev?.focus();
            } else if (e.key === 'Escape') {
                if (dropdown) dropdown.style.display = 'none';
                input.blur();
            }
        });
    }

    function setupSearch() {
        setupSearchField(dom.bairroInput, dom.bairroClear, dom.bairroDropdown, runBairroSearch);
        setupSearchField(dom.searchInput, dom.searchClear, dom.searchDropdown, runLocalSearch);

        // Hide SOMAR button when bairro is cleared
        const origBairroClearClick = dom.bairroClear;
        if (dom.bairroClear) {
            dom.bairroClear.addEventListener('click', () => {
                if (dom.btnSomarBairro) dom.btnSomarBairro.style.display = 'none';
            });
        }

        if (dom.btnSomarBairro) {
            dom.btnSomarBairro.addEventListener('click', renderBairroSummary);
        }
    }

    function renderBairroSummary() {
        if (!state.currentBairro || !state.currentMunicipio) return;

        const features = getAllFeatures().filter((f) =>
            f.properties.municipio === state.currentMunicipio &&
            f.properties.distrito === state.currentBairro
        );

        if (!features.length) return;

        const cargoData = getCandidates()[state.currentCargo] || { candidates: {} };
        const aggregated = {};

        features.forEach((feature) => {
            const votes = feature.properties[state.currentCargo] || {};
            for (const code in votes) {
                aggregated[code] = (aggregated[code] || 0) + (Number(votes[code]) || 0);
            }
        });

        const entries = Object.entries(aggregated)
            .map(([code, total]) => {
                let info = cargoData.candidates[code] || { nome: `Candidato ${code}`, partido: '', cor: '#737373' };
                let isInvalid = INVALID_CODES.has(code);

                const MUNICIPIOS_ANO2 = state.currentYear === '2004' ? (typeof MUNICIPIOS_2004 !== 'undefined' ? MUNICIPIOS_2004 : null)
                                      : state.currentYear === '1996' ? (typeof MUNICIPIOS_1996 !== 'undefined' ? MUNICIPIOS_1996 : null)
                                      : state.currentYear === '2000' ? (typeof MUNICIPIOS_2000 !== 'undefined' ? MUNICIPIOS_2000 : null)
                                      : null;
                if (MUNICIPIOS_ANO2) {
                    const mun = state.currentMunicipio;
                    if (mun && MUNICIPIOS_ANO2[mun]) {
                        if (MUNICIPIOS_ANO2[mun][code]) {
                            info = { ...info, nome: MUNICIPIOS_ANO2[mun][code].nome, partido: MUNICIPIOS_ANO2[mun][code].partido };
                        } else if (code !== '95' && code !== '96') {
                            isInvalid = true;
                        }
                    }
                }

                return { code, votos: total, info: { ...info, familia: info.familia || info.partido }, isInvalid };
            })
            .sort((a, b) => b.votos - a.votos);

        const validEntries = entries.filter((e) => !e.isInvalid);
        const invalidEntries = entries.filter((e) => e.isInvalid);
        const validTotal = validEntries.reduce((s, e) => s + e.votos, 0);
        const invalidTotal = invalidEntries.reduce((s, e) => s + e.votos, 0);
        const total = validTotal + invalidTotal;
        const winner = validEntries[0] || null;
        const runnerUp = validEntries[1] || null;
        const winnerPct = winner && validTotal > 0 ? (winner.votos / validTotal) * 100 : 0;
        const marginVotes = winner ? winner.votos - (runnerUp?.votos || 0) : 0;
        const marginPct = validTotal > 0 ? (marginVotes / validTotal) * 100 : 0;

        const summary = { entries, validEntries, invalidEntries, validTotal, invalidTotal, total, winner, runnerUp, winnerPct, marginVotes, marginPct };
        const props = { municipio: state.currentMunicipio, distrito: state.currentBairro };
        const cargoLabel = getCandidates()[state.currentCargo]?.label || 'Cargo';
        const bairroLabel = titleCase(state.currentBairro);
        const munLabel = titleCase(state.currentMunicipio);

        if (dom.placeholder) dom.placeholder.style.display = 'none';
        if (dom.localInfo) dom.localInfo.style.display = 'block';
        if (dom.localName) dom.localName.textContent = `${bairroLabel} â€” ${features.length} locais`;
        if (dom.localMeta) {
            dom.localMeta.innerHTML = [
                `Municipio: ${escapeHtml(munLabel)}`,
                `Distrito: ${escapeHtml(bairroLabel)}`,
                `Soma de ${features.length} locais de votaÃ§Ã£o`
            ].map((item) => `<span>${item}</span>`).join('');
        }

        renderMetrics(summary, props);
        renderCandidateCards(summary, cargoLabel, { properties: props });
    }

    // ===== FIM BUSCA =====

    function resolveTurnoState() {
        const CIDADES_2T_2004 = ['DIADEMA', 'OSASCO', 'SANTO ANDRE', 'SAO PAULO'];
        const CIDADES_2T_2000 = ['DIADEMA', 'GUARULHOS', 'MAUA', 'MOGI DAS CRUZES', 'SAO PAULO'];
        const CIDADES_2T_1996 = ['SAO PAULO'];
        const cargo = dom.selectCargo?.value;

        // 1998/1994: senador has no 2T; presidente was won in 1T (no 2T data)
        if (state.currentYear === '1998' || state.currentYear === '1994') {
            if (cargo === 'senador' || cargo === 'presidente') {
                if (dom.selectTurno) { dom.selectTurno.disabled = true; dom.selectTurno.value = '_1t'; }
                return '_1t';
            }
            if (dom.selectTurno) dom.selectTurno.disabled = false;
            return dom.selectTurno?.value || '_1t';
        }

        if (cargo === 'senador') {
            if (dom.selectTurno) dom.selectTurno.disabled = true;
            return '';
        }
        if (state.currentYear === '2004' && state.currentMunicipio && !CIDADES_2T_2004.includes(state.currentMunicipio)) {
            if (dom.selectTurno) {
                dom.selectTurno.disabled = true;
                if (dom.selectTurno.value === '_2t') dom.selectTurno.value = '_1t';
            }
            return '_1t';
        }
        if (state.currentYear === '1996' && state.currentMunicipio && !CIDADES_2T_1996.includes(state.currentMunicipio)) {
            if (dom.selectTurno) {
                dom.selectTurno.disabled = true;
                if (dom.selectTurno.value === '_2t') dom.selectTurno.value = '_1t';
            }
            return '_1t';
        }
        if (state.currentYear === '2000' && state.currentMunicipio && !CIDADES_2T_2000.includes(state.currentMunicipio)) {
            if (dom.selectTurno) {
                dom.selectTurno.disabled = true;
                if (dom.selectTurno.value === '_2t') dom.selectTurno.value = '_1t';
            }
            return '_1t';
        }
        if (dom.selectTurno) dom.selectTurno.disabled = false;
        return dom.selectTurno?.value || '_1t';
    }

    function applyMunicipioChange(newMunicipio) {
        state.currentMunicipio = newMunicipio;
        if (dom.selectMunicipio) dom.selectMunicipio.value = state.currentMunicipio;

        const cargo = dom.selectCargo?.value || 'presidente';
        const turno = resolveTurnoState();
        let combined;
        if (state.currentYear === '1998' && cargo === 'senador') {
            combined = 'senador_1t';
        } else if (state.currentYear === '1994' && cargo === 'senador') {
            combined = 'senador_1t';
        } else if (cargo === 'senador') {
            combined = 'senador';
        } else {
            combined = `${cargo}${turno}`;
        }
        
        if (state.currentCargo !== combined) {
            state.currentCargo = combined;
        }

        populatePerfCandidates();
        populateVencidosCandidates();
    }

    function setupEvents() {
        function updateCargoState() {
            const cargo = dom.selectCargo?.value || 'presidente';
            const turno = resolveTurnoState();

            let combined;
            if (state.currentYear === '1998' && cargo === 'senador') {
                combined = 'senador_1t';
            } else if (state.currentYear === '1994' && cargo === 'senador') {
                combined = 'senador_1t';
            } else if (cargo === 'senador') {
                combined = 'senador';
            } else {
                combined = `${cargo}${turno}`;
            }
            if (state.currentCargo !== combined) {
                state.currentCargo = combined;
                state.perfFilterPct = 0;
                state.perfFilterMaxPct = 100;
                if (dom.perfFilterSlider) dom.perfFilterSlider.value = 0;
                if (dom.perfFilterSliderMax) { dom.perfFilterSliderMax.value = dom.perfFilterSliderMax.max || 100; }
                updateRangeSelection();
                closeColorPicker();
                populatePerfCandidates();
                populateVencidosCandidates();
                renderMarkers();
                syncDetailPanel();
            }
        }

        if (dom.selectCargo) dom.selectCargo.addEventListener('change', updateCargoState);
        if (dom.selectTurno) dom.selectTurno.addEventListener('change', updateCargoState);

        const updateYearSelection = (year) => {
            if (state.currentYear === year) return;
            state.currentYear = year;
            dom.chipYear2002.classList.toggle('active', year === '2002');
            dom.chipYear2000.classList.toggle('active', year === '2000');
            if (dom.chipYear1998) dom.chipYear1998.classList.toggle('active', year === '1998');
            if (dom.chipYear1996) dom.chipYear1996.classList.toggle('active', year === '1996');
            if (dom.chipYear2004) dom.chipYear2004.classList.toggle('active', year === '2004');
            if (dom.chipYear1994) dom.chipYear1994.classList.toggle('active', year === '1994');

            if (year === '2004' || year === '2000' || year === '1996') {
                dom.selectCargo.innerHTML = '<option value="prefeito" selected>Prefeito</option>';
                dom.selectTurno.disabled = false;
            } else if (year === '1998' || year === '1994') {
                dom.selectCargo.innerHTML = `
                    <option value="presidente" selected>Presidente</option>
                    <option value="governador">Governador SP</option>
                    <option value="senador">Senador SP</option>
                `;
            } else {
                dom.selectCargo.innerHTML = `
                    <option value="presidente" selected>Presidente</option>
                    <option value="governador">Governador SP</option>
                    <option value="senador">Senador SP</option>
                `;
            }

            state.currentMunicipio = '';
            state.currentBairro = null;
            state.currentLocalId = null;
            state.selectedFeatureId = null;
            state.selectedFeature = null;
            state.selectedMarker = null;
            if (dom.searchInput) dom.searchInput.value = '';
            if (dom.searchClear) dom.searchClear.style.display = 'none';
            if (dom.bairroInput) dom.bairroInput.value = '';
            if (dom.bairroClear) dom.bairroClear.style.display = 'none';
            dom.selectTurno.value = '_1t';
            
            updateCargoState();
            loadData();
        };

        if (dom.chipYear2004) dom.chipYear2004.addEventListener('click', () => updateYearSelection('2004'));
        if (dom.chipYear2002) dom.chipYear2002.addEventListener('click', () => updateYearSelection('2002'));
        if (dom.chipYear2000) dom.chipYear2000.addEventListener('click', () => updateYearSelection('2000'));
        if (dom.chipYear1998) dom.chipYear1998.addEventListener('click', () => updateYearSelection('1998'));
        if (dom.chipYear1996) dom.chipYear1996.addEventListener('click', () => updateYearSelection('1996'));
        if (dom.chipYear1994) dom.chipYear1994.addEventListener('click', () => updateYearSelection('1994'));

        if (dom.selectMunicipio) {
            dom.selectMunicipio.addEventListener('change', () => {
                state.currentBairro = null;
                state.currentLocalId = null;
                state.perfFilterPct = 0;
                state.perfFilterMaxPct = 100;
                if (dom.perfFilterSlider) dom.perfFilterSlider.value = 0;
                if (dom.perfFilterSliderMax) { dom.perfFilterSliderMax.value = dom.perfFilterSliderMax.max || 100; }
                updateRangeSelection();
                
                if (dom.searchInput) {
                    dom.searchInput.value = '';
                    if (dom.searchClear) dom.searchClear.style.display = 'none';
                }
                if (dom.bairroInput) {
                    dom.bairroInput.value = '';
                    if (dom.bairroClear) dom.bairroClear.style.display = 'none';
                }

                applyMunicipioChange(dom.selectMunicipio.value);
                renderMarkers({ refit: true });
                syncDetailPanel();
            });
        }

        if (dom.chipSolid) {
            dom.chipSolid.addEventListener('click', () => {
                if (state.colorMode === 'solid') {
                    return;
                }

                state.colorMode = 'solid';
                syncColorModeButtons();
                renderMarkers();
            });
        }

        if (dom.chipGradient) {
            dom.chipGradient.addEventListener('click', () => {
                if (state.colorMode === 'gradient') {
                    return;
                }

                state.colorMode = 'gradient';
                syncColorModeButtons();
                renderMarkers();
            });
        }

        if (dom.chipVencedor) {
            dom.chipVencedor.addEventListener('click', () => {
                switchVizMode('vencedor');
            });
        }

        if (dom.chipVencidos) {
            dom.chipVencidos.addEventListener('click', () => {
                switchVizMode('vencidos');
            });
        }

        if (dom.chipDesempenho) {
            dom.chipDesempenho.addEventListener('click', () => {
                switchVizMode('desempenho');
            });
        }

        if (dom.selectVencidosCandidate) {
            dom.selectVencidosCandidate.addEventListener('change', () => {
                state.vencidosCandidateCode = dom.selectVencidosCandidate.value;
                if (state.vizMode === 'vencidos') {
                    renderMarkers();
                }
            });
        }

        if (dom.selectPerfCandidate) {
            dom.selectPerfCandidate.addEventListener('change', () => {
                state.perfCandidateCode = dom.selectPerfCandidate.value;
                state.perfFilterPct = 0;
                state.perfFilterMaxPct = 100;
                if (dom.perfFilterSlider) dom.perfFilterSlider.value = 0;
                if (dom.perfFilterSliderMax) { dom.perfFilterSliderMax.value = dom.perfFilterSliderMax.max || 100; }
                updateRangeSelection();

                if (state.vizMode === 'desempenho') {
                    renderMarkers();
                }
            });
        }

        if (dom.perfFilterSlider) {
            dom.perfFilterSlider.addEventListener('input', () => {
                let minVal = parseFloat(dom.perfFilterSlider.value) || 0;
                let maxVal = parseFloat(dom.perfFilterSliderMax?.value) || 100;
                if (minVal > maxVal) {
                    minVal = maxVal;
                    dom.perfFilterSlider.value = minVal;
                }
                state.perfFilterPct = minVal;
                updateRangeSelection();
                renderMarkers();
            });
        }

        if (dom.perfFilterSliderMax) {
            dom.perfFilterSliderMax.addEventListener('input', () => {
                let maxVal = parseFloat(dom.perfFilterSliderMax.value) || 100;
                let minVal = parseFloat(dom.perfFilterSlider?.value) || 0;
                if (maxVal < minVal) {
                    maxVal = minVal;
                    dom.perfFilterSliderMax.value = maxVal;
                }
                state.perfFilterMaxPct = maxVal;
                updateRangeSelection();
                renderMarkers();
            });
        }

        if (dom.themeToggle) {
            dom.themeToggle.addEventListener('click', () => {
                state.theme = state.theme === 'dark' ? 'light' : 'dark';
                applyTheme();
            });
        }

        if (dom.collapseLeft) {
            dom.collapseLeft.addEventListener('click', () => {
                setPanelCollapsed(dom.panelLeft, true);
            });
        }

        if (dom.collapseRight) {
            dom.collapseRight.addEventListener('click', () => {
                setPanelCollapsed(dom.panelRight, true);
            });
        }

        if (dom.expandLeft) {
            const expandLeftHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('expandLeft triggered');
                setPanelCollapsed(dom.panelLeft, false);
            };
            dom.expandLeft.addEventListener('click', expandLeftHandler);
            dom.expandLeft.addEventListener('touchstart', expandLeftHandler);
        } else {
            console.warn('expandLeft element not found');
        }

        if (dom.expandRight) {
            const expandRightHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('expandRight triggered');
                setPanelCollapsed(dom.panelRight, false);
            };
            dom.expandRight.addEventListener('click', expandRightHandler);
            dom.expandRight.addEventListener('touchstart', expandRightHandler);
        } else {
            console.warn('expandRight element not found');
        }

        if (dom.btnVerMais) {
            dom.btnVerMais.addEventListener('click', () => {
                if (!state.selectedFeature) {
                    return;
                }

                state.candidatesExpanded = !state.candidatesExpanded;
                renderDetail(state.selectedFeature);
            });
        }

        if (dom.closeColorModal) {
            dom.closeColorModal.addEventListener('click', closeColorPicker);
        }

        if (dom.colorModal) {
            dom.colorModal.addEventListener('click', (event) => {
                if (event.target === dom.colorModal) {
                    closeColorPicker();
                }
            });
        }

        if (dom.customColorInput) {
            dom.customColorInput.addEventListener('input', () => {
                const rawValue = dom.customColorInput.value.trim();
                const cleaned = rawValue.replace(/[^#0-9a-fA-F]/g, '');
                const withoutHashes = cleaned.replace(/^#+/, '');
                const withHash = withoutHashes ? `#${withoutHashes}` : '';
                dom.customColorInput.value = withHash.slice(0, 7).toUpperCase();

                if (/^#[0-9a-fA-F]{6}$/.test(dom.customColorInput.value)) {
                    state.draftColorValue = dom.customColorInput.value;
                    syncColorPickerUI();
                }
            });
        }

        if (dom.resetColorButton) {
            dom.resetColorButton.addEventListener('click', () => {
                if (!state.activeColorFamily) {
                    return;
                }

                state.draftColorValue = state.activeColorFamily;
                syncColorPickerUI();
            });
        }

        if (dom.applyColorButton) {
            dom.applyColorButton.addEventListener('click', applyColorDraft);
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (state.activeColorFamily) {
                    closeColorPicker();
                    return;
                }

                clearSelection();
            }
        });

        window.addEventListener('resize', () => {
            if (state.activeColorFamily) {
                window.requestAnimationFrame(positionColorPicker);
            }
        });
    }

    function setPanelCollapsed(panel, collapsed) {
        if (!panel) {
            return;
        }

        panel.classList.toggle('collapsed', collapsed);

        // Explicitly manage expand button visibility
        if (panel === dom.panelLeft) {
            if (collapsed && dom.expandLeft) {
                dom.expandLeft.classList.add('visible');
                dom.expandLeft.classList.remove('hidden');
            } else if (dom.expandLeft) {
                dom.expandLeft.classList.add('hidden');
                dom.expandLeft.classList.remove('visible');
            }
        } else if (panel === dom.panelRight) {
            if (collapsed && dom.expandRight) {
                dom.expandRight.classList.add('visible');
                dom.expandRight.classList.remove('hidden');
            } else if (dom.expandRight) {
                dom.expandRight.classList.add('hidden');
                dom.expandRight.classList.remove('visible');
            }
        }

        window.setTimeout(() => {
            state.map?.invalidateSize();
        }, 320);
    }

    function syncColorModeButtons() {
        if (dom.chipSolid) {
            dom.chipSolid.classList.toggle('active', state.colorMode === 'solid');
        }

        if (dom.chipGradient) {
            dom.chipGradient.classList.toggle('active', state.colorMode === 'gradient');
        }
    }

    function applyTheme() {
        document.documentElement.dataset.theme = state.theme;

        try {
            window.localStorage.setItem('secao-eleitoral-theme', state.theme);
        } catch (error) {
            // Ignore persistence errors.
        }

        if (dom.themeToggle) {
            dom.themeToggle.innerHTML = state.theme === 'dark' ? '&#9728;' : '&#9790;';
            dom.themeToggle.title = state.theme === 'dark'
                ? 'Alternar para tema claro'
                : 'Alternar para tema escuro';
        }

        updateBaseLayer();

        if (state.geojson) {
            renderMarkers();
            syncDetailPanel();
        }
    }

    function mapRange(value, inMin, inMax, outMin, outMax) {
        const clamped = Math.max(inMin, Math.min(inMax, value));
        return outMin + ((clamped - inMin) * (outMax - outMin)) / (inMax - inMin);
    }

    function getFeatureId(feature) {
        return feature?.properties?.id ?? `${feature.geometry.coordinates.join(',')}`;
    }

    function formatNumber(value) {
        return Number(value || 0).toLocaleString('pt-BR');
    }

    function formatPercent(value) {
        return `${Number(value || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}%`;
    }

    function titleCase(text) {
        if (!text) {
            return '';
        }

        const lowercaseWords = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);

        return String(text)
            .toLocaleLowerCase('pt-BR')
            .split(/\s+/)
            .map((word) => {
                if (!word) {
                    return word;
                }

                if (lowercaseWords.has(word)) {
                    return word;
                }

                return word
                    .split('-')
                    .map((chunk) => chunk.charAt(0).toLocaleUpperCase('pt-BR') + chunk.slice(1))
                    .join('-');
            })
            .join(' ');
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function getCssVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    function initMobileOptimizations() {
        // Auto-colapsar painel esquerdo em mobile
        setTimeout(() => {
            if (window.innerWidth <= 768) {
                if (dom.panelLeft) {
                    dom.panelLeft.classList.add('collapsed');
                    // Mostrar o botão de expansão
                    if (dom.expandLeft) {
                        dom.expandLeft.classList.add('visible');
                        dom.expandLeft.classList.remove('hidden');
                        console.log('expandLeft button made visible');
                    }
                }
                if (dom.panelRight) {
                    // Keep right panel expanded on mobile
                    dom.panelRight.classList.remove('collapsed');
                    if (dom.expandRight) {
                        dom.expandRight.classList.add('hidden');
                        dom.expandRight.classList.remove('visible');
                    }
                }
            }
        }, 100);
    }

    function init() {
        if (dom.selectCargo && dom.selectTurno) {
            const cargo = dom.selectCargo.value;
            const turno = dom.selectTurno.value;
            if (cargo === 'senador') {
                dom.selectTurno.disabled = true;
                state.currentCargo = cargo;
            } else {
                state.currentCargo = `${cargo}${turno}`;
            }
        } else if (dom.selectCargo?.value) {
            state.currentCargo = dom.selectCargo.value;
        }

        if (dom.selectMunicipio?.value) {
            state.currentMunicipio = dom.selectMunicipio.value;
        }

        applyColorOverridesFromState();
        syncColorModeButtons();
        applyTheme();
        initMap();
        setupEvents();
        setupSearch();
        populatePerfCandidates();
        populateVencidosCandidates();
        loadData();
        initMobileOptimizations();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

