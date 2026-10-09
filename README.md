# reembolsonew

Motor da Política de Reembolso de Despesas e Adiantamento de Viagem (Stefanini, emissão 07/2018).

A regra decide. Não existe fila "em análise".

Cloudflare Worker. O deploy sobe em cada push em `main` quando os secrets `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` existem no repositório.

Worker: `reembolsonew`  
URL prevista: https://reembolsonew.jhonata-emerick.workers.dev

## Rotas

- `/` dois comprovantes já julgados e um JSON editável
- `POST /api/julgar`
- `GET /api/exemplos`
- `GET /api/politica`
- `GET /health`

## Casos

- Recibo 19, táxi convencional Régua Itaim → Guarulhos, R$ 203,95: barrado.
- NFC-e 4868, The Lucca Jardins, 07/10/2026 06:34, R$ 88,00: café da manhã, barrado. O documento fiscal está válido.

## Local

```bash
npm install
npm test
npm run dev
```
