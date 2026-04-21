"""
Converte EL2004.geojson (bruto) para EL2004_web.geojson (otimizado para web).
Cargos: Prefeito (1T + 2T).
Prefixos: PF04_1xx / PF04_2xx
"""

import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

PREFIX = "PF04_"

# ── AUTO-DETECÇÃO DE CANDIDATOS ───────────────────────────────────────────────

def detect_candidates(features, turno_digit):
    """Descobre todos os códigos de candidatos presentes no dataset."""
    codes = set()
    for feat in features:
        for k in feat["properties"]:
            if not k.startswith(PREFIX):
                continue
            suffix = k[len(PREFIX):]
            if suffix.startswith(turno_digit):
                codes.add(suffix[1:])
    return sorted(codes, key=lambda x: int(x))

# ── EXTRAÇÃO DE VOTOS ─────────────────────────────────────────────────────────

def extract_votes(props, turno_digit, candidates):
    votes = {}
    for k, v in props.items():
        if not k.startswith(PREFIX) or v is None:
            continue
        suffix = k[len(PREFIX):]
        if not suffix.startswith(turno_digit):
            continue
        code = suffix[1:]
        if code in candidates and isinstance(v, (int, float)):
            votes[code] = int(v)
    return votes

# ── MAIN ──────────────────────────────────────────────────────────────────────

def main():
    src = os.path.join("data", "EL2004.geojson")
    dst = os.path.join("data", "EL2004_web.geojson")

    print(f"Lendo {src}...")
    with open(src, encoding="utf-8") as f:
        gj = json.load(f)

    features_in = gj["features"]
    print(f"Processando {len(features_in)} features...")

    # Auto-detectar candidatos
    cands_1t = set(detect_candidates(features_in, "1"))
    cands_2t = set(detect_candidates(features_in, "2"))

    print(f"Candidatos 1T detectados ({len(cands_1t)}): {sorted(cands_1t, key=int)}")
    print(f"Candidatos 2T detectados ({len(cands_2t)}): {sorted(cands_2t, key=int)}")

    features_out = []

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
            "prefeito_1t": extract_votes(p, "1", cands_1t),
            "prefeito_2t": extract_votes(p, "2", cands_2t),
        }

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
    total_1t = sum(sample["prefeito_1t"].values()) if sample["prefeito_1t"] else 0
    total_2t = sum(sample["prefeito_2t"].values()) if sample["prefeito_2t"] else 0
    print(f"  prefeito_1t: {len(sample['prefeito_1t'])} candidatos, {total_1t} votos no 1º local")
    print(f"  prefeito_2t: {len(sample['prefeito_2t'])} candidatos, {total_2t} votos no 1º local")

    # Listar municípios únicos
    municipios = sorted(set(
        f["properties"]["municipio"]
        for f in features_out
        if f["properties"]["municipio"]
    ))
    print(f"\nMunicípios ({len(municipios)}):")
    for m in municipios:
        print(f"  {m}")

if __name__ == "__main__":
    main()
