/**
 * Dicionario de candidatos e escalas partidarias - Eleicoes 2002 RMSP
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
        30: 'fb9daa',
        40: 'f96c80',
        50: 'f73b56',
        60: 'f50a2c',
        70: 'c40823',
        80: '93061a',
        90: '620411'
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
    PRONA: 'PL',
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
