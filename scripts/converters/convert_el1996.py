"""
Converte EL1996.geojson (bruto) para EL1996_web.geojson (otimizado para web).
Cargos: Prefeito (1T + 2T).
Prefixos: PF96_1xx / PF96_2xx
"""

import json
import os

# ── CANDIDATOS ────────────────────────────────────────────────────────────────

PREFEITO_1T = {
    "11": {}, "12": {}, "13": {}, "14": {}, "15": {}, "16": {}, "17": {},
    "18": {}, "19": {}, "20": {}, "21": {}, "22": {}, "23": {}, "25": {},
    "27": {}, "28": {}, "29": {}, "30": {}, "33": {}, "36": {}, "40": {},
    "41": {}, "43": {}, "44": {}, "45": {}, "56": {}, "70": {},
    "95": {}, "96": {}
}

PREFEITO_2T = {
    "11": {}, "13": {}, "95": {}, "96": {}
}

# ── CONFIGURAÇÃO DE CARGOS ────────────────────────────────────────────────────

CARGO_CONFIG = {
    "prefeito_1t": ("PF96_", "1", PREFEITO_1T),
    "prefeito_2t": ("PF96_", "2", PREFEITO_2T),
}

# ── EXTRAÇÃO DE VOTOS ─────────────────────────────────────────────────────────

def extract_votes(props, prefix, turno_digit, candidates):
    votes = {}
    for k, v in props.items():
        if not k.startswith(prefix) or v is None:
            continue
        suffix = k[len(prefix):]
        if turno_digit is not None:
            if not suffix.startswith(turno_digit):
                continue
            code = suffix[1:]
        else:
            code = suffix
        if code in candidates and isinstance(v, (int, float)):
            votes[code] = int(v)
    return votes

# ── MAIN ──────────────────────────────────────────────────────────────────────

def main():
    src = os.path.join("data", "EL1996.geojson")
    dst = os.path.join("data", "EL1996_web.geojson")

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

    sample = features_out[0]["properties"]
    for cargo in CARGO_CONFIG:
        total = sum(sample[cargo].values()) if sample[cargo] else 0
        print(f"  {cargo}: {len(sample[cargo])} candidatos, {total} votos no 1º local")

if __name__ == "__main__":
    main()
