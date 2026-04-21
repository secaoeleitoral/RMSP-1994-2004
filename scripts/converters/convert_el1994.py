"""
Converte EL1994.geojson (bruto) para EL1994_web.geojson (otimizado para web).
Cargos: Presidente (1T+2T), Governador (1T+2T), Senador (1T — 2 vagas).

Prefixos:
  PS94_1XX   -> presidente_1t, código XX
  GO94_1XX1  -> governador_1t, código XX
  GO94_2XX1  -> governador_2t, código XX
  SE94_XX2   -> senador_1t (vaga 1), código XX
  SE94_XX3   -> senador_1t (vaga 2), código XX  (somados ao mesmo código)
  GO94_195/196 -> brancos/nulos governador_1t
  GO94_295/296 -> brancos/nulos governador_2t
"""

import json
import os
import re

# ── CANDIDATOS ────────────────────────────────────────────────────────────────

# Presidente 1T (FHC ganhou no 1T)
PRESIDENTE_1T = {
    '11': {'nome': 'Candidato PP',       'partido': 'PP'    },
    '12': {'nome': 'Candidato PDT',      'partido': 'PDT'   },
    '13': {'nome': 'Lula',               'partido': 'PT'    },
    '15': {'nome': 'Candidato PMDB',     'partido': 'PMDB'  },
    '20': {'nome': 'Candidato PSC',      'partido': 'PSC'   },
    '36': {'nome': 'Candidato PTC',      'partido': 'PTC'   },
    '45': {'nome': 'FHC',                'partido': 'PSDB'  },
    '56': {'nome': 'Enéas',              'partido': 'PRONA' },
    '95': {'nome': 'Brancos', 'partido': '', 'familia': 'ALT_CINZA'},
    '96': {'nome': 'Nulos',   'partido': '', 'familia': 'ALT_CINZA'},
}

GOVERNADOR_1T = {
    '12': {'nome': 'Candidato PDT',      'partido': 'PDT'   },
    '13': {'nome': 'José Genoíno',       'partido': 'PT'    },
    '15': {'nome': 'Candidato PMDB',     'partido': 'PMDB'  },
    '20': {'nome': 'Candidato PSC',      'partido': 'PSC'   },
    '36': {'nome': 'Candidato PTC',      'partido': 'PTC'   },
    '39': {'nome': 'Candidato PRN',      'partido': 'PRN'   },
    '45': {'nome': 'Mário Covas',        'partido': 'PSDB'  },
    '56': {'nome': 'Candidato PRONA',    'partido': 'PRONA' },
    '95': {'nome': 'Brancos', 'partido': '', 'familia': 'ALT_CINZA'},
    '96': {'nome': 'Nulos',   'partido': '', 'familia': 'ALT_CINZA'},
}

GOVERNADOR_2T = {
    '12': {'nome': 'Candidato PDT',      'partido': 'PDT'   },
    '45': {'nome': 'Mário Covas',        'partido': 'PSDB'  },
    '95': {'nome': 'Brancos', 'partido': '', 'familia': 'ALT_CINZA'},
    '96': {'nome': 'Nulos',   'partido': '', 'familia': 'ALT_CINZA'},
}

SENADOR_1T = {
    '11': {'nome': 'Candidato PP',       'partido': 'PP'    },
    '12': {'nome': 'Candidato PDT',      'partido': 'PDT'   },
    '13': {'nome': 'Eduardo Suplicy',    'partido': 'PT'    },
    '14': {'nome': 'Candidato PTB',      'partido': 'PTB'   },
    '15': {'nome': 'Candidato PMDB',     'partido': 'PMDB'  },
    '20': {'nome': 'Candidato PSC',      'partido': 'PSC'   },
    '22': {'nome': 'Candidato PL',       'partido': 'PL'    },
    '23': {'nome': 'Candidato PPS',      'partido': 'PPS'   },
    '25': {'nome': 'Candidato PFL',      'partido': 'PFL'   },
    '36': {'nome': 'Candidato PTC',      'partido': 'PTC'   },
    '44': {'nome': 'Candidato PRP',      'partido': 'PRP'   },
    '45': {'nome': 'Candidato PSDB',     'partido': 'PSDB'  },
    '56': {'nome': 'Candidato PRONA',    'partido': 'PRONA' },
    '95': {'nome': 'Brancos', 'partido': '', 'familia': 'ALT_CINZA'},
    '96': {'nome': 'Nulos',   'partido': '', 'familia': 'ALT_CINZA'},
}

# ── EXTRAÇÃO ──────────────────────────────────────────────────────────────────

def extract_presidente(props):
    """PS94_1XX → código XX"""
    votes = {}
    for k, v in props.items():
        if not k.startswith('PS94_') or v is None:
            continue
        suffix = k[5:]  # '1XX' or '195'/'196'
        if suffix in ('195', '196'):
            code = suffix[1:]  # '95'/'96'
        elif suffix.startswith('1'):
            code = suffix[1:]
        else:
            continue
        if code in PRESIDENTE_1T and isinstance(v, (int, float)):
            votes[code] = votes.get(code, 0) + int(v)
    return votes


def extract_governador(props, turno):
    """GO94_1XX1 (turno=1) / GO94_2XX1 (turno=2) → código XX
    Brancos/nulos: GO94_195/196 (turno=1) / GO94_295/296 (turno=2)"""
    votes = {}
    prefix = f'GO94_{turno}'
    for k, v in props.items():
        if not k.startswith('GO94_') or v is None:
            continue
        suffix = k[5:]  # e.g. '1121' or '195' or '295'
        if not suffix.startswith(str(turno)):
            continue
        inner = suffix[1:]  # remove turno digit
        if inner in ('95', '96'):
            code = inner
        else:
            code = inner.rstrip('1').rstrip('2') if inner.endswith(('1','2')) else inner
            # códigos gomam: '121' -> '12', '451' -> '45'
            code = inner[:-1] if len(inner) > 2 else inner
        cands = GOVERNADOR_1T if turno == 1 else GOVERNADOR_2T
        if code in cands and isinstance(v, (int, float)):
            votes[code] = votes.get(code, 0) + int(v)
    return votes


def extract_senador(props):
    """SE94_XX2 + SE94_XX3 → código XX (somados, 2 vagas)"""
    votes = {}
    for k, v in props.items():
        if not k.startswith('SE94_') or v is None:
            continue
        suffix = k[5:]  # e.g. '112', '452', '95', '96'
        if suffix in ('95', '96'):
            code = suffix
        elif suffix.endswith(('2', '3')):
            code = suffix[:-1]
        else:
            continue
        if code in SENADOR_1T and isinstance(v, (int, float)):
            votes[code] = votes.get(code, 0) + int(v)
    return votes

# ── MAIN ──────────────────────────────────────────────────────────────────────

def main():
    src = os.path.join('data', 'EL1994.geojson')
    dst = os.path.join('data', 'EL1994_web.geojson')

    print(f'Lendo {src}...')
    with open(src, encoding='utf-8') as f:
        gj = json.load(f)

    features_in = gj['features']
    features_out = []

    print(f'Processando {len(features_in)} features...')

    for feat in features_in:
        p   = feat['properties']
        geo = feat['geometry']

        props = {
            'id':        p.get('COD_LV') or p.get('ID'),
            'nome':      p.get('NOME_LV'),
            'endereco':  p.get('END_LV'),
            'tipo':      p.get('TIPO_LV'),
            'municipio': p.get('MUN_NOME'),
            'distrito':  p.get('DIS_NOME') or p.get('TEC2_NOM'),
            'zona':      p.get('ZE_NUM'),
            'zona_nome': p.get('ZE_NOME'),
            'presidente_1t': extract_presidente(p),
            'governador_1t': extract_governador(p, 1),
            'governador_2t': extract_governador(p, 2),
            'senador_1t':    extract_senador(p),
        }

        coords = geo['coordinates']
        coords = [round(coords[0], 6), round(coords[1], 6)]

        features_out.append({
            'type': 'Feature',
            'geometry': {'type': 'Point', 'coordinates': coords},
            'properties': props
        })

    out = {'type': 'FeatureCollection', 'features': features_out}

    with open(dst, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False)

    print(f'\n[OK] Gerado: {dst}  ({len(features_out)} features)')

    # Diagnóstico
    sample = features_out[0]['properties']
    for cargo in ('presidente_1t', 'governador_1t', 'governador_2t', 'senador_1t'):
        total = sum(sample[cargo].values()) if sample[cargo] else 0
        print(f'  {cargo}: {len(sample[cargo])} candidatos, {total} votos no 1º local')

if __name__ == '__main__':
    main()
