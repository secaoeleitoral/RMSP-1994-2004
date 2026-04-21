# Scripts de Conversão

Scripts Python que convertem os arquivos GeoJSON brutos (com colunas por candidato, prefixos tipo `PS94_`, `GO94_`, `PF96_1xx/2xx`, etc.) em GeoJSON otimizados para web (estrutura `presidente_1t`, `governador_1t`, `prefeito_1t/2t`, etc.).

## Uso

Cada script espera o arquivo bruto em `data/EL{ANO}.geojson` e gera `data/EL{ANO}_web.geojson`.

```bash
# Executar da raiz do projeto
python scripts/converters/convert_el1994.py
python scripts/converters/convert_el1996.py
python scripts/converters/convert_el1998.py
python scripts/converters/convert_el2000.py
python scripts/converters/convert_el2004.py
```

## Cargos por ano

| Ano  | Cargos                             |
|------|-------------------------------------|
| 1994 | Presidente (1T/2T), Governador, Senador |
| 1996 | Prefeito (1T/2T)                   |
| 1998 | Presidente (1T), Governador, Senador |
| 2000 | Prefeito (1T/2T)                   |
| 2002 | Presidente (1T/2T), Governador, Senador |
| 2004 | Prefeito (1T/2T)                   |
