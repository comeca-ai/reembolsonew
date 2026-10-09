# reembolsonew

Duas telas. A regra decide no servidor.

- `GET /` Aprovada e Negada
- `POST /api/julgar`
- `GET /api/exemplos`
- `GET /api/politica`
- `GET /health`

A conta já está no `wrangler.toml`. Falta uma chave.

No repositório: Settings → Secrets and variables → Actions.

| Nome | Obrigatória |
|---|---|
| `CLOUDFLARE_API_TOKEN` | sim |
| `CLOUDFLARE_ACCOUNT_ID` | não, se for a conta do toml |

Depois: Actions → Deploy Worker → Run workflow.

URL: https://reembolsonew.jhonata-emerick.workers.dev

```bash
npm install
npm test
```
