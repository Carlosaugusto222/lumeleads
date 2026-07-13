# Testes end-to-end (Playwright)

Rodar:

```bash
bunx playwright install chromium   # primeira vez
bunx playwright test               # roda contra http://localhost:8080
```

Variáveis de ambiente:

- `E2E_BASE_URL` — URL alvo (default `http://localhost:8080`)
- `E2E_EMAIL` / `E2E_PASSWORD` — conta de teste com sessão real; sem elas o
  teste do wizard é ignorado (`test.skip`).

O teste do wizard percorre os 5 passos em modo manual e **não clica em
"Gerar"** para não consumir créditos de IA a cada execução.
