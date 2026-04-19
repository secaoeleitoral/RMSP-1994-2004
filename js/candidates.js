/**
 * Dicionario de candidatos e escalas partidarias - Secao Eleitoral RMSP 1994-2004
 * As escalas foram adaptadas da planilha de referencia enviada pelo usuario.
 */

const COLOR_LEVELS = [20, 30, 40, 50, 60, 70, 80, 90];
const DEFAULT_COLOR_LEVEL = 60;

function createScale(scale) {
    const normalized = {};

    COLOR_LEVELS.forEach((level) => {
        const fallbackLevel = scale[level] ? level : COLOR_LEVELS.find((candidateLevel) => scale[candidateLevel]);
        normalized[level] = normalizeHex(scale[level] || scale[fallbackLevel] || '3d3d3d');
    });

    return normalized;
}

function normalizeHex(value) {
    const sanitized = String(value || '')
        .replace(/[^0-9a-fA-F]/g, '')
        .slice(0, 6)
        .padEnd(6, '0');

    return `#${sanitized.toLowerCase()}`;
}

function isHexColor(value) {
    return /^#?[0-9a-fA-F]{6}$/.test(String(value || '').trim());
}

function hexToRgb(hex) {
    const normalized = normalizeHex(hex).slice(1);
    return {
        r: parseInt(normalized.slice(0, 2), 16),
        g: parseInt(normalized.slice(2, 4), 16),
        b: parseInt(normalized.slice(4, 6), 16)
    };
}

function rgbToHex(r, g, b) {
    const toHex = (value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixHexColors(baseHex, targetHex, ratio) {
    const base = hexToRgb(baseHex);
    const target = hexToRgb(targetHex);

    return rgbToHex(
        base.r + (target.r - base.r) * ratio,
        base.g + (target.g - base.g) * ratio,
        base.b + (target.b - base.b) * ratio
    );
}

function createScaleFromBaseColor(baseHex) {
    const normalized = normalizeHex(baseHex);

    return {
        20: mixHexColors(normalized, '#ffffff', 0.35),
        30: mixHexColors(normalized, '#ffffff', 0.24),
        40: mixHexColors(normalized, '#ffffff', 0.14),
        50: mixHexColors(normalized, '#ffffff', 0.07),
        60: normalized,
        70: mixHexColors(normalized, '#000000', 0.12),
        80: mixHexColors(normalized, '#000000', 0.22),
        90: mixHexColors(normalized, '#000000', 0.34)
    };
}

function normalizePartyKey(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, ' ')
        .trim();
}

const PARTY_COLOR_SCALES = {
    PDT: createScale({
        20: 'ffe2db',
        30: 'ffd6cc',
        40: 'ffc2b3',
        50: 'ffad99',
        60: 'ff947a',
        70: 'ff7c5c',
        80: 'ff633d',
        90: 'ff4b1f'
    }),
    NOVO_SD: createScale({
        20: 'f0a275',
        30: 'ed8f5a',
        40: 'ea7c3e',
        50: 'e6661e',
        60: 'ca5716',
        70: 'aa4913',
        80: '8e3d10',
        90: '6e2f0c'
    }),
    PSD: createScale({
        20: 'ffaf4c',
        30: 'ff9f29',
        40: 'ff910a',
        50: 'eb8100',
        60: 'c76d00',
        70: 'a35900',
        80: '854800',
        90: '663700'
    }),
    PSB: createScale({
        20: 'f0db75',
        30: 'edd355',
        40: 'eacc39',
        50: 'e7c418',
        60: 'c6a815',
        70: 'ab9112',
        80: '8f790f',
        90: '73620c'
    }),
    PFL_DEM: createScale({
        20: 'b8e39b',
        30: 'a5db80',
        40: '91d364',
        50: '7dcb48',
        60: '6dbf36',
        70: '5fa72f',
        80: '4f8b27',
        90: '3f6f1f'
    }),
    PSL: createScale({
        20: '77d36f',
        30: '5dca53',
        40: '47c33c',
        50: '3ba432',
        60: '328c2b',
        70: '2a7524',
        80: '215a1c',
        90: '173e13'
    }),
    PODE_PSC_PV: createScale({
        20: '67cd8a',
        30: '53c57a',
        40: '3fbb69',
        50: '37a45c',
        60: '2f8e4f',
        70: '287742',
        80: '206035',
        90: '164124'
    }),
    MDB: createScale({
        20: '4be78b',
        30: '31e37a',
        40: '1dd76a',
        50: '1abc5d',
        60: '16a250',
        70: '128743',
        80: '0f6c36',
        90: '0b5128'
    }),
    PRN: createScale({
        20: '6bd6a4',
        30: '53d095',
        40: '37c884',
        50: '30b074',
        60: '2a9864',
        70: '238054',
        80: '1d6844',
        90: '165034'
    }),
    REP: createScale({
        20: '7dd1d9',
        30: '61c7d1',
        40: '45bdc9',
        50: '36aeba',
        60: '2e949e',
        70: '267a82',
        80: '1f646b',
        90: '184e53'
    }),
    UNIAO: createScale({
        20: '4ed4ff',
        30: '2eccff',
        40: '0fc5ff',
        50: '00b6f0',
        60: '009fd1',
        70: '0083ad',
        80: '006c8f',
        90: '00516b'
    }),
    PSDB: createScale({
        20: '5cbcff',
        30: '42b1ff',
        40: '24a5ff',
        50: '0096ff',
        60: '0084e0',
        70: '0072c2',
        80: '0060a3',
        90: '004b80'
    }),
    PP: createScale({
        20: '828282',
        30: '707070',
        40: '5e5e5e',
        50: '4f4f4f',
        60: '3d3d3d',
        70: '2b2b2b',
        80: '1f1f1f',
        90: '0f0f0f'
    }),
    PRONA: createScale({
        20: '67cd8a',
        30: '53c57a',
        40: '3fbb69',
        50: '37a45c',
        60: '2f8e4f',
        70: '287742',
        80: '206035',
        90: '164124'
    }),
    PL: createScale({
        20: '7585d1',
        30: '5b6dc8',
        40: '4055bf',
        50: '384ba8',
        60: '304091',
        70: '29367a',
        80: '222d63',
        90: '1a224c'
    }),
    PSOL: createScale({
        20: 'ed78da',
        30: 'e95dd2',
        40: 'e53ec9',
        50: 'e01fc0',
        60: 'c51ba9',
        70: 'ab1792',
        80: '90147b',
        90: '700f60'
    }),
    CIDADANIA: createScale({
        20: 'ef76b3',
        30: 'ec5fa6',
        40: 'e93f95',
        50: 'e52486',
        60: 'cd1874',
        70: 'ad1462',
        80: '8d1150',
        90: '6d0d3e'
    }),
    PT: createScale({
        20: 'ff5c77',
        30: 'ff3859',
        40: 'ff1a40',
        50: 'f50028',
        60: 'd10022',
        70: 'b2001d',
        80: '940018',
        90: '700012'
    }),
    PMDB_1980: createScale({
        20: 'e25850',
        30: 'de3e35',
        40: 'ce2b22',
        50: 'b4251d',
        60: '9a2019',
        70: '7f1a15',
        80: '601410',
        90: '460f0c'
    }),
    ALT_CINZA: createScale({
        20: '828282',
        30: '707070',
        40: '5e5e5e',
        50: '4f4f4f',
        60: '3d3d3d',
        70: '2b2b2b',
        80: '1f1f1f',
        90: '0f0f0f'
    }),
    HIST_PSD: createScale({
        30: 'a0e9f8',
        40: '71def4',
        50: '41d3f1',
        60: '11c8ee',
        70: '0ea0be',
        80: '0b788e',
        90: '07505f'
    }),
    HIST_UDN: createScale({
        30: 'aab8ee',
        40: '8094e5',
        50: '5671dc',
        60: '2b4dd4',
        70: '223eaa',
        80: '192e80',
        90: '111f55'
    }),
    HIST_PL: createScale({
        30: 'ffe099',
        40: 'ffd166',
        50: 'ffc133',
        60: 'ffb200',
        70: 'cc8e00',
        80: '996b00',
        90: '664700'
    }),
    HIST_PSP: createScale({
        30: 'a1787d',
        40: '876569',
        50: '6e5255',
        60: '533e40',
        70: '3b2c2d',
        80: '332728',
        90: '21191a'
    }),
    HIST_PTB: createScale({
        20: '4ed4ff',
        30: '2eccff',
        40: '0fc5ff',
        50: '00b6f0',
        60: '009fd1',
        70: '0083ad',
        80: '006c8f',
        90: '00516b'
    }),
    HIST_PRP: createScale({
        30: '23a840',
        40: '1f9439',
        50: '1a7e2f',
        60: '166928',
        70: '11541f',
        80: '0d3f18',
        90: '092b11'
    }),
    HIST_PTN: createScale({
        30: 'afe9af',
        40: '88de88',
        50: '5fd35f',
        60: '37c837',
        70: '2ca02c',
        80: '217821',
        90: '165016'
    }),
    HIST_PR: createScale({
        30: 'afe9d0',
        40: '87deb9',
        50: '5fd3a1',
        60: '37c88b',
        70: '2ca06f',
        80: '217853',
        90: '165037'
    }),
    EUA_R: createScale({
        30: 'fb9daa',
        40: 'f96c80',
        50: 'f73b56',
        60: 'f50a2c',
        70: 'c40823',
        80: '93061a',
        90: '620411'
    }),
    EUA_D: createScale({
        30: '99ccff',
        40: '66b2ff',
        50: '3398ff',
        60: '0080ff',
        70: '0066cc',
        80: '004d99',
        90: '003366'
    }),
    ARG_UXP: createScale({
        30: '99d6ff',
        40: '66c1ff',
        50: '33adff',
        60: '0097fd',
        70: '007acc',
        80: '005b99',
        90: '003d66'
    }),
    ARG_JXC_PRO: createScale({
        30: 'ffe599',
        40: 'ffd866',
        50: 'ffcb33',
        60: 'ffbe00',
        70: 'cb9801',
        80: '987201',
        90: '654c01'
    }),
    ARG_LLA: createScale({
        30: 'd0a8f0',
        40: 'b97ce9',
        50: 'a151e1',
        60: '8926d9',
        70: '6e1fad',
        80: '531782',
        90: '370f57'
    }),
    ARG_UCR: createScale({
        30: 'ff9999',
        40: 'ff6666',
        50: 'ff3333',
        60: 'ff0c0c',
        70: 'd00000',
        80: '8b0000',
        90: '690000'
    }),
    PC_DO_B: createScale({
        20: 'e25850',
        30: 'de3e35',
        40: 'ce2b22',
        50: 'b4251d',
        60: '9a2019',
        70: '7f1a15',
        80: '601410',
        90: '4a0f0c'
    })
};

const PARTY_COLOR_FAMILIES = {
    PT: 'PT',
    'PC DO B': 'PC_DO_B',
    PSTU: 'PSOL',
    PCO: 'PMDB_1980',
    PPS: 'CIDADANIA',
    PSB: 'PSB',
    PSDB: 'PSDB',
    PP: 'PP',
    PPB: 'PP',
    PMDB: 'MDB',
    PDT: 'PDT',
    PTB: 'HIST_PTB',
    PSL: 'PSL',
    PFL: 'PFL_DEM',
    PV: 'PODE_PSC_PV',
    PSC: 'PODE_PSC_PV',
    PAN: 'REP',
    PRTB: 'HIST_PRP',
    PGT: 'HIST_PSP',
    PTC: 'NOVO_SD',
    PRONA: 'PRONA',
    PMN: 'HIST_UDN',
    PHS: 'HIST_PR',
    PTN: 'HIST_PTN',
    PSDC: 'PSD',
    PSD: 'HIST_PSD',
    UDN: 'HIST_UDN',
    PRP: 'HIST_PRP',
    PR: 'HIST_PR',
    PL: 'PL'
};

const COLOR_SCALE_OPTIONS = [
    { key: 'PDT', label: '6a Republica - PDT' },
    { key: 'NOVO_SD', label: '6a Republica - NOVO/SD' },
    { key: 'PSD', label: '6a Republica - PSD' },
    { key: 'PSB', label: '6a Republica - PSB' },
    { key: 'PFL_DEM', label: '6a Republica - PFL/DEM' },
    { key: 'PSL', label: '6a Republica - PSL' },
    { key: 'PODE_PSC_PV', label: '6a Republica - PODE/PSC/PV' },
    { key: 'MDB', label: '6a Republica - MDB' },
    { key: 'PRN', label: '6a Republica - PRN' },
    { key: 'REP', label: '6a Republica - REP' },
    { key: 'UNIAO', label: '6a Republica - UNIAO' },
    { key: 'PSDB', label: '6a Republica - PSDB' },
    { key: 'PP', label: '6a Republica - PP' },
    { key: 'PL', label: '6a Republica - PL' },
    { key: 'PSOL', label: '6a Republica - PSOL' },
    { key: 'CIDADANIA', label: '6a Republica - CIDADANIA' },
    { key: 'PT', label: '6a Republica - PT' },
    { key: 'PC_DO_B', label: '6a Republica - PC do B' },
    { key: 'PMDB_1980', label: '6a Republica - PMDB 1980' },
    { key: 'ALT_CINZA', label: '6a Republica - ALT CINZA' },
    { key: 'HIST_PSD', label: '4a Republica - PSD' },
    { key: 'HIST_UDN', label: '4a Republica - UDN' },
    { key: 'HIST_PL', label: '4a Republica - PL' },
    { key: 'HIST_PSP', label: '4a Republica - PSP' },
    { key: 'HIST_PTB', label: '4a Republica - PTB' },
    { key: 'HIST_PRP', label: '4a Republica - PRP' },
    { key: 'HIST_PTN', label: '4a Republica - PTN' },
    { key: 'HIST_PR', label: '4a Republica - PR' },
    { key: 'EUA_R', label: 'EUA - R' },
    { key: 'EUA_D', label: 'EUA - D' },
    { key: 'ARG_UXP', label: 'ARG - UxP/PJ' },
    { key: 'ARG_JXC_PRO', label: 'ARG - JxC/PRO' },
    { key: 'ARG_LLA', label: 'ARG - LLA' },
    { key: 'ARG_UCR', label: 'ARG - UCR' }
];

const DISPLAY_FAMILY_LABELS = {
    ALT_CINZA: 'Brancos / Nulos',
    CIDADANIA: 'PPS / Cidadania',
    MDB: 'MDB / PMDB',
    PC_DO_B: 'PC do B',
    PODE_PSC_PV: 'PV / PSC',
    PP: 'PP / PPB',
    PRN: 'PRONA',
    PSOL: 'PSOL / PSTU',
    REP: 'PAN / REP',
    UNIAO: 'Uniao / azul claro'
};

function getPartyScaleKey(partyOrFamily) {
    if (!partyOrFamily) {
        return 'ALT_CINZA';
    }

    if (PARTY_COLOR_SCALES[partyOrFamily]) {
        return partyOrFamily;
    }

    const normalized = normalizePartyKey(partyOrFamily);
    return PARTY_COLOR_FAMILIES[normalized] || 'ALT_CINZA';
}

function resolvePartyScaleKey(partyOrFamily, overrides = null) {
    const baseKey = PARTY_COLOR_SCALES[partyOrFamily] ? partyOrFamily : getPartyScaleKey(partyOrFamily);
    const overrideKey = overrides?.[baseKey];
    return PARTY_COLOR_SCALES[overrideKey] ? overrideKey : baseKey;
}

function getPartyScale(partyOrFamily, overrides = null) {
    const baseKey = PARTY_COLOR_SCALES[partyOrFamily] ? partyOrFamily : getPartyScaleKey(partyOrFamily);
    const overrideValue = overrides?.[baseKey];

    if (isHexColor(overrideValue)) {
        return createScaleFromBaseColor(overrideValue);
    }

    return PARTY_COLOR_SCALES[resolvePartyScaleKey(partyOrFamily, overrides)] || PARTY_COLOR_SCALES.ALT_CINZA;
}

function getPartyColor(partyOrFamily, level = DEFAULT_COLOR_LEVEL, overrides = null) {
    const scale = getPartyScale(partyOrFamily, overrides);
    const normalizedLevel = COLOR_LEVELS.includes(level) ? level : DEFAULT_COLOR_LEVEL;
    return scale[normalizedLevel] || scale[DEFAULT_COLOR_LEVEL] || PARTY_COLOR_SCALES.ALT_CINZA[DEFAULT_COLOR_LEVEL];
}

function normalizeColorOverrideValue(value) {
    if (!value) {
        return '';
    }

    if (PARTY_COLOR_SCALES[value]) {
        return value;
    }

    if (isHexColor(value)) {
        return normalizeHex(value);
    }

    return '';
}

function getAvailableColorOptions() {
    return COLOR_SCALE_OPTIONS.map((option) => ({ ...option }));
}

function getColorFamilyLabel(familyKey) {
    return DISPLAY_FAMILY_LABELS[familyKey]
        || COLOR_SCALE_OPTIONS.find((option) => option.key === familyKey)?.label
        || familyKey.replaceAll('_', ' / ');
}

function enrichCandidate(candidate) {
    const family = candidate.familia || getPartyScaleKey(candidate.partido);

    return {
        ...candidate,
        familia: family,
        familiaCor: resolvePartyScaleKey(family),
        escala: getPartyScale(family),
        cor: getPartyColor(family, DEFAULT_COLOR_LEVEL)
    };
}

function withColors(groups) {
    const coloredGroups = {};

    Object.entries(groups).forEach(([officeKey, officeValue]) => {
        const coloredCandidates = {};

        Object.entries(officeValue.candidates).forEach(([candidateCode, candidateValue]) => {
            coloredCandidates[candidateCode] = enrichCandidate(candidateValue);
        });

        coloredGroups[officeKey] = {
            ...officeValue,
            candidates: coloredCandidates
        };
    });

    return coloredGroups;
}

const CANDIDATES = withColors({
    prefeito_1t: {
        label: 'Prefeito - 1º Turno (2000)',
        candidates: {
            '11': { nome: 'Maluf', partido: 'PPB' },
            '12': { nome: 'Candidato PDT', partido: 'PDT' },
            '13': { nome: 'Marta Suplicy', partido: 'PT' },
            '14': { nome: 'Candidato PTB', partido: 'PTB' },
            '15': { nome: 'Candidato PMDB', partido: 'PMDB' },
            '16': { nome: 'Fabio Bosco', partido: 'PSTU' },
            '19': { nome: 'Jose de Abreu', partido: 'PTN' },
            '20': { nome: 'Marin', partido: 'PSC' },
            '22': { nome: 'Marcos Cintra', partido: 'PL' },
            '23': { nome: 'Candidato PPS', partido: 'PPS' },
            '25': { nome: 'Romeu Tuma', partido: 'PFL' },
            '26': { nome: 'Osmar Lins', partido: 'PAN' },
            '27': { nome: 'João Baptista', partido: 'PSDC' },
            '28': { nome: 'Candidato PRTB', partido: 'PRTB' },
            '29': { nome: 'Rui Costa Pimenta', partido: 'PCO' },
            '30': { nome: 'Canidé Pegado', partido: 'PGT' },
            '36': { nome: 'Ciro Moura', partido: 'PRN' },
            '40': { nome: 'Luiza Erundina', partido: 'PSB' },
            '41': { nome: 'Candidato PSD', partido: 'PSD' },
            '43': { nome: "Candidato PV", partido: "PV" },
            '44': { nome: "Candidato PRP", partido: "PRP" },
            '45': { nome: 'Geraldo Alckmin', partido: 'PSDB' },
            '56': { nome: 'Enéas', partido: 'PRONA' },
            '65': { nome: 'Candidato PCdoB', partido: 'PC_DO_B' },
            '70': { nome: 'Candidato PTdoB', partido: 'NOVO_SD' },
            '95': { nome: 'Brancos', partido: '', familia: 'ALT_CINZA' },
            '96': { nome: 'Nulos', partido: '', familia: 'ALT_CINZA' }
        }
    },
    prefeito_2t: {
        label: 'Prefeito - 2º Turno (2000)',
        candidates: {
            '11': { nome: 'Maluf', partido: 'PPB' },
            '12': { nome: 'Candidato PDT', partido: 'PDT' },
            '13': { nome: 'Marta Suplicy', partido: 'PT' },
            '14': { nome: 'Candidato PTB', partido: 'PTB' },
            '15': { nome: 'Candidato PMDB', partido: 'PMDB' },
            '16': { nome: 'Fabio Bosco', partido: 'PSTU' },
            '19': { nome: 'Jose de Abreu', partido: 'PTN' },
            '20': { nome: 'Marin', partido: 'PSC' },
            '22': { nome: 'Marcos Cintra', partido: 'PL' },
            '23': { nome: 'Candidato PPS', partido: 'PPS' },
            '25': { nome: 'Romeu Tuma', partido: 'PFL' },
            '26': { nome: 'Osmar Lins', partido: 'PAN' },
            '27': { nome: 'João Baptista', partido: 'PSDC' },
            '28': { nome: 'Candidato PRTB', partido: 'PRTB' },
            '29': { nome: 'Rui Costa Pimenta', partido: 'PCO' },
            '30': { nome: 'Canidé Pegado', partido: 'PGT' },
            '36': { nome: 'Ciro Moura', partido: 'PRN' },
            '40': { nome: 'Luiza Erundina', partido: 'PSB' },
            '41': { nome: 'Candidato PSD', partido: 'PSD' },
            '43': { nome: "Candidato PV", partido: "PV" },
            '44': { nome: "Candidato PRP", partido: "PRP" },
            '45': { nome: 'Geraldo Alckmin', partido: 'PSDB' },
            '56': { nome: 'Enéas', partido: 'PRONA' },
            '65': { nome: 'Candidato PCdoB', partido: 'PC_DO_B' },
            '70': { nome: 'Candidato PTdoB', partido: 'NOVO_SD' },
            '95': { nome: 'Brancos', partido: '', familia: 'ALT_CINZA' },
            '96': { nome: 'Nulos', partido: '', familia: 'ALT_CINZA' }
        }
    },
    presidente_1t: {
        label: 'Presidente - 1º Turno',
        candidates: {
            '13': { nome: 'Lula', partido: 'PT' },
            '16': { nome: 'Zé Maria', partido: 'PSTU' },
            '23': { nome: 'Ciro', partido: 'PPS' },
            '29': { nome: 'Rui Costa Pimenta', partido: 'PCO' },
            '40': { nome: 'Garotinho', partido: 'PSB' },
            '45': { nome: 'José Serra', partido: 'PSDB' },
            '95': { nome: 'Brancos', partido: '', familia: 'ALT_CINZA' },
            '96': { nome: 'Nulos', partido: '', familia: 'ALT_CINZA' }
        }
    },
    presidente_2t: {
        label: 'Presidente - 2º Turno',
        candidates: {
            '13': { nome: 'Lula', partido: 'PT' },
            '45': { nome: 'José Serra', partido: 'PSDB' },
            '95': { nome: 'Brancos', partido: '', familia: 'ALT_CINZA' },
            '96': { nome: 'Nulos', partido: '', familia: 'ALT_CINZA' }
        }
    },
    governador_1t: {
        label: 'Governador SP - 1º Turno',
        candidates: {
            '11': { nome: 'Paulo Maluf', partido: 'PPB' },
            '13': { nome: 'Genoíno', partido: 'PT' },
            '14': { nome: 'Cabrera', partido: 'PTB' },
            '15': { nome: 'Lamartine Posella', partido: 'PMDB' },
            '16': { nome: 'Dirceu Travesso', partido: 'PSTU' },
            '17': { nome: 'Roberto Siqueira', partido: 'PSL' },
            '26': { nome: 'Osmar Lins', partido: 'PAN' },
            '28': { nome: 'Levy Fidelix', partido: 'PRTB' },
            '29': { nome: 'Anaí', partido: 'PCO' },
            '30': { nome: 'Carlos Apolinário', partido: 'PGT' },
            '36': { nome: 'Ciro Moura', partido: 'PTC' },
            '40': { nome: 'Carlos R. Pittoli', partido: 'PSB' },
            '43': { nome: 'Pinheiro Pedro', partido: 'PV' },
            '45': { nome: 'Geraldo Alckmin', partido: 'PSDB' },
            '56': { nome: 'Robson Malek', partido: 'PRONA' },
            '95': { nome: 'Brancos', partido: '', familia: 'ALT_CINZA' },
            '96': { nome: 'Nulos', partido: '', familia: 'ALT_CINZA' }
        }
    },
    governador_2t: {
        label: 'Governador SP - 2º Turno',
        candidates: {
            '13': { nome: 'Genoíno', partido: 'PT' },
            '45': { nome: 'Geraldo Alckmin', partido: 'PSDB' },
            '95': { nome: 'Brancos', partido: '', familia: 'ALT_CINZA' },
            '96': { nome: 'Nulos', partido: '', familia: 'ALT_CINZA' }
        }
    },
    senador: {
        label: 'Senador SP',
        candidates: {
            '111': { nome: 'Cunha Bueno', partido: 'PPB' },
            '123': { nome: 'Eliseu Gabriel', partido: 'PDT' },
            '131': { nome: 'Mercadante', partido: 'PT' },
            '147': { nome: 'Willians Rafael', partido: 'PTB' },
            '151': { nome: 'Quércia', partido: 'PMDB' },
            '152': { nome: 'Leandrini', partido: 'PMDB' },
            '161': { nome: 'Mauro Puerro', partido: 'PSTU' },
            '162': { nome: 'Renatão', partido: 'PSTU' },
            '170': { nome: 'Thereza Ruiz', partido: 'PTN' },
            '190': { nome: 'Thereza Ruiz', partido: 'PTN' },
            '200': { nome: 'Marin', partido: 'PSC' },
            '252': { nome: 'Romeu Tuma', partido: 'PFL' },
            '266': { nome: 'José Costa', partido: 'PAN' },
            '270': { nome: 'Paulo Fortunato', partido: 'PSDC' },
            '281': { nome: 'Carlos Dardé', partido: 'PRTB' },
            '291': { nome: 'Wlamisa', partido: 'PCO' },
            '292': { nome: 'Firmino', partido: 'PCO' },
            '301': { nome: 'Ademar de Barros', partido: 'PGT' },
            '312': { nome: 'José Raul', partido: 'PHS' },
            '333': { nome: 'Lucas Albano', partido: 'PMN' },
            '401': { nome: 'Rubens Calvo', partido: 'PSB' },
            '404': { nome: 'Mourad', partido: 'PSB' },
            '434': { nome: 'Penna', partido: 'PV' },
            '451': { nome: 'José Aníbal', partido: 'PSDB' },
            '561': { nome: 'Dr. Paulo Correa', partido: 'PRONA' },
            '651': { nome: 'Wagner Gomes', partido: 'PC do B' },
            '95': { nome: 'Brancos', partido: '', familia: 'ALT_CINZA' },
            '96': { nome: 'Nulos', partido: '', familia: 'ALT_CINZA' }
        }
    }
});

const CANDIDATES_1998 = withColors({
    presidente_1t: {
        label: 'Presidente - 1º Turno (1998)',
        candidates: {
            '13': { nome: 'Lula',               partido: 'PT'    },
            '16': { nome: 'Zé Maria',            partido: 'PSTU'  },
            '19': { nome: 'Candidato PTN',        partido: 'PTN'   },
            '20': { nome: 'Candidato PSC',        partido: 'PSC'   },
            '23': { nome: 'Ciro Gomes',           partido: 'PPS'   },
            '27': { nome: 'Eymael',               partido: 'PSDC'  },
            '31': { nome: 'Vasco Azevedo Neto',   partido: 'PSN'   },
            '33': { nome: 'Ivan Frota',           partido: 'PMN'   },
            '43': { nome: 'Alfredo Sirkis',       partido: 'PV'    },
            '45': { nome: 'FHC',                  partido: 'PSDB'  },
            '56': { nome: 'Enéas',                partido: 'PRONA' },
            '70': { nome: 'Candidato PTdoB',      partido: 'NOVO_SD' },
            '95': { nome: 'Brancos', partido: '', familia: 'ALT_CINZA' },
            '96': { nome: 'Nulos',   partido: '', familia: 'ALT_CINZA' }
        }
    },
    governador_1t: {
        label: 'Governador SP - 1º Turno (1998)',
        candidates: {
            '11': { nome: 'Paulo Maluf',       partido: 'PPB'   },
            '12': { nome: 'Francisco Rossi',   partido: 'PDT'   },
            '13': { nome: 'Marta Suplicy',     partido: 'PT'    },
            '15': { nome: 'Quércia',           partido: 'PMDB'  },
            '16': { nome: 'Antonio Ferreira',  partido: 'PSTU'  },
            '20': { nome: 'Falanga',           partido: 'PSC'   },
            '27': { nome: 'João Manuel',      partido: 'PSDC'  },
            '28': { nome: 'Levy Fidelix',      partido: 'PRTB'  },
            '45': { nome: 'Mário Covas',      partido: 'PSDB'  },
            '56': { nome: 'Constantino Cury',  partido: 'PRONA' },
            '95': { nome: 'Brancos', partido: '', familia: 'ALT_CINZA' },
            '96': { nome: 'Nulos',   partido: '', familia: 'ALT_CINZA' }
        }
    },
    governador_2t: {
        label: 'Governador SP - 2º Turno (1998)',
        candidates: {
            '11': { nome: 'Paulo Maluf', partido: 'PPB'  },
            '45': { nome: 'Mário Covas', partido: 'PSDB' },
            '95': { nome: 'Brancos', partido: '', familia: 'ALT_CINZA' },
            '96': { nome: 'Nulos',   partido: '', familia: 'ALT_CINZA' }
        }
    },
    senador_1t: {
        label: 'Senador SP - 1º Turno (1998)',
        candidates: {
            '11': { nome: 'Oscar do Basquete',     partido: 'PPB'   },
            '13': { nome: 'Eduardo Suplicy',       partido: 'PT'    },
            '14': { nome: 'João Leite Neto',       partido: 'PTB'   },
            '15': { nome: 'Jooji Hato',            partido: 'PMDB'  },
            '16': { nome: 'Mauro Puerro',          partido: 'PSTU'  },
            '20': { nome: 'Kayo Fukuda',           partido: 'PSC'   },
            '27': { nome: 'Osmar Simionatto',      partido: 'PSDC'  },
            '28': { nome: 'Aguiar Filho',          partido: 'PRTB'  },
            '30': { nome: 'Napoleão Alves',        partido: 'PGT'   },
            '40': { nome: 'Almino Affonso',        partido: 'PSB'   },
            '43': { nome: 'Domingos Fernandes',    partido: 'PV'    },
            '56': { nome: 'Paulo Corrêa',          partido: 'PRONA' },
            '70': { nome: 'Leônidas R. de Oliveira', partido: 'NOVO_SD' },
            '95': { nome: 'Brancos', partido: '', familia: 'ALT_CINZA' },
            '96': { nome: 'Nulos',   partido: '', familia: 'ALT_CINZA' }
        }
    }
});


const CANDIDATES_1994 = withColors({
    presidente_1t: {
        label: 'Presidente - 1º Turno (1994)',
        candidates: {
            '11': { nome: 'Candidato PP',     partido: 'PP'    },
            '12': { nome: 'Candidato PDT',    partido: 'PDT'   },
            '13': { nome: 'Lula',             partido: 'PT'    },
            '15': { nome: 'Candidato PMDB',   partido: 'PMDB'  },
            '20': { nome: 'Candidato PSC',    partido: 'PSC'   },
            '36': { nome: 'Candidato PTC',    partido: 'PTC'   },
            '45': { nome: 'FHC',              partido: 'PSDB'  },
            '56': { nome: 'Enéas',            partido: 'PRONA' },
            '95': { nome: 'Brancos', partido: '', familia: 'ALT_CINZA' },
            '96': { nome: 'Nulos',   partido: '', familia: 'ALT_CINZA' }
        }
    },
    governador_1t: {
        label: 'Governador SP - 1º Turno (1994)',
        candidates: {
            '12': { nome: 'Francisco Rossi',  partido: 'PDT'   },
            '13': { nome: 'Zé Dirceu',        partido: 'PT'    },
            '15': { nome: 'Barros Munhoz',    partido: 'PMDB'  },
            '20': { nome: 'Eduardo Resstom',  partido: 'PSC'   },
            '36': { nome: 'Ciro T. Moura',    partido: 'PRN'   },
            '39': { nome: 'Medeiros',         partido: 'PP'    },
            '45': { nome: 'Mário Covas',      partido: 'PSDB'  },
            '56': { nome: 'Álvaro Dutra',     partido: 'PRONA' },
            '95': { nome: 'Brancos', partido: '', familia: 'ALT_CINZA' },
            '96': { nome: 'Nulos',   partido: '', familia: 'ALT_CINZA' }
        }
    },
    governador_2t: {
        label: 'Governador SP - 2º Turno (1994)',
        candidates: {
            '12': { nome: 'Francisco Rossi',  partido: 'PDT'   },
            '45': { nome: 'Mário Covas',      partido: 'PSDB'  },
            '95': { nome: 'Brancos', partido: '', familia: 'ALT_CINZA' },
            '96': { nome: 'Nulos',   partido: '', familia: 'ALT_CINZA' }
        }
    },
    senador_1t: {
        label: 'Senador SP - 1º Turno (1994)',
        candidates: {
            '11': { nome: 'Colasuonno',       partido: 'PPR'   },
            '12': { nome: 'Carlos Caboclo',   partido: 'PDT'   },
            '13': { nome: 'Luiza Erundina',   partido: 'PT'    },
            '14': { nome: 'Brasil Vita',      partido: 'PTB'   },
            '15': { nome: 'Machado',          partido: 'PMDB'  },
            '20': { nome: 'Pompeu Toledo',    partido: 'PSC'   },
            '22': { nome: 'Romeu Tuma',       partido: 'PL'    },
            '23': { nome: 'João Herrmann',    partido: 'PPS'   },
            '25': { nome: 'João Leite Neto',  partido: 'PFL'   },
            '36': { nome: 'José Prego',       partido: 'PRN'   },
            '44': { nome: 'Elias Jorge',      partido: 'PRP'   },
            '45': { nome: 'José Serra',       partido: 'PSDB'  },
            '56': { nome: 'Dr. Paulo Flores', partido: 'PRONA' },
            '95': { nome: 'Brancos', partido: '', familia: 'ALT_CINZA' },
            '96': { nome: 'Nulos',   partido: '', familia: 'ALT_CINZA' }
        }
    }
});


const CANDIDATES_1996 = withColors({
    prefeito_1t: {
        label: 'Prefeito - 1º Turno (1996)',
        candidates: {
            '11': { nome: 'PPB',   partido: 'PPB'   },
            '12': { nome: 'PDT',   partido: 'PDT'   },
            '13': { nome: 'PT',    partido: 'PT'    },
            '14': { nome: 'PTB',   partido: 'PTB'   },
            '15': { nome: 'PMDB',  partido: 'PMDB'  },
            '16': { nome: 'PSTU',  partido: 'PSTU'  },
            '17': { nome: 'PSL',   partido: 'PSL'   },
            '18': { nome: 'PST',   partido: 'PST'   },
            '19': { nome: 'PTN',   partido: 'PTN'   },
            '20': { nome: 'PSC',   partido: 'PSC'   },
            '21': { nome: 'PCB',   partido: 'PCB'   },
            '22': { nome: 'PL',    partido: 'PL'    },
            '23': { nome: 'PPS',   partido: 'PPS'   },
            '25': { nome: 'PFL',   partido: 'PFL'   },
            '27': { nome: 'PSDC',  partido: 'PSDC'  },
            '28': { nome: 'PRTB',  partido: 'PRTB'  },
            '29': { nome: 'PCO',   partido: 'PCO'   },
            '30': { nome: 'PGT',   partido: 'PGT'   },
            '33': { nome: 'PMN',   partido: 'PMN'   },
            '36': { nome: 'PRN',   partido: 'PRN'   },
            '40': { nome: 'PSB',   partido: 'PSB'   },
            '41': { nome: 'PSD',   partido: 'PSD'   },
            '43': { nome: 'PV',    partido: 'PV'    },
            '44': { nome: 'PRP',   partido: 'PRP'   },
            '45': { nome: 'PSDB',  partido: 'PSDB'  },
            '56': { nome: 'PRONA', partido: 'PRONA' },
            '70': { nome: 'PTdoB', partido: 'PTdoB' },
            '95': { nome: 'Brancos', partido: '', familia: 'ALT_CINZA' },
            '96': { nome: 'Nulos',   partido: '', familia: 'ALT_CINZA' }
        }
    },
    prefeito_2t: {
        label: 'Prefeito - 2º Turno (1996)',
        candidates: {
            '11': { nome: 'Celso Pitta',    partido: 'PPB' },
            '13': { nome: 'Luiza Erundina', partido: 'PT'  },
            '95': { nome: 'Brancos', partido: '', familia: 'ALT_CINZA' },
            '96': { nome: 'Nulos',   partido: '', familia: 'ALT_CINZA' }
        }
    }
});

const MUNICIPIOS_1996 = {
    "PIRAPORA DO BOM JESUS": {
        "45": { "nome": "Antonio Miguel Silveira Bueno", "partido": "PSDB" },
        "40": { "nome": "Carlim Garcia Subrinho", "partido": "PSB" }
    },
    "SANTA ISABEL": {
        "15": { "nome": "Maria Angela Sanches", "partido": "PMDB" },
        "45": { "nome": "Geraldo Edyman Rodrigues de Sa", "partido": "PSDB" },
        "13": { "nome": "Maria Aparecida Ferraz de Souza", "partido": "PT" },
        "40": { "nome": "Paulo Cesar de Almeida", "partido": "PSB" },
        "16": { "nome": "Israel do Nascimento", "partido": "PSTU" },
        "11": { "nome": "Alvaro Luis Boniotti Varella", "partido": "PPB" }
    },
    "CAJAMAR": {
        "12": { "nome": "Jose David Pereira", "partido": "PDT" },
        "14": { "nome": "Antonio Carlos Oliveira Ribas", "partido": "PTB" },
        "13": { "nome": "Jose Gilson Pereira Silva", "partido": "PT" }
    },
    "RIO GRANDE DA SERRA": {
        "27": { "nome": "Vicente Joao de Rago", "partido": "PSDC" },
        "13": { "nome": "Joel de Lima Cesar", "partido": "PT" },
        "14": { "nome": "Aparecido Benedito Franco", "partido": "PTB" },
        "45": { "nome": "Jose de Souza", "partido": "PSDB" },
        "11": { "nome": "Valmir Ferreira", "partido": "PPB" },
        "43": { "nome": "Jose Lourenco dos Santos", "partido": "PV" }
    },
    "DIADEMA": {
        "13": { "nome": "Jose Augusto da Silva Ramos", "partido": "PT" },
        "40": { "nome": "Gilson Luiz Correia de Menezes", "partido": "PSB" },
        "16": { "nome": "Ronaldo dos Santos Silva", "partido": "PSTU" },
        "20": { "nome": "Wilson Ferreira Braga", "partido": "PSC" },
        "14": { "nome": "Luiz Paulo Salgado", "partido": "PTB" }
    },
    "FERRAZ DE VASCONCELOS": {
        "11": { "nome": "Alcides Alberto Gentil de Laet", "partido": "PPB" },
        "41": { "nome": "Ibrahim Tanios Abi Chedid", "partido": "PSD" },
        "15": { "nome": "Jose Carlos Abissamra", "partido": "PMDB" },
        "13": { "nome": "Espedito Pereira de Lima", "partido": "PT" },
        "45": { "nome": "Waldemar Marques de Oliveira Filho", "partido": "PSDB" },
        "36": { "nome": "Lucas de Mello", "partido": "PRN" }
    },
    "EMBU DAS ARTES": {
        "45": { "nome": "Brigida Sacramento Carvalho dos Santos", "partido": "PSDB" },
        "15": { "nome": "Paulo Cezar Martins", "partido": "PMDB" },
        "12": { "nome": "Nivaldo Orlandi", "partido": "PDT" },
        "22": { "nome": "Benedito Adao Rosa", "partido": "PL" },
        "41": { "nome": "Oscar Yazbek", "partido": "PSD" }
    },
    "FRANCISCO MORATO": {
        "11": { "nome": "Rubens Soares", "partido": "PPB" },
        "45": { "nome": "Walfrido Tiburcio", "partido": "PSDB" },
        "13": { "nome": "Adailton Alves Santana", "partido": "PT" },
        "12": { "nome": "Luiz Carlos dos Reis", "partido": "PDT" },
        "25": { "nome": "Liro de Souza Maia", "partido": "PFL" },
        "17": { "nome": "Waldeson Claudino da Silva", "partido": "PSL" }
    },
    "FRANCO DA ROCHA": {
        "14": { "nome": "Jose Benedito Hernandez", "partido": "PTB" },
        "13": { "nome": "Antonio Lopes da Silva", "partido": "PT" },
        "16": { "nome": "Jose Donizetti de Almeida", "partido": "PSTU" },
        "45": { "nome": "Widerson Tadeu Anzelotti", "partido": "PSDB" }
    },
    "GUARULHOS": {
        "12": { "nome": "Nefi Tales", "partido": "PDT" },
        "13": { "nome": "Carlos Chnaiderman", "partido": "PT" },
        "45": { "nome": "Carlos Roberto de Campos", "partido": "PSDB" },
        "11": { "nome": "Paschoal Thomeu", "partido": "PPB" },
        "23": { "nome": "Marina Angelo", "partido": "PPS" },
        "41": { "nome": "Ailton de Paula Campos", "partido": "PSD" },
        "16": { "nome": "Manoel Jose de Alencar Filho", "partido": "PSTU" }
    },
    "ITAPECERICA DA SERRA": {
        "18": { "nome": "Humberto Biserra da Silva", "partido": "PST" },
        "45": { "nome": "Lacir Ferreira Baldusco", "partido": "PSDB" },
        "70": { "nome": "Fabio Luis Santos", "partido": "PTdoB" },
        "27": { "nome": "Jose Paulo Pereira", "partido": "PSDC" },
        "23": { "nome": "Vicente Leite de Sousa", "partido": "PPS" },
        "43": { "nome": "Jorge Jose da Costa", "partido": "PV" }
    },
    "BIRITIBA MIRIM": {
        "13": { "nome": "Hernani de Freitas Prado Pereira Garcia", "partido": "PT" },
        "14": { "nome": "Luiz Masuo Yatsugafu", "partido": "PTB" },
        "30": { "nome": "Jose Maria de Siqueira", "partido": "PGT" },
        "22": { "nome": "Benedito Freitas", "partido": "PL" }
    },
    "JANDIRA": {
        "17": { "nome": "Gilberto de Brito", "partido": "PSL" },
        "23": { "nome": "Nelcino Fernandes Dias", "partido": "PPS" },
        "45": { "nome": "Walderi Braz Paschoalin", "partido": "PSDB" },
        "41": { "nome": "Marcio Ricardo Fonseca", "partido": "PSD" },
        "13": { "nome": "Paulo Henrique Barjud", "partido": "PT" },
        "40": { "nome": "Augusto Cesar Florestano", "partido": "PSB" }
    },
    "CAIEIRAS": {
        "15": { "nome": "Isaura Ferreira Neves Pereira", "partido": "PMDB" },
        "22": { "nome": "Nelson Fiore", "partido": "PL" },
        "25": { "nome": "Pedro Sergio Graf Nunes", "partido": "PFL" },
        "11": { "nome": "Carlos Augusto de Castro", "partido": "PPB" },
        "13": { "nome": "Jose Carlos Miranda", "partido": "PT" }
    },
    "JUQUITIBA": {
        "20": { "nome": "Luiz Carlos Ribeiro Pinto", "partido": "PSC" },
        "25": { "nome": "Ayres Scorsatto", "partido": "PFL" },
        "11": { "nome": "Jose Victor Vieira", "partido": "PPB" },
        "12": { "nome": "Emir Antonio Rodrigues Garcia", "partido": "PDT" }
    },
    "OSASCO": {
        "25": { "nome": "Antonio Cesar de Oliveira Braga", "partido": "PFL" },
        "33": { "nome": "Ivan Cacao", "partido": "PMN" },
        "16": { "nome": "Messias Americo da Silva", "partido": "PSTU" },
        "13": { "nome": "Joao Paulo Cunha", "partido": "PT" },
        "12": { "nome": "Carlos Fernando Zuppo Franco", "partido": "PDT" },
        "14": { "nome": "Silas Bortolosso", "partido": "PTB" },
        "45": { "nome": "Jose Masci de Abreu", "partido": "PSDB" }
    },
    "VARGEM GRANDE PAULISTA": {
        "23": { "nome": "Antonio Joao Cardoso Ribeiro", "partido": "PPS" },
        "44": { "nome": "Maria do Socorro Batista de Souza", "partido": "PRP" },
        "43": { "nome": "Gilberto Gomes", "partido": "PV" },
        "25": { "nome": "Oscar de Freitas Cavalcante", "partido": "PFL" },
        "12": { "nome": "Roberto Rocha", "partido": "PDT" },
        "45": { "nome": "Antonio Manoel da Silva", "partido": "PSDB" }
    },
    "BARUERI": {
        "30": { "nome": "Waldete Alves Rodrigues", "partido": "PGT" },
        "45": { "nome": "Jorge Marcelo Barbara de Oliveira", "partido": "PSDB" },
        "25": { "nome": "Gilberto Macedo Gil Arantes", "partido": "PFL" },
        "17": { "nome": "Gilberto Pires Franco", "partido": "PSL" },
        "12": { "nome": "Joao Amancio da Conceicao", "partido": "PDT" }
    },
    "ITAPEVI": {
        "14": { "nome": "Sonia Regina de Oliveira Salvarani", "partido": "PTB" },
        "12": { "nome": "Lazaro Toledo Queiroz Filho", "partido": "PDT" },
        "44": { "nome": "Pedro Jorge Moreira Nery", "partido": "PRP" },
        "27": { "nome": "Nilson Cardoso Neves", "partido": "PSDC" },
        "45": { "nome": "Sergio Montanheiro", "partido": "PSDB" }
    },
    "SUZANO": {
        "13": { "nome": "Ana Medeiros dos Santos", "partido": "PT" },
        "45": { "nome": "Vagner Alfredo Zapponi", "partido": "PSDB" },
        "25": { "nome": "Estevam Galvao de Oliveira", "partido": "PFL" }
    },
    "ITAQUAQUECETUBA": {
        "11": { "nome": "Ronaldo Vlademir Ferreira", "partido": "PPB" },
        "13": { "nome": "Vera da Penha Rodrigues", "partido": "PT" },
        "14": { "nome": "Antonio Carlos Mendonca", "partido": "PTB" },
        "15": { "nome": "Mario Luiz Moreno", "partido": "PMDB" },
        "40": { "nome": "Edson Ferreira Silva", "partido": "PSB" },
        "41": { "nome": "Antonio Claudio Viana", "partido": "PSD" }
    },
    "COTIA": {
        "13": { "nome": "Valter Maioral", "partido": "PT" },
        "43": { "nome": "Edinice Rute Lacava", "partido": "PV" },
        "45": { "nome": "Antonio Mansur", "partido": "PSDB" },
        "44": { "nome": "Joaquim Felizardo de Souza", "partido": "PRP" },
        "14": { "nome": "Benedicto Carlos Pedroso", "partido": "PTB" },
        "16": { "nome": "Jose Milton Cardoso de Moura", "partido": "PSTU" },
        "27": { "nome": "Jose de Sa", "partido": "PSDC" },
        "11": { "nome": "Gilson Jose Lins de Araujo", "partido": "PPB" },
        "25": { "nome": "Mario Dias Ribeiro", "partido": "PFL" }
    },
    "GUARAREMA": {
        "41": { "nome": "Raimundo Ramos", "partido": "PSD" },
        "25": { "nome": "Claudio Ferraraz", "partido": "PFL" },
        "22": { "nome": "Conceicao Aparecida Alvino de Souza", "partido": "PL" }
    }
};

function applyColorOverrides(overrides = {}) {
    Object.values(CANDIDATES).forEach((office) => {
        Object.values(office.candidates).forEach((candidate) => {
            candidate.familiaCor = resolvePartyScaleKey(candidate.familia, overrides);
            candidate.escala = getPartyScale(candidate.familia, overrides);
            candidate.cor = getPartyColor(candidate.familia, DEFAULT_COLOR_LEVEL, overrides);
        });
    });

    return CANDIDATES;
}

applyColorOverrides();


const MUNICIPIOS_2000 = {
    "NM_UE": {
        "NR_CANDIDATO": {
            "nome": "Nm_Urna_Candidato",
            "partido": "SG_PARTIDO"
        }
    },
    "ITAPECERICA DA SERRA": {
        "13": {
            "nome": "Leda Maria",
            "partido": "PT"
        },
        "45": {
            "nome": "Lacir Baldusco",
            "partido": "PSDB"
        },
        "21": {
            "nome": "Erlon Chaves De Castro",
            "partido": "PCB"
        },
        "43": {
            "nome": "Jorge Costa",
            "partido": "PV"
        },
        "26": {
            "nome": "Vicente Leite De Souza",
            "partido": "PAN"
        }
    },
    "MAUA": {
        "22": {
            "nome": "Cincinato",
            "partido": "PL"
        },
        "45": {
            "nome": "Leonel Damo",
            "partido": "PSDB"
        },
        "14": {
            "nome": "Prof. Amaury Fioravanti",
            "partido": "PTB"
        },
        "30": {
            "nome": "Luiz Teófilo",
            "partido": "PGT"
        },
        "13": {
            "nome": "Oswaldo Dias",
            "partido": "PT"
        }
    },
    "PIRAPORA DO BOM JESUS": {
        "25": {
            "nome": "Raul",
            "partido": "PFL"
        },
        "40": {
            "nome": "Bananinha",
            "partido": "PSB"
        },
        "14": {
            "nome": "Ze Mauro",
            "partido": "PTB"
        },
        "31": {
            "nome": "Adriana",
            "partido": "PHS"
        }
    },
    "OSASCO": {
        "13": {
            "nome": "Emidio",
            "partido": "PT"
        },
        "30": {
            "nome": "Lelo",
            "partido": "PGT"
        },
        "14": {
            "nome": "Celso Giglio",
            "partido": "PTB"
        }
    },
    "JANDIRA": {
        "25": {
            "nome": "Alcides",
            "partido": "PFL"
        },
        "43": {
            "nome": "Geraldo Duarte",
            "partido": "PV"
        },
        "45": {
            "nome": "Braz",
            "partido": "PSDB"
        },
        "13": {
            "nome": "Paulinho Bururu",
            "partido": "PT"
        },
        "12": {
            "nome": "Piteri",
            "partido": "PDT"
        }
    },
    "MOGI DAS CRUZES": {
        "15": {
            "nome": "Chico Bezerra",
            "partido": "PMDB"
        },
        "45": {
            "nome": "Junji",
            "partido": "PSDB"
        },
        "13": {
            "nome": "Padre Dimas",
            "partido": "PT"
        },
        "30": {
            "nome": "João Curió Alckmin",
            "partido": "PGT"
        },
        "43": {
            "nome": "Sonia Nogueira",
            "partido": "PV"
        },
        "20": {
            "nome": "Cesar Davi",
            "partido": "PSC"
        }
    },
    "FRANCO DA ROCHA": {
        "45": {
            "nome": "Adauto Leme Dos Santos",
            "partido": "PSDB"
        },
        "16": {
            "nome": "Cristiano",
            "partido": "PSTU"
        },
        "13": {
            "nome": "Maurici",
            "partido": "PT"
        },
        "14": {
            "nome": "Roberto Seixas",
            "partido": "PTB"
        }
    },
    "SAO PAULO": {
        "27": {
            "nome": "João Manuel Baptista",
            "partido": "PSDC"
        },
        "13": {
            "nome": "Marta Suplicy",
            "partido": "PT"
        },
        "45": {
            "nome": "Geraldo Alckmin",
            "partido": "PSDB"
        },
        "20": {
            "nome": "Marin",
            "partido": "PSC"
        },
        "11": {
            "nome": "Maluf",
            "partido": "PPB"
        },
        "36": {
            "nome": "Ciro Moura",
            "partido": "PRN"
        },
        "25": {
            "nome": "Romeu Tuma",
            "partido": "PFL"
        },
        "16": {
            "nome": "Fabio Bosco",
            "partido": "PSTU"
        },
        "22": {
            "nome": "Marcos Cintra",
            "partido": "PL"
        },
        "30": {
            "nome": "Canindé Pegado",
            "partido": "PGT"
        },
        "19": {
            "nome": "Jose De Abreu",
            "partido": "PTN"
        },
        "40": {
            "nome": "Luiza Erundina",
            "partido": "PSB"
        },
        "56": {
            "nome": "Enéas",
            "partido": "PRONA"
        },
        "26": {
            "nome": "Osmar Lins",
            "partido": "PAN"
        },
        "28": {
            "nome": "Collor",
            "partido": "PRTB"
        },
        "29": {
            "nome": "Rui Costa Pimenta",
            "partido": "PCO"
        }
    },
    "SUZANO": {
        "23": {
            "nome": "Jose Raimundo Araujo Diniz",
            "partido": "PPS"
        },
        "25": {
            "nome": "Estevam Galvão",
            "partido": "PFL"
        },
        "11": {
            "nome": "Dias",
            "partido": "PPB"
        },
        "13": {
            "nome": "Marcelo Candido",
            "partido": "PT"
        },
        "31": {
            "nome": "Ze Renato",
            "partido": "PHS"
        }
    },
    "SAO BERNARDO DO CAMPO": {
        "30": {
            "nome": "Pedro Copeinski",
            "partido": "PGT"
        },
        "16": {
            "nome": "Dra Eliana",
            "partido": "PSTU"
        },
        "45": {
            "nome": "Pastoriza",
            "partido": "PSDB"
        },
        "56": {
            "nome": "Paulo Corrêa",
            "partido": "PRONA"
        },
        "13": {
            "nome": "Vicentinho",
            "partido": "PT"
        },
        "14": {
            "nome": "Lauro Gomes",
            "partido": "PTB"
        },
        "23": {
            "nome": "Mauricio Soares",
            "partido": "PPS"
        }
    },
    "DIADEMA": {
        "40": {
            "nome": "Gilson Menezes",
            "partido": "PSB"
        },
        "13": {
            "nome": "Filippi",
            "partido": "PT"
        },
        "29": {
            "nome": "José Luis Feijó Nunes",
            "partido": "PCO"
        },
        "23": {
            "nome": "Dr. José Augusto",
            "partido": "PPS"
        },
        "15": {
            "nome": "José Francisco Alves",
            "partido": "PMDB"
        },
        "43": {
            "nome": "Regina",
            "partido": "PV"
        }
    },
    "COTIA": {
        "45": {
            "nome": "Quinzinho",
            "partido": "PSDB"
        },
        "23": {
            "nome": "Mario Ribeiro",
            "partido": "PPS"
        },
        "14": {
            "nome": "Dr. Ailton",
            "partido": "PTB"
        },
        "22": {
            "nome": "Castello Branco",
            "partido": "PL"
        },
        "13": {
            "nome": "Amaral",
            "partido": "PT"
        }
    },
    "GUARAREMA": {
        "19": {
            "nome": "Toninho Da Inox",
            "partido": "PTN"
        },
        "43": {
            "nome": "Laerte Junior",
            "partido": "PV"
        },
        "45": {
            "nome": "Conceição",
            "partido": "PSDB"
        },
        "15": {
            "nome": "Silvio Pereira",
            "partido": "PMDB"
        },
        "44": {
            "nome": "Mundinho",
            "partido": "PRP"
        }
    },
    "JUQUITIBA": {
        "45": {
            "nome": "Doutor Armando",
            "partido": "PSDB"
        },
        "13": {
            "nome": "Professora Cida Maschio",
            "partido": "PT"
        },
        "15": {
            "nome": "Bernardo",
            "partido": "PMDB"
        },
        "12": {
            "nome": "Emir Garcia",
            "partido": "PDT"
        },
        "25": {
            "nome": "Ayres Scorsatto",
            "partido": "PFL"
        }
    },
    "SANTO ANDRE": {
        "11": {
            "nome": "Celso Russomano",
            "partido": "PPB"
        },
        "13": {
            "nome": "Celso Daniel",
            "partido": "PT"
        },
        "23": {
            "nome": "Elcio Riva",
            "partido": "PPS"
        },
        "45": {
            "nome": "Pina",
            "partido": "PSDB"
        },
        "16": {
            "nome": "Jaime De Almeida",
            "partido": "PSTU"
        }
    },
    "FERRAZ DE VASCONCELOS": {
        "43": {
            "nome": "João Saraiva Filho",
            "partido": "PV"
        },
        "11": {
            "nome": "Beto Laet",
            "partido": "PPB"
        },
        "45": {
            "nome": "Dema",
            "partido": "PSDB"
        },
        "23": {
            "nome": "Loureiro",
            "partido": "PPS"
        },
        "44": {
            "nome": "Andre Luiz",
            "partido": "PRP"
        },
        "14": {
            "nome": "Zé Biruta",
            "partido": "PTB"
        },
        "40": {
            "nome": "Mariuza",
            "partido": "PSB"
        }
    },
    "CARAPICUIBA": {
        "13": {
            "nome": "Sergio Ribeiro",
            "partido": "PT"
        },
        "25": {
            "nome": "Roberto Aragão",
            "partido": "PFL"
        },
        "22": {
            "nome": "Vanderlei P S Coelho",
            "partido": "PL"
        },
        "30": {
            "nome": "Chicao Metalurgico",
            "partido": "PGT"
        },
        "23": {
            "nome": "Cunha Lima",
            "partido": "PPS"
        },
        "45": {
            "nome": "Fuad Chucre",
            "partido": "PSDB"
        }
    },
    "MAIRIPORA": {
        "13": {
            "nome": "Essio",
            "partido": "PT"
        },
        "18": {
            "nome": "Prof. Chafic",
            "partido": "PST"
        },
        "40": {
            "nome": "Arlindo Carpi",
            "partido": "PSB"
        },
        "23": {
            "nome": "Jair",
            "partido": "PPS"
        },
        "45": {
            "nome": "Sarkis",
            "partido": "PSDB"
        },
        "56": {
            "nome": "Netto",
            "partido": "PRONA"
        },
        "43": {
            "nome": "Tuna",
            "partido": "PV"
        }
    },
    "EMBU GUACU": {
        "45": {
            "nome": "Miro",
            "partido": "PSDB"
        },
        "23": {
            "nome": "Walter Do Posto",
            "partido": "PPS"
        },
        "15": {
            "nome": "Cravo Roxo",
            "partido": "PMDB"
        }
    },
    "GUARULHOS": {
        "23": {
            "nome": "Altamir Vaz",
            "partido": "PPS"
        },
        "13": {
            "nome": "Eloi Pietá",
            "partido": "PT"
        },
        "18": {
            "nome": "Néfi Tales",
            "partido": "PST"
        },
        "14": {
            "nome": "Paschoal Thomeu",
            "partido": "PTB"
        },
        "21": {
            "nome": "Dona Betty",
            "partido": "PCB"
        },
        "31": {
            "nome": "João Leite",
            "partido": "PHS"
        },
        "20": {
            "nome": "Celsa Gonzalez",
            "partido": "PSC"
        },
        "43": {
            "nome": "Jovino",
            "partido": "PV"
        }
    },
    "RIO GRANDE DA SERRA": {
        "20": {
            "nome": "Leonarda Franco",
            "partido": "PSC"
        },
        "45": {
            "nome": "José Teixeira",
            "partido": "PSDB"
        },
        "23": {
            "nome": "Valmir Copina",
            "partido": "PPS"
        },
        "22": {
            "nome": "Expedito De Oliveira",
            "partido": "PL"
        },
        "13": {
            "nome": "Ramon",
            "partido": "PT"
        },
        "43": {
            "nome": "Silvio Sabá",
            "partido": "PV"
        }
    },
    "TABOAO DA SERRA": {
        "23": {
            "nome": "Luiz Lune",
            "partido": "PPS"
        },
        "45": {
            "nome": "Fernando Fernandes",
            "partido": "PSDB"
        },
        "13": {
            "nome": "Professora Marcia",
            "partido": "PT"
        }
    },
    "RIBEIRAO PIRES": {
        "13": {
            "nome": "Maria Inês",
            "partido": "PT"
        },
        "16": {
            "nome": "Juscelino Rodrigues Oliveira",
            "partido": "PSTU"
        },
        "43": {
            "nome": "Roberto Tokuzumi",
            "partido": "PV"
        },
        "15": {
            "nome": "Valdirio Prisco",
            "partido": "PMDB"
        }
    },
    "ITAQUAQUECETUBA": {
        "40": {
            "nome": "Eng. Valdir Coelho",
            "partido": "PSB"
        },
        "13": {
            "nome": "Vera Da Penha",
            "partido": "PT"
        },
        "22": {
            "nome": "Armando Da Farmacia",
            "partido": "PL"
        },
        "15": {
            "nome": "Mario Moreno",
            "partido": "PMDB"
        }
    },
    "ARUJA": {
        "12": {
            "nome": "Dorival Cabrinha",
            "partido": "PDT"
        },
        "14": {
            "nome": "Braga",
            "partido": "PTB"
        },
        "22": {
            "nome": "Abel",
            "partido": "PL"
        }
    },
    "CAJAMAR": {
        "23": {
            "nome": "Messias",
            "partido": "PPS"
        },
        "13": {
            "nome": "Ednor",
            "partido": "PT"
        },
        "14": {
            "nome": "Toninho Ribas",
            "partido": "PTB"
        }
    },
    "VARGEM GRANDE PAULISTA": {
        "22": {
            "nome": "Roque De Moraes",
            "partido": "PL"
        },
        "45": {
            "nome": "To",
            "partido": "PSDB"
        },
        "13": {
            "nome": "Ricardo Campolim",
            "partido": "PT"
        }
    },
    "SAO CAETANO DO SUL": {
        "40": {
            "nome": "Leone",
            "partido": "PSB"
        },
        "45": {
            "nome": "Demambro",
            "partido": "PSDB"
        },
        "13": {
            "nome": "Jair Meneguelli",
            "partido": "PT"
        },
        "14": {
            "nome": "Tortorello",
            "partido": "PTB"
        }
    },
    "POA": {
        "13": {
            "nome": "Nelson Bueno",
            "partido": "PT"
        },
        "22": {
            "nome": "Vagner Da Otica",
            "partido": "PL"
        },
        "44": {
            "nome": "Cavaletti",
            "partido": "PRP"
        },
        "41": {
            "nome": "Eduardão",
            "partido": "PSD"
        },
        "14": {
            "nome": "Roberto Marques",
            "partido": "PTB"
        }
    },
    "BIRITIBA MIRIM": {
        "14": {
            "nome": "Luiz Yatsugafu",
            "partido": "PTB"
        },
        "12": {
            "nome": "Jacare",
            "partido": "PDT"
        },
        "22": {
            "nome": "Benedito Freitas",
            "partido": "PL"
        }
    },
    "ITAPEVI": {
        "11": {
            "nome": "Jurandir Salvarani",
            "partido": "PPB"
        },
        "23": {
            "nome": "Dra Ruth",
            "partido": "PPS"
        },
        "45": {
            "nome": "Dalvani Caramez",
            "partido": "PSDB"
        }
    },
    "CAIEIRAS": {
        "22": {
            "nome": "Nelson Fiore",
            "partido": "PL"
        },
        "40": {
            "nome": "Névio Dártora",
            "partido": "PSB"
        }
    },
    "SALESOPOLIS": {
        "15": {
            "nome": "Feital",
            "partido": "PMDB"
        },
        "43": {
            "nome": "Nêgo",
            "partido": "PV"
        },
        "14": {
            "nome": "Quico",
            "partido": "PTB"
        }
    },
    "BARUERI": {
        "43": {
            "nome": "Marcelo Barbara",
            "partido": "PV"
        },
        "25": {
            "nome": "Gil",
            "partido": "PFL"
        },
        "28": {
            "nome": "Milton Prates",
            "partido": "PRTB"
        }
    },
    "EMBU DAS ARTES": {
        "14": {
            "nome": "Milton Do Faixa Azul",
            "partido": "PTB"
        },
        "13": {
            "nome": "Geraldo Cruz",
            "partido": "PT"
        },
        "15": {
            "nome": "Paulo Martins",
            "partido": "PMDB"
        },
        "12": {
            "nome": "Nivaldo Orlandi",
            "partido": "PDT"
        }
    },
    "SANTANA DE PARNAIBA": {
        "56": {
            "nome": "Pedro Oliveira De Freitas",
            "partido": "PRONA"
        },
        "13": {
            "nome": "Professora Dora",
            "partido": "PT"
        },
        "25": {
            "nome": "Silvinho Peccioli",
            "partido": "PFL"
        }
    },
    "SANTA ISABEL": {
        "31": {
            "nome": "Edna",
            "partido": "PHS"
        },
        "15": {
            "nome": "Angela",
            "partido": "PMDB"
        },
        "25": {
            "nome": "Nenê Simão",
            "partido": "PFL"
        }
    },
    "FRANCISCO MORATO": {
        "43": {
            "nome": "Lia",
            "partido": "PV"
        },
        "45": {
            "nome": "Zezinho Bressane",
            "partido": "PSDB"
        },
        "29": {
            "nome": "Aninha",
            "partido": "PCO"
        },
        "25": {
            "nome": "Dr. Claudino",
            "partido": "PFL"
        },
        "44": {
            "nome": "Rubens",
            "partido": "PRP"
        }
    },
    "SAO LOURENCO DA SERRA": {
        "25": {
            "nome": "Claudio Pança",
            "partido": "PFL"
        },
        "22": {
            "nome": "Hélio Camargo",
            "partido": "PL"
        },
        "45": {
            "nome": "Capitão Lener",
            "partido": "PSDB"
        }
    }
};

// ── 2004 ─────────────────────────────────────────────────────────────────────
// Eleições municipais 2004. Candidatos por partido (nomes por município em MUNICIPIOS_2004).
// Códigos confirmados após rodar convert_el2004.py e dicionario 2004.csv.

const CANDIDATES_2004 = withColors({
    prefeito_1t: {
        label: 'Prefeito - 1º Turno (2004)',
        candidates: {
            '11': { nome: 'PP',     partido: 'PP'     },
            '12': { nome: 'PDT',    partido: 'PDT'    },
            '13': { nome: 'PT',     partido: 'PT'     },
            '14': { nome: 'PTB',    partido: 'PTB'    },
            '15': { nome: 'PMDB',   partido: 'PMDB'   },
            '16': { nome: 'PSTU',   partido: 'PSTU'   },
            '17': { nome: 'PSL',    partido: 'PSL'    },
            '19': { nome: 'PTN',    partido: 'PTN'    },
            '20': { nome: 'PSC',    partido: 'PSC'    },
            '21': { nome: 'PCB',    partido: 'PCB'    },
            '22': { nome: 'PL',     partido: 'PL'     },
            '23': { nome: 'PPS',    partido: 'PPS'    },
            '25': { nome: 'PFL',    partido: 'PFL'    },
            '26': { nome: 'PAN',    partido: 'PAN'    },
            '27': { nome: 'PSDC',   partido: 'PSDC'   },
            '28': { nome: 'PRTB',   partido: 'PRTB'   },
            '29': { nome: 'PCO',    partido: 'PCO'    },
            '31': { nome: 'PHS',    partido: 'PHS'    },
            '33': { nome: 'PMN',    partido: 'PMN'    },
            '36': { nome: 'PRN',    partido: 'PRN'    },
            '40': { nome: 'PSB',    partido: 'PSB'    },
            '43': { nome: 'PV',     partido: 'PV'     },
            '45': { nome: 'PSDB',   partido: 'PSDB'   },
            '56': { nome: 'PRONA',  partido: 'PRONA'  },
            '65': { nome: 'PCdoB',  partido: 'PCdoB'  },
            '70': { nome: 'PTdoB',  partido: 'PTdoB'  },
            '95': { nome: 'Brancos', partido: '', familia: 'ALT_CINZA' },
            '96': { nome: 'Nulos',   partido: '', familia: 'ALT_CINZA' }
        }
    },
    prefeito_2t: {
        label: 'Prefeito - 2º Turno (2004)',
        candidates: {
            '13': { nome: 'PT',   partido: 'PT'   },
            '45': { nome: 'PSDB', partido: 'PSDB' },
            '95': { nome: 'Brancos', partido: '', familia: 'ALT_CINZA' },
            '96': { nome: 'Nulos',   partido: '', familia: 'ALT_CINZA' }
        }
    }
});

const MUNICIPIOS_2004 = {
    "ARUJA": {
        "13": { "nome": "Dorival Cabrinha", "partido": "PT" },
        "15": { "nome": "Genesio", "partido": "PMDB" },
        "45": { "nome": "Luiz Bananeiro", "partido": "PSDB" }
    },
    "BARUERI": {
        "13": { "nome": "Baltasar Rosa Da Silva", "partido": "PT" },
        "23": { "nome": "Furlan", "partido": "PPS" },
        "27": { "nome": "Dr. Ivone", "partido": "PSDC" },
        "43": { "nome": "Melao", "partido": "PV" }
    },
    "BIRITIBA MIRIM": {
        "13": { "nome": "Paulo Fernando Do Pt", "partido": "PT" },
        "15": { "nome": "Zé Maria", "partido": "PMDB" },
        "45": { "nome": "Jacaré", "partido": "PSDB" }
    },
    "CAIEIRAS": {
        "15": { "nome": "Doca", "partido": "PMDB" },
        "43": { "nome": "Faria", "partido": "PV" },
        "45": { "nome": "Nevio Dartora", "partido": "PSDB" }
    },
    "CAJAMAR": {
        "13": { "nome": "Hilario Lopes", "partido": "PT" },
        "23": { "nome": "Messias", "partido": "PPS" },
        "25": { "nome": "Silvinho Peccioli", "partido": "PFL" }
    },
    "CARAPICUIBA": {
        "11": { "nome": "Alexandre Olimpio", "partido": "PP" },
        "12": { "nome": "Tadeu Morais", "partido": "PDT" },
        "13": { "nome": "Sergio Ribeiro", "partido": "PT" },
        "45": { "nome": "Fuad", "partido": "PSDB" }
    },
    "COTIA": {
        "13": { "nome": "Santo Siqueira", "partido": "PT" },
        "14": { "nome": "Neto", "partido": "PTB" },
        "15": { "nome": "Mario Ribeiro", "partido": "PMDB" },
        "43": { "nome": "Castelo Branco", "partido": "PV" },
        "45": { "nome": "Quinzinho", "partido": "PSDB" }
    },
    "DIADEMA": {
        "13": { "nome": "Filippi", "partido": "PT" },
        "16": { "nome": "Ivanci", "partido": "PSTU" },
        "20": { "nome": "Paulo Tasso", "partido": "PSC" },
        "22": { "nome": "Gilson Menezes", "partido": "PL" },
        "25": { "nome": "Francisco Luna", "partido": "PFL" },
        "28": { "nome": "Prof. César", "partido": "PRTB" },
        "45": { "nome": "José Augusto", "partido": "PSDB" }
    },
    "EMBU DAS ARTES": {
        "11": { "nome": "Bira Do Assis", "partido": "PP" },
        "12": { "nome": "Neide Orlandi", "partido": "PDT" },
        "13": { "nome": "Geraldo Cruz", "partido": "PT" },
        "16": { "nome": "Mario Barbosa", "partido": "PSTU" },
        "45": { "nome": "Paulo Martins", "partido": "PSDB" }
    },
    "EMBU GUACU": {
        "13": { "nome": "Dr. Afonso Junior", "partido": "PT" },
        "14": { "nome": "Walter Do Posto", "partido": "PTB" },
        "15": { "nome": "Cravo Roxo", "partido": "PMDB" },
        "45": { "nome": "Nilsinho", "partido": "PSDB" }
    },
    "FERRAZ DE VASCONCELOS": {
        "14": { "nome": "Zé Biruta", "partido": "PTB" },
        "15": { "nome": "Juracy", "partido": "PMDB" },
        "20": { "nome": "Jeremias Cabeleireiro", "partido": "PSC" },
        "23": { "nome": "Loureiro", "partido": "PPS" },
        "40": { "nome": "Dr. Jorge", "partido": "PSB" }
    },
    "FRANCISCO MORATO": {
        "23": { "nome": "Dr.Marcio", "partido": "PPS" },
        "40": { "nome": "Helio Gomes", "partido": "PSB" },
        "45": { "nome": "Dra. Andréa", "partido": "PSDB" }
    },
    "FRANCO DA ROCHA": {
        "12": { "nome": "Valdir Pereira", "partido": "PDT" },
        "13": { "nome": "Doutor Paulo", "partido": "PT" },
        "14": { "nome": "Renelis Pedroso", "partido": "PTB" },
        "16": { "nome": "Kel", "partido": "PSTU" },
        "25": { "nome": "Toninho Lopes(To)", "partido": "PFL" },
        "45": { "nome": "Marcio Cecchettini", "partido": "PSDB" }
    },
    "GUARAREMA": {
        "22": { "nome": "André", "partido": "PL" },
        "25": { "nome": "Silene", "partido": "PFL" },
        "43": { "nome": "Beto Cruz", "partido": "PV" },
        "65": { "nome": "Mundinho", "partido": "PC do B" }
    },
    "GUARULHOS": {
        "13": { "nome": "Elói Pietá", "partido": "PT" },
        "14": { "nome": "Thomeu", "partido": "PTB" },
        "15": { "nome": "Sandra Tadeu", "partido": "PMDB" },
        "16": { "nome": "Sandra Esteves", "partido": "PSTU" },
        "19": { "nome": "Waldomiro Ramos", "partido": "PTN" },
        "20": { "nome": "Nefi Tales Filho", "partido": "PSC" },
        "25": { "nome": "Roberto Lago", "partido": "PFL" },
        "26": { "nome": "Severino Xique-Xique", "partido": "PAN" },
        "27": { "nome": "Adolfo Noronha", "partido": "PSDC" },
        "29": { "nome": "Dr Eufrates", "partido": "PCO" },
        "33": { "nome": "Eduardo Soltur", "partido": "PMN" },
        "43": { "nome": "Jovino", "partido": "PV" },
        "45": { "nome": "Sebastião Alemão", "partido": "PSDB" }
    },
    "ITAPECERICA DA SERRA": {
        "13": { "nome": "Capitao Juliano", "partido": "PT" },
        "15": { "nome": "Jorge Costa", "partido": "PMDB" },
        "45": { "nome": "Pedro Corsini", "partido": "PSDB" }
    },
    "ITAPEVI": {
        "13": { "nome": "Fláudio", "partido": "PT" },
        "20": { "nome": "Dr. Carlos Fernando", "partido": "PSC" },
        "23": { "nome": "Dra. Ruth", "partido": "PPS" },
        "45": { "nome": "Dalvani Caramez", "partido": "PSDB" }
    },
    "ITAQUAQUECETUBA": {
        "13": { "nome": "Josemar", "partido": "PT" },
        "15": { "nome": "Mario Moreno", "partido": "PMDB" },
        "22": { "nome": "Armando Da Farmacia", "partido": "PL" },
        "23": { "nome": "Engenheiro Valdir Coelho", "partido": "PPS" },
        "40": { "nome": "Jose Carlos Ferreira Sem Terra", "partido": "PSB" }
    },
    "JANDIRA": {
        "13": { "nome": "Paulinho Bururu", "partido": "PT" },
        "40": { "nome": "Dr Augusto", "partido": "PSB" },
        "43": { "nome": "Piti", "partido": "PV" },
        "45": { "nome": "Braz", "partido": "PSDB" }
    },
    "JUQUITIBA": {
        "13": { "nome": "Cida Maschio", "partido": "PT" },
        "14": { "nome": "Zé Victor", "partido": "PTB" },
        "45": { "nome": "Roberto Rocha", "partido": "PSDB" }
    },
    "MAIRIPORA": {
        "13": { "nome": "Professor Essio", "partido": "PT" },
        "14": { "nome": "Jair", "partido": "PTB" },
        "25": { "nome": "Fátima Lodi", "partido": "PFL" },
        "33": { "nome": "Manoelino Cordeiro", "partido": "PMN" },
        "40": { "nome": "Carpi", "partido": "PSB" },
        "45": { "nome": "Aiacyda", "partido": "PSDB" }
    },
    "MAUA": {
        "13": { "nome": "Marcio Chaves", "partido": "PT" },
        "16": { "nome": "Diego", "partido": "PSTU" },
        "23": { "nome": "Jacomussi", "partido": "PPS" },
        "29": { "nome": "Catarina  Do Coqueiro", "partido": "PCO" },
        "40": { "nome": "Chiquinho Do Zaira", "partido": "PSB" },
        "43": { "nome": "Leonel Damo", "partido": "PV" }
    },
    "MOGI DAS CRUZES": {
        "16": { "nome": "Luisinho", "partido": "PSTU" },
        "21": { "nome": "Mário Berti", "partido": "PCB" },
        "22": { "nome": "Gondim", "partido": "PL" },
        "23": { "nome": "Thamara Strelec", "partido": "PPS" },
        "31": { "nome": "Professor Fernando", "partido": "PHS" },
        "33": { "nome": "Balbuena", "partido": "PMN" },
        "45": { "nome": "Junji", "partido": "PSDB" }
    },
    "OSASCO": {
        "13": { "nome": "Emidio", "partido": "PT" },
        "15": { "nome": "Doutor Haroldo", "partido": "PMDB" },
        "26": { "nome": "Tabajara", "partido": "PAN" },
        "31": { "nome": "Ana Paula Rossi", "partido": "PHS" },
        "43": { "nome": "Camilo", "partido": "PV" },
        "45": { "nome": "Celso Giglio", "partido": "PSDB" }
    },
    "PIRAPORA DO BOM JESUS": {
        "13": { "nome": "Bananinha", "partido": "PT" },
        "45": { "nome": "Raul", "partido": "PSDB" }
    },
    "POA": {
        "13": { "nome": "Milton Bueno", "partido": "PT" },
        "14": { "nome": "Roberto Marques", "partido": "PTB" },
        "15": { "nome": "Sérjão Mecânico", "partido": "PMDB" },
        "16": { "nome": "Zé", "partido": "PSTU" },
        "25": { "nome": "Eduardão", "partido": "PFL" },
        "43": { "nome": "Eng. Elias", "partido": "PV" },
        "45": { "nome": "Vivona", "partido": "PSDB" }
    },
    "RIBEIRAO PIRES": {
        "13": { "nome": "Jair Diniz", "partido": "PT" },
        "15": { "nome": "Valdirio Prisco", "partido": "PMDB" },
        "43": { "nome": "Clovis Volpi", "partido": "PV" },
        "45": { "nome": "Cezar De Carvalho", "partido": "PSDB" },
        "56": { "nome": "Luiz Francia", "partido": "PRONA" }
    },
    "RIO GRANDE DA SERRA": {
        "13": { "nome": "Cafu", "partido": "PT" },
        "16": { "nome": "Antonio Angelo", "partido": "PSTU" },
        "23": { "nome": "Gilvan Mendonça", "partido": "PPS" },
        "25": { "nome": "Valmir Copina", "partido": "PFL" },
        "45": { "nome": "Kiko", "partido": "PSDB" }
    },
    "SALESOPOLIS": {
        "12": { "nome": "Paulo De Jesus", "partido": "PDT" },
        "13": { "nome": "Sueli De Sousa", "partido": "PT" },
        "14": { "nome": "Lélis", "partido": "PTB" },
        "15": { "nome": "Feital", "partido": "PMDB" },
        "22": { "nome": "Rafael", "partido": "PL" },
        "25": { "nome": "Quico", "partido": "PFL" },
        "31": { "nome": "Lourenço", "partido": "PHS" },
        "43": { "nome": "Nego", "partido": "PV" }
    },
    "SANTA ISABEL": {
        "13": { "nome": "Chiquinho Do Pt", "partido": "PT" },
        "15": { "nome": "Angela", "partido": "PMDB" },
        "25": { "nome": "Nenê Simão", "partido": "PFL" },
        "45": { "nome": "Hélio Buscarioli", "partido": "PSDB" }
    },
    "SANTANA DE PARNAIBA": {
        "13": { "nome": "Prof. Aristides", "partido": "PT" },
        "25": { "nome": "Benedito Fernandes", "partido": "PFL" },
        "26": { "nome": "Francisco Cesário", "partido": "PAN" },
        "45": { "nome": "Eduardo Sanassar", "partido": "PSDB" },
        "56": { "nome": "Cicero Dos Santos", "partido": "PRONA" }
    },
    "SANTO ANDRE": {
        "12": { "nome": "Dr. Zé Dilson", "partido": "PDT" },
        "13": { "nome": "Joao Avamileno", "partido": "PT" },
        "15": { "nome": "Wilson Bianchi", "partido": "PMDB" },
        "16": { "nome": "Edgar", "partido": "PSTU" },
        "27": { "nome": "Galileo", "partido": "PSDC" },
        "29": { "nome": "Vladimir Stein", "partido": "PCO" },
        "45": { "nome": "Dr. Brandão", "partido": "PSDB" }
    },
    "SAO BERNARDO DO CAMPO": {
        "13": { "nome": "Vicentinho", "partido": "PT" },
        "16": { "nome": "Dra. Eliana", "partido": "PSTU" },
        "29": { "nome": "Professora Fatima Pereira", "partido": "PCO" },
        "40": { "nome": "Dr. Dib", "partido": "PSB" }
    },
    "SAO CAETANO DO SUL": {
        "13": { "nome": "Hamilton Lacerda", "partido": "PT" },
        "14": { "nome": "Auricchio", "partido": "PTB" },
        "16": { "nome": "Marcos Leal Alemão", "partido": "PSTU" },
        "19": { "nome": "Rogerio Lopes", "partido": "PTN" },
        "22": { "nome": "Iliomar Darronqui", "partido": "PL" },
        "25": { "nome": "Tite Campanella", "partido": "PFL" },
        "43": { "nome": "Horácio Pires", "partido": "PV" }
    },
    "SAO LOURENCO DA SERRA": {
        "13": { "nome": "Dr Zé Ricardo", "partido": "PT" },
        "22": { "nome": "Zé Da Teresa", "partido": "PL" },
        "43": { "nome": "Dr. João", "partido": "PV" },
        "45": { "nome": "Merli", "partido": "PSDB" }
    },
    "SAO PAULO": {
        "11": { "nome": "Paulo Maluf", "partido": "PP" },
        "12": { "nome": "Paulinho", "partido": "PDT" },
        "13": { "nome": "Marta Suplicy", "partido": "PT" },
        "16": { "nome": "Dirceu Travesso", "partido": "PSTU" },
        "19": { "nome": "Thereza Ruiz", "partido": "PTN" },
        "21": { "nome": "Professor  Walter Canoas", "partido": "PCB" },
        "22": { "nome": "Paulinho", "partido": "PL" },
        "26": { "nome": "Osmar Lins", "partido": "PAN" },
        "27": { "nome": "João Manuel", "partido": "PSDC" },
        "29": { "nome": "Anaí Caproni", "partido": "PCO" },
        "31": { "nome": "Francisco Rossi", "partido": "PHS" },
        "36": { "nome": "Ciro", "partido": "PTC" },
        "40": { "nome": "Luiza Erundina", "partido": "PSB" },
        "43": { "nome": "Penna", "partido": "PV" },
        "45": { "nome": "José Serra", "partido": "PSDB" },
        "56": { "nome": "Dra. Havanir", "partido": "PRONA" }
    },
    "SUZANO": {
        "13": { "nome": "Marcelo Candido", "partido": "PT" },
        "14": { "nome": "Tiquinho Quadra", "partido": "PTB" },
        "17": { "nome": "Vagner Zapponi", "partido": "PSL" },
        "40": { "nome": "Valdecir Guedes", "partido": "PSB" },
        "43": { "nome": "Eduardo Caldas", "partido": "PV" },
        "45": { "nome": "Zé Cardoso", "partido": "PSDB" },
        "70": { "nome": "Pastor Davi Lopes", "partido": "PT do B" }
    },
    "TABOAO DA SERRA": {
        "14": { "nome": "Arlete Silva", "partido": "PTB" },
        "40": { "nome": "Dr Evilasio", "partido": "PSB" }
    },
    "VARGEM GRANDE PAULISTA": {
        "14": { "nome": "Marcão", "partido": "PTB" },
        "15": { "nome": "Dr. Roquinho", "partido": "PMDB" },
        "40": { "nome": "Roberto Rocha", "partido": "PSB" },
        "43": { "nome": "Carlos Gaspar", "partido": "PV" },
        "45": { "nome": "Roque De Moraes", "partido": "PSDB" }
    }
};
