/**
 * Visualizador Eleitoral 2002 - RMSP
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
        colorMode: 'solid',
        colorOverrides: getInitialColorOverrides(),
        activeColorFamily: null,
        activeColorLabel: '',
        activeColorAnchor: null,
        draftColorValue: '',
        selectedFeatureId: null,
        selectedFeature: null,
        selectedMarker: null,
        candidatesExpanded: false,
        theme: getInitialTheme()
    };

    const dom = {
        loading: document.getElementById('loading'),
        searchInput: document.getElementById('searchInput'),
        searchClear: document.getElementById('searchClear'),
        searchDropdown: document.getElementById('searchDropdown'),
        loadingText: document.querySelector('.loading-text'),
        panelLeft: document.getElementById('panelLeft'),
        panelRight: document.getElementById('panelRight'),
        expandLeft: document.getElementById('expandLeft'),
        expandRight: document.getElementById('expandRight'),
        collapseLeft: document.getElementById('collapseLeft'),
        collapseRight: document.getElementById('collapseRight'),
        themeToggle: document.getElementById('themeToggle'),
        selectCargo: document.getElementById('selectCargo'),
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
        btnVerMais: document.getElementById('btnVerMais')
    };

    function getInitialTheme() {
        try {
            const stored = window.localStorage.getItem('el2002-theme');
            if (stored === 'light' || stored === 'dark') {
                return stored;
            }
        } catch (error) {
            // Ignore localStorage errors and fall back to DOM theme.
        }

        return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    }

    function getInitialColorOverrides() {
        try {
            const stored = window.localStorage.getItem('el2002-color-overrides');
            const parsed = stored ? JSON.parse(stored) : {};
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function persistColorOverrides() {
        try {
            window.localStorage.setItem('el2002-color-overrides', JSON.stringify(state.colorOverrides));
        } catch (error) {
            // Ignore persistence errors.
        }
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

        state.map.zoomControl.setPosition('topright');
        updateBaseLayer();

        state.map.on('zoomend', handleMapZoomEnd);
        state.map.on('click', clearSelection);
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

    async function loadData() {
        try {
            const response = await fetch('data/stations.geojson');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            state.geojson = await response.json();
            state.allBounds = buildBounds(getAllFeatures());
            searchIndex = null; // reset search index with fresh data

            populateMunicipios();
            updateHeader();
            renderMarkers({ refit: true });
            updateLegend();
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
        if (!state.currentMunicipio) {
            return features;
        }

        return features.filter(
            (feature) => feature.properties.municipio === state.currentMunicipio
        );
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

        const markers = [];
        const visibleFeatures = getVisibleFeatures();

        visibleFeatures.forEach((feature) => {
            const summary = summarizeFeature(feature);
            if (!summary.winner) {
                return;
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
        if (state.colorMode === 'solid') {
            return 0.9;
        }

        return mapRange(winnerPct, 25, 85, 0.82, 0.98);
    }

    function getMarkerFillColor(summary) {
        if (!summary?.winner?.info) {
            return '#737373';
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
        const cargoData = CANDIDATES[state.currentCargo] || { candidates: {} };
        const votes = feature.properties[state.currentCargo] || {};

        const entries = Object.entries(votes)
            .map(([code, total]) => {
                const info = cargoData.candidates[code] || {
                    nome: `Candidato ${code}`,
                    partido: '',
                    cor: '#737373'
                };

                return {
                    code,
                    votos: Number(total) || 0,
                    info,
                    isInvalid: INVALID_CODES.has(code)
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

    function updateLegend() {
        if (!dom.legendItems) {
            return;
        }

        const cargoData = CANDIDATES[state.currentCargo] || { candidates: {} };
        const visibleFeatures = getVisibleFeatures();
        const winCounts = {};

        visibleFeatures.forEach((feature) => {
            const winner = summarizeFeature(feature).winner;
            if (winner) {
                winCounts[winner.code] = (winCounts[winner.code] || 0) + 1;
            }
        });

        const entries = Object.entries(cargoData.candidates)
            .filter(([code]) => !INVALID_CODES.has(code))
            .map(([code, info]) => ({
                code,
                info,
                wins: winCounts[code] || 0
            }))
            .filter((entry) => entry.wins > 0)
            .sort((left, right) => {
                if (right.wins !== left.wins) {
                    return right.wins - left.wins;
                }
                return left.info.nome.localeCompare(right.info.nome, 'pt-BR');
            });

        dom.legendItems.innerHTML = '';
        dom.legendItems.style.display = 'grid';
        dom.legendItems.style.gap = '8px';

        if (!entries.length) {
            dom.legendItems.appendChild(createEmptyState('Nenhum local com vencedor encontrado neste filtro.'));
            return;
        }

        const fragment = document.createDocumentFragment();
        entries.forEach((entry) => {
            fragment.appendChild(buildLegendItem(entry, visibleFeatures.length));
        });
        dom.legendItems.appendChild(fragment);
    }

    function buildLegendItem(entry, totalFeatures) {
        const item = document.createElement('div');
        item.className = 'metric-item';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.gap = '10px';
        item.style.padding = '8px 10px';

        const swatch = document.createElement('span');
        swatch.className = 'swatch';
        swatch.style.background = entry.info.cor;
        swatch.style.marginTop = '0';

        const textWrap = document.createElement('div');
        textWrap.style.flex = '1';
        textWrap.style.minWidth = '0';

        const name = document.createElement('div');
        name.style.fontSize = '12px';
        name.style.fontWeight = '600';
        name.style.lineHeight = '1.25';
        name.textContent = entry.info.nome;

        const party = document.createElement('div');
        party.style.fontSize = '11px';
        party.style.color = 'var(--muted)';
        party.textContent = entry.info.partido || 'Sem partido';

        const totals = document.createElement('div');
        totals.style.textAlign = 'right';
        totals.style.flexShrink = '0';

        const count = document.createElement('div');
        count.style.fontSize = '12px';
        count.style.fontWeight = '700';
        count.textContent = formatNumber(entry.wins);

        const pct = document.createElement('div');
        pct.style.fontSize = '11px';
        pct.style.color = 'var(--muted)';
        pct.textContent = `${formatPercent((entry.wins / totalFeatures) * 100)} dos locais`;

        textWrap.append(name, party);
        totals.append(count, pct);
        item.append(swatch, textWrap, totals);

        return item;
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

    function renderDetail(feature) {
        const summary = summarizeFeature(feature);
        const props = feature.properties;
        const cargoLabel = CANDIDATES[state.currentCargo]?.label || 'Cargo';

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
                `Municipio: ${escapeHtml(titleCase(props.municipio))}`,
                `Distrito: ${escapeHtml(titleCase(props.distrito || props.municipio))}`,
                `Zona ${escapeHtml(String(props.zona))} - ${escapeHtml(titleCase(props.zona_nome || props.municipio))}`,
                `${escapeHtml(props.tipo || 'Local')} - ${escapeHtml(titleCase(props.endereco || 'Endereco nao informado'))}`
            ].map((item) => `<span>${item}</span>`).join('');
        }

        renderMetrics(summary);
        renderCandidateCards(summary, cargoLabel);
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

    function renderMetrics(summary) {
        if (!dom.metricsGrid) {
            return;
        }

        const blankVotes = summary.invalidEntries.find((entry) => entry.code === '95')?.votos || 0;
        const nullVotes = summary.invalidEntries.find((entry) => entry.code === '96')?.votos || 0;
        const blankPct = summary.total > 0 ? (blankVotes / summary.total) * 100 : 0;
        const nullPct = summary.total > 0 ? (nullVotes / summary.total) * 100 : 0;

        const metrics = [
            { label: 'Comparecimento', value: formatNumber(summary.total) },
            { label: 'Votos validos', value: formatNumber(summary.validTotal) },
            { label: `Brancos (${formatPercent(blankPct)})`, value: `${formatNumber(blankVotes)} votos` },
            { label: `Nulos (${formatPercent(nullPct)})`, value: `${formatNumber(nullVotes)} votos` },
            {
                label: 'Lideranca',
                value: summary.winner ? `${summary.winner.info.nome} (${formatPercent(summary.winnerPct)})` : 'Sem votos'
            },
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

    function renderCandidateCards(summary, cargoLabel) {
        if (!dom.candidatesGrid || !dom.btnVerMais || !dom.candidatesTitle) {
            return;
        }

        const entries = summary.validEntries.filter((entry) => entry.votos > 0);
        const hiddenCount = Math.max(entries.length - 4, 0);

        dom.candidatesTitle.textContent = `${cargoLabel} - ${entries.length} resultados`;
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
                    <button type="button" class="color-trigger" aria-label="Personalizar cor de ${escapeHtml(entry.info.nome)}">
                        <span class="swatch" style="background:${escapeHtml(entry.info.cor)}"></span>
                    </button>
                    <div class="cand-info">
                        <h4>${escapeHtml(entry.info.nome)}</h4>
                        <small>${escapeHtml(badge)}</small>
                    </div>
                </div>
                <div class="cand-stats">
                    <div class="bigPct">${formatPercent(percentage)}</div>
                    <div class="smallVotos">${formatNumber(entry.votos)} votos</div>
                </div>
            `;

            const colorTrigger = card.querySelector('.color-trigger');
            if (colorTrigger) {
                colorTrigger.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    openColorPicker(familyKey, entry.info.nome, colorTrigger);
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

        const cargoLabel = CANDIDATES[state.currentCargo]?.label || 'Resultados';
        const municipioLabel = state.currentMunicipio
            ? ` - ${titleCase(state.currentMunicipio)}`
            : '';

        dom.rightTitle.textContent = `${cargoLabel}${municipioLabel}`;
    }

    function buildTooltipHtml(feature, summary) {
        const winner = summary.winner;
        const winnerColor = getMarkerFillColor(summary);
        const subtitle = winner
            ? `${escapeHtml(winner.info.nome)} (${escapeHtml(winner.info.partido || 'Sem partido')})`
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

    function runSearch(query) {
        const q = normalizeSearch(query);
        if (q.length < 2) return [];

        const index = getSearchIndex();
        const municipios = new Map();
        const distritos = new Map();
        const features = [];

        index.forEach((entry) => {
            const inNome      = entry.nome.includes(q);
            const inDistrito  = entry.distrito.includes(q);
            const inMunicipio = entry.municipio.includes(q);
            const inEndereco  = entry.endereco.includes(q);

            if (inMunicipio) {
                const key = `MUN||${entry.municipioRaw}`;
                if (!municipios.has(key)) {
                    municipios.set(key, {
                        tipo: 'município',
                        label: titleCase(entry.municipioRaw),
                        sub: 'Município — todos os locais',
                        municipio: entry.municipioRaw,
                        distrito: null
                    });
                }
            }

            if (inDistrito) {
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
            }

            if (inNome || inEndereco) {
                features.push({
                    tipo: 'local',
                    label: titleCase(entry.nomeRaw),
                    sub: `${titleCase(entry.distritoRaw)} · ${titleCase(entry.municipioRaw)}`,
                    endereco: titleCase(entry.enderecoRaw),
                    feature: entry.feature
                });
            }
        });

        const munItems  = [...municipios.values()].slice(0, 3);
        const distItems = [...distritos.values()].slice(0, 4);
        const featItems = features.slice(0, 14 - munItems.length - distItems.length);
        return [...munItems, ...distItems, ...featItems];
    }

    function renderSearchDropdown(items) {
        const dd = dom.searchDropdown;
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

        let lastTipo = null;

        items.forEach((item) => {
            // Separator between districts and locals
            if (lastTipo !== null && item.tipo !== lastTipo) {
                const sep = document.createElement('div');
                sep.style.cssText = 'height:1px; background:var(--border); margin:4px 0;';
                dd.appendChild(sep);
            }
            lastTipo = item.tipo;

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

            // Icon
            const icon = document.createElement('span');
            icon.style.cssText = 'flex-shrink:0; font-size:15px; width:20px; text-align:center;';
            icon.textContent = item.tipo === 'local' ? '🏫' : item.tipo === 'bairro' ? '🏘' : '🏙';

            // Text
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

            // Badge
            const badge = document.createElement('span');
            badge.style.cssText = `
                flex-shrink:0; font-size:10px; font-weight:600; padding:2px 6px;
                border-radius:10px; text-transform:uppercase; letter-spacing:0.04em;
                background:var(--surface-2); color:var(--muted);
                border:1px solid var(--border);
            `;
            badge.textContent = item.tipo;

            texts.append(main, secondary);
            row.append(icon, texts, badge);

            row.addEventListener('click', () => {
                handleSearchSelect(item);
            });

            dd.appendChild(row);
        });

        dd.style.display = 'block';
    }

    function handleSearchSelect(item) {
        closeSearchDropdown();

        if (item.tipo === 'local') {
            const feature = item.feature;
            const [lon, lat] = feature.geometry.coordinates;

            // Fly to the location
            state.map.setView([lat, lon], 16);

            // Find the marker and select it
            if (state.markersLayer) {
                let found = null;
                state.markersLayer.eachLayer((layer) => {
                    if (layer._featureData === feature) {
                        found = layer;
                    }
                });

                if (found) {
                    selectFeature(feature, found, { resetExpansion: true });
                } else {
                    // Feature might be filtered out — temporarily select without marker
                    selectFeature(feature, null, { resetExpansion: true });
                }
            }

            if (dom.searchInput) {
                dom.searchInput.value = item.label;
            }

        } else if (item.tipo === 'bairro') {
            // Filter by município and zoom to district
            if (dom.selectMunicipio) {
                dom.selectMunicipio.value = item.municipio;
                state.currentMunicipio = item.municipio;
                renderMarkers({ refit: false });
                updateLegend();
                syncDetailPanel();
            }

            // Zoom to the district features
            const districtFeatures = getAllFeatures().filter((f) =>
                f.properties.municipio === item.municipio &&
                f.properties.distrito === item.distrito
            );
            fitVisibleBounds(districtFeatures);

            if (dom.searchInput) {
                dom.searchInput.value = `${item.label}, ${titleCase(item.municipio)}`;
            }

        } else if (item.tipo === 'município') {
            if (dom.selectMunicipio) {
                dom.selectMunicipio.value = item.municipio;
                state.currentMunicipio = item.municipio;
                renderMarkers({ refit: true });
                updateLegend();
                syncDetailPanel();
            }

            if (dom.searchInput) {
                dom.searchInput.value = item.label;
            }
        }

        if (dom.searchClear) {
            dom.searchClear.style.display = 'block';
        }
    }

    function closeSearchDropdown() {
        if (dom.searchDropdown) {
            dom.searchDropdown.style.display = 'none';
        }
    }

    function setupSearch() {
        const input = dom.searchInput;
        const clear = dom.searchClear;
        if (!input) return;

        let debounceTimer = null;

        input.addEventListener('input', () => {
            const val = input.value;
            clear.style.display = val ? 'block' : 'none';

            clearTimeout(debounceTimer);
            if (val.trim().length < 2) {
                closeSearchDropdown();
                return;
            }

            debounceTimer = setTimeout(() => {
                const results = runSearch(val);
                renderSearchDropdown(results);
            }, 180);
        });

        input.addEventListener('focus', () => {
            if (input.value.trim().length >= 2) {
                const results = runSearch(input.value);
                renderSearchDropdown(results);
            }
        });

        if (clear) {
            clear.addEventListener('click', () => {
                input.value = '';
                clear.style.display = 'none';
                closeSearchDropdown();
                input.focus();
            });
        }

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !dom.searchDropdown?.contains(e.target)) {
                closeSearchDropdown();
            }
        });

        // Keyboard navigation
        input.addEventListener('keydown', (e) => {
            const dd = dom.searchDropdown;
            if (!dd || dd.style.display === 'none') return;

            const buttons = [...dd.querySelectorAll('button')];
            const focused = dd.querySelector('button:focus');
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
                closeSearchDropdown();
                input.blur();
            }
        });
    }

    // ===== FIM BUSCA =====

    function setupEvents() {
        if (dom.selectCargo) {
            dom.selectCargo.addEventListener('change', () => {
                state.currentCargo = dom.selectCargo.value;
                closeColorPicker();
                renderMarkers();
                updateLegend();
                syncDetailPanel();
            });
        }

        if (dom.selectMunicipio) {
            dom.selectMunicipio.addEventListener('change', () => {
                state.currentMunicipio = dom.selectMunicipio.value;
                renderMarkers({ refit: true });
                updateLegend();
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
            dom.expandLeft.addEventListener('click', () => {
                setPanelCollapsed(dom.panelLeft, false);
            });
        }

        if (dom.expandRight) {
            dom.expandRight.addEventListener('click', () => {
                setPanelCollapsed(dom.panelRight, false);
            });
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
            window.localStorage.setItem('el2002-theme', state.theme);
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
            updateLegend();
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
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
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

    function init() {
        if (dom.selectCargo?.value) {
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
        loadData();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
