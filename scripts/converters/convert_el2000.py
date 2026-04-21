"""
Converte o shapefile + DBF do CEM (EL2000_LV_RMSP_CEM_V2)
para um GeoJSON focado de 2000 limpo (Apenas Prefeito).
"""

import json
import os
import shapefile
import dbfread

PREFEITO_2000 = {
    "11": {"nome": "Maluf", "partido": "PPB", "cor": "#1A237E"},
    "12": {"nome": "Candidato PDT", "partido": "PDT", "cor": "#B71C1C"},
    "13": {"nome": "Marta Suplicy", "partido": "PT", "cor": "#CC0000"},
    "14": {"nome": "Candidato PTB", "partido": "PTB", "cor": "#003D00"},
    "15": {"nome": "Candidato PMDB", "partido": "PMDB", "cor": "#DAA520"},
    "16": {"nome": "Fabio Bosco / PSTU", "partido": "PSTU", "cor": "#A80000"},
    "19": {"nome": "Jose de Abreu / PTN", "partido": "PTN", "cor": "#6D4C41"},
    "20": {"nome": "Marin / PSC", "partido": "PSC", "cor": "#1565C0"},
    "22": {"nome": "Marcos Cintra / PL", "partido": "PL", "cor": "#002875"},
    "23": {"nome": "Candidato PPS", "partido": "PPS", "cor": "#E85D00"},
    "25": {"nome": "Romeu Tuma / PFL", "partido": "PFL", "cor": "#0D47A1"},
    "26": {"nome": "Osmar Lins / PAN", "partido": "PAN", "cor": "#795548"},
    "27": {"nome": "João Baptista / PSDC", "partido": "PSDC", "cor": "#4E342E"},
    "28": {"nome": "Candidato PRTB", "partido": "PRTB", "cor": "#2E7D32"},
    "29": {"nome": "Rui Costa Pimenta / PCO", "partido": "PCO", "cor": "#8B0000"},
    "30": {"nome": "Canidé Pegado / PGT", "partido": "PGT", "cor": "#607D8B"},
    "36": {"nome": "Ciro Moura / PRN", "partido": "PRN", "cor": "#4527A0"},
    "40": {"nome": "Luiza Erundina / PSB", "partido": "PSB", "cor": "#FF6700"},
    "41": {"nome": "Candidato PSD", "partido": "PSD", "cor": "#FFC107"},
    "43": {"nome": "Candidato PV", "partido": "PV", "cor": "#4CAF50"},
    "44": {"nome": "Candidato PRP", "partido": "PRP", "cor": "#3F51B5"},
    "45": {"nome": "Geraldo Alckmin / PSDB", "partido": "PSDB", "cor": "#0050A0"},
    "56": {"nome": "Enéas / PRONA", "partido": "PRONA", "cor": "#37474F"},
    "65": {"nome": "Candidato PCdoB", "partido": "PCdoB", "cor": "#D50000"},
    "70": {"nome": "Candidato PTdoB", "partido": "PTdoB", "cor": "#4B5320"},
    "95": {"nome": "Brancos", "partido": "", "cor": "#999999"},
    "96": {"nome": "Nulos", "partido": "", "cor": "#666666"}
}

PREFEITO_2000_2T = {
    "11": {"nome": "Maluf", "partido": "PPB", "cor": "#1A237E"},
    "13": {"nome": "Marta Suplicy", "partido": "PT", "cor": "#CC0000"},
    "45": {"nome": "Geraldo Alckmin", "partido": "PSDB", "cor": "#0050A0"},
    "95": {"nome": "Brancos", "partido": "", "cor": "#999999"},
    "96": {"nome": "Nulos", "partido": "", "cor": "#666666"}
}

CARGO_CONFIG = {
    "prefeito_1t": {"prefix": "PF00_", "turno": "1", "candidates": PREFEITO_2000},
    "prefeito_2t": {"prefix": "PF00_", "turno": "2", "candidates": PREFEITO_2000}
}

def extract_votes(record, prefix, turno, candidates):
    votes = {}
    for field_name, value in record.items():
        if not field_name.startswith(prefix) or value is None:
            continue
            
        suffix = field_name[len(prefix):]
        if turno is not None:
            if suffix[0] != turno: continue
            candidate_code = suffix[1:]
        else:
            candidate_code = suffix

        if candidate_code in candidates:
            votes[candidate_code] = int(value)
            
    return votes

def main():
    print("Iniciando coversão EL2000...")
    print("Lendo shapefile (EL2000_LV_RMSP_CEM_V2.shp)...")
    sf = shapefile.Reader("EL2000_LV_RMSP_CEM_V2")

    print("Lendo DBF (EL2000_LV_RMSP_CEM_V2.DBF)...")
    db = dbfread.DBF("EL2000_LV_RMSP_CEM_V2.DBF", encoding="latin1")
    records = list(db)

    print(f"Bateu records? Total: {len(records)}, Shapes: {len(sf)}")
    assert len(records) == len(sf), "Mismatch DBF/SHP!"

    features = []
    
    # Alguns DBFs dessa época podem trocar nome das chaves, usamos chaves tolerantes
    for i, record in enumerate(records):
        shape = sf.shape(i)
        lon, lat = shape.points[0]

        props = {
            "id": record.get("ID", record.get("COD_LV")),
            "nome": record.get("NOME_LV"),
            "endereco": record.get("END_LV"),
            "tipo": record.get("TIPO_LV"),
            "municipio": record.get("MUN_NOME"),
            "distrito": record.get("DIS_NOME", record.get("TEC2_NOM")),
            "zona": record.get("ZE_NUM"),
            "zona_nome": record.get("ZE_NOME")
        }

        for cargo_key, cfg in CARGO_CONFIG.items():
            props[cargo_key] = extract_votes(
                record, cfg["prefix"], cfg["turno"], cfg["candidates"]
            )

        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [round(lon, 6), round(lat, 6)]
            },
            "properties": props
        })

    geojson = {"type": "FeatureCollection", "features": features}

    os.makedirs("data", exist_ok=True)
    out_path = os.path.join("data", "stations_2000.geojson")
    
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False)

    print(f"\n[OK] GEOJSON gerado com SUCESSO: {out_path}")
    
if __name__ == "__main__":
    main()
