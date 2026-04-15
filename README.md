# 🗳️ Eleições 2002 — Região Metropolitana de São Paulo

Visualizador interativo dos resultados eleitorais de 2002 na Região Metropolitana de São Paulo, com mapa por local de votação.

**🔗 [Acesse o site aqui](https://SEU-USUARIO.github.io/EL2002/)**

## Funcionalidades

- **Mapa interativo** com 2.299 locais de votação georreferenciados
- **5 visualizações**: Presidente (1º e 2º turno), Governador (1º e 2º turno), Senador
- **Filtro por município** — 39 municípios da RMSP
- **Dois modos de cor**: Sólida (partido vencedor) e Degradê (intensidade da vitória)
- **Painel de detalhes**: clique em um local para ver os votos por candidato com barras animadas
- **Legenda dinâmica** com contagem de vitórias por candidato
- **Estatísticas em tempo real**: total de locais, votos válidos e vencedor geral

## Dados

| Item | Valor |
|------|-------|
| Fonte | [CEM — Centro de Estudos da Metrópole](https://centrodametropole.fflch.usp.br/) |
| Cobertura | Região Metropolitana de São Paulo |
| Eleição | 2002 (Gerais) |
| Locais | 2.299 pontos georreferenciados |
| Municípios | 39 |
| Cargos | Presidente, Governador SP, Senador SP |

## Tecnologias

- HTML + CSS + JavaScript (vanilla)
- [Leaflet.js](https://leafletjs.com/) para o mapa interativo
- Tiles: [CARTO Dark](https://carto.com/basemaps/)
- Design: tema escuro com glassmorphism
- Dados: GeoJSON convertido de Shapefile (CEM/CEBRAP)

## Como rodar localmente

```bash
# Servir com qualquer servidor HTTP estático
npx http-server -p 8080
# Abrir http://localhost:8080
```

## Deploy no GitHub Pages

1. Crie um repositório no GitHub
2. Faça push dos arquivos
3. Em Settings > Pages, selecione a branch `main` e pasta `/ (root)`
4. O site estará disponível em `https://seu-usuario.github.io/nome-do-repo/`

## Créditos

- **Dados**: [CEM — Centro de Estudos da Metrópole / CEBRAP](https://centrodametropole.fflch.usp.br/)
- **Inspiração**: [Polling-Stations-Results-Brazil-2006-2024](https://medeirosld.github.io/Polling-Stations-Results-Brazil-2006-2024/) por [@luizdaniel__](https://x.com/luizdaniel__)

## Licença

Este projeto utiliza dados públicos do CEM/CEBRAP para fins educacionais e de pesquisa.
