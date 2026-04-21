"""
Converte EL1998.geojson (bruto) para EL1998_web.geojson (otimizado para web).
Cargos: Presidente (1T), Governador (1T+2T), Senador (1T).
Prefixos: PS98_ | GO98_1xx / GO98_2xx | SE98_
"""

import json
import os

# ── CANDIDATOS ────────────────────────────────────────────────────────────────

PRESIDENTE_1T = {
    "13": {"nome": "Lula",             "partido": "PT",    "cor": "#CC0000"},
    "15": {"nome": "Ciro Gomes",       "partido": "PPS",   "cor": "#E85D00"},
    "16": {"nome": "Enéas",            "partido": "PRONA", "cor": "#37474F"},
    "17": {"nome": "Candidato PSL",    "partido": "PSL",   "cor": "#003D00"},  # placeholder
    "20": {"nome": "Candidato PSC",    "partido": "PSC",   "cor": "#1565C0"},
    "23": {"nome": "Candidato PPS",    "partido": "PPS",   "cor": "#E85D00"},
    "27": {"nome": "Candidato PSDC",   "partido": "PSDC",  "cor": "#4E342E"},
    "31": {"nome": "Candidato PHS",    "partido": "PHS",   "cor": "#795548"},
    "33": {"nome": "Ivan Frota / PMN", "partido": "PMN",   "cor": "#607D8B"},
    "43": {"nome": "Candidato PV",     "partido": "PV",    "cor": "#4CAF50"},
    "45": {"nome": "FHC",              "partido": "PSDB",  "cor": "#0050A0"},
    "56": {"nome": "Enéas / PRONA",    "partido": "PRONA", "cor": "#37474F"},
    "70": {"nome": "Candidato PTdoB",  "partido": "PTdoB", "cor": "#4B5320"},
    "95": {"nome": "Brancos",          "partido": "",      "cor": "#999999"},
    "96": {"nome": "Nulos",            "partido": "",      "cor": "#666666"},
}

PRESIDENTE_2T = {
    "13": {"nome": "Lula",  "partido": "PT",   "cor": "#CC0000"},
    "45": {"nome": "FHC",   "partido": "PSDB", "cor": "#0050A0"},
    "95": {"nome": "Brancos","partido": "",     "cor": "#999999"},
    "96": {"nome": "Nulos",  "partido": "",     "cor": "#666666"},
}

GOVERNADOR_1T = {
    "11": {"nome": "Candidato PP",      "partido": "PP",    "cor": "#1A237E"},
    "12": {"nome": "Candidato PDT",     "partido": "PDT",   "cor": "#B71C1C"},
    "13": {"nome": "José Genoíno",      "partido": "PT",    "cor": "#CC0000"},
    "15": {"nome": "Candidato PMDB",    "partido": "PMDB",  "cor": "#DAA520"},
    "16": {"nome": "Candidato PSTU",    "partido": "PSTU",  "cor": "#A80000"},
    "20": {"nome": "Candidato PSC",     "partido": "PSC",   "cor": "#1565C0"},
    "27": {"nome": "Candidato PSDC",    "partido": "PSDC",  "cor": "#4E342E"},
    "28": {"nome": "Candidato PRTB",    "partido": "PRTB",  "cor": "#2E7D32"},
    "45": {"nome": "Mário Covas",       "partido": "PSDB",  "cor": "#0050A0"},
    "56": {"nome": "Candidato PRONA",   "partido": "PRONA", "cor": "#37474F"},
    "95": {"nome": "Brancos",           "partido": "",      "cor": "#999999"},
    "96": {"nome": "Nulos",             "partido": "",      "cor": "#666666"},
}

GOVERNADOR_2T = {
    "11": {"nome": "Paulo Maluf",   "partido": "PPB",  "cor": "#1A237E"},
    "45": {"nome": "Mário Covas",   "partido": "PSDB", "cor": "#0050A0"},
    "95": {"nome": "Brancos",       "partido": "",     "cor": "#999999"},
    "96": {"nome": "Nulos",         "partido": "",     "cor": "#666666"},
}

SENADOR_1T = {
    "11": {"nome": "Candidato PP",      "partido": "PP",   "cor": "#1A237E"},
    "13": {"nome": "Eduardo Suplicy",   "partido": "PT",   "cor": "#CC0000"},
    "14": {"nome": "Candidato PTB",     "partido": "PTB",  "cor": "#003D00"},
    "15": {"nome": "Candidato PMDB",    "partido": "PMDB", "cor": "#DAA520"},
    "16": {"nome": "Candidato PSTU",    "partido": "PSTU", "cor": "#A80000"},
    "20": {"nome": "Candidato PSC",     "partido": "PSC",  "cor": "#1565C0"},
    "27": {"nome": "Candidato PSDC",    "partido": "PSDC", "cor": "#4E342E"},
    "28": {"nome": "Candidato PRTB",    "partido": "PRTB", "cor": "#2E7D32"},
    "30": {"nome": "Candidato PGT",     "partido": "PGT",  "cor": "#607D8B"},
    "40": {"nome": "Candidato PSB",     "partido": "PSB",  "cor": "#FF6700"},
    "43": {"nome": "Candidato PV",      "partido": "PV",   "cor": "#4CAF50"},
    "56": {"nome": "Candidato PRONA",   "partido": "PRONA","cor": "#37474F"},
    "70": {"nome": "Candidato PTdoB",   "partido": "PTdoB","cor": "#4B5320"},
    "95": {"nome": "Brancos",           "partido": "",     "cor": "#999999"},
    "96": {"nome": "Nulos",             "partido": "",     "cor": "#666666"},
}

# ── CONFIGURAÇÃO DE CARGOS ────────────────────────────────────────────────────

CARGO_CONFIG = {
    # key usado no JS | prefixo no GeoJSON | dígito turno (None = sem filtro) | candidatos
    "presidente_1t":  ("PS98_",  "1",   PRESIDENTE_1T),
    "governador_1t":  ("GO98_",  "1",   GOVERNADOR_1T),
    "governador_2t":  ("GO98_",  "2",   GOVERNADOR_2T),
    "senador_1t":     ("SE98_",  None,  SENADOR_1T),
}

# ── EXTRAÇÃO DE VOTOS ─────────────────────────────────────────────────────────

def extract_votes(props, prefix, turno_digit, candidates):
    votes = {}
    for k, v in props.items():
        if not k.startswith(prefix) or v is None:
            continue
        suffix = k[len(prefix):]          # ex: "113" ou "11"
        if turno_digit is not None:
            if not suffix.startswith(turno_digit):
                continue
            code = suffix[1:]             # remove dígito de turno
        else:
            code = suffix
        if code in candidates and isinstance(v, (int, float)):
            votes[code] = int(v)
    return votes

# ── MAIN ──────────────────────────────────────────────────────────────────────

def main():
    src = os.path.join("data", "EL1998.geojson")
    dst = os.path.join("data", "EL1998_web.geojson")

    print(f"Lendo {src}...")
    with open(src, encoding="utf-8") as f:
        gj = json.load(f)

    features_in  = gj["features"]
    features_out = []

    print(f"Processando {len(features_in)} features...")

    for feat in features_in:
        p   = feat["properties"]
        geo = feat["geometry"]

        props = {
            "id":        p.get("COD_LV") or p.get("ID"),
            "nome":      p.get("NOME_LV"),
            "endereco":  p.get("END_LV"),
            "tipo":      p.get("TIPO_LV"),
            "municipio": p.get("MUN_NOME"),
            "distrito":  p.get("DIS_NOME") or p.get("TEC2_NOM"),
            "zona":      p.get("ZE_NUM"),
            "zona_nome": p.get("ZE_NOME"),
        }

        for cargo_key, (prefix, turno_digit, candidates) in CARGO_CONFIG.items():
            props[cargo_key] = extract_votes(p, prefix, turno_digit, candidates)

        # Arredondar coordenadas para reduzir tamanho
        coords = geo["coordinates"]
        coords = [round(coords[0], 6), round(coords[1], 6)]

        features_out.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": coords},
            "properties": props
        })

    out = {"type": "FeatureCollection", "features": features_out}

    with open(dst, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)

    print(f"\n[OK] Gerado: {dst}  ({len(features_out)} features)")

    # Diagnóstico rápido: quantos campos de votos no 1º feature
    sample = features_out[0]["properties"]
    for cargo in CARGO_CONFIG:
        total = sum(sample[cargo].values()) if sample[cargo] else 0
        print(f"  {cargo}: {len(sample[cargo])} candidatos, {total} votos no 1º local")

if __name__ == "__main__":
    main()
