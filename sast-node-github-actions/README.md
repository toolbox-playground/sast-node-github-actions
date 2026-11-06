# SAST no GitHub Actions com Node.js

Demo do vídeo da TBX Tech: três ferramentas de SAST contra o mesmo código, rodando em paralelo no GitHub Actions.

> ⚠️ **Este app tem vulnerabilidades plantadas de propósito.** Não rode em produção, não exponha na internet.

## As vulnerabilidades plantadas

| # | Vulnerabilidade | Onde |
|---|---|---|
| 1 | Secret JWT hardcoded | `app/server.js` — `JWT_SECRET` |
| 2 | SQL injection | rota `GET /usuarios` |
| 3 | Command injection | rota `GET /ping` |

## As ferramentas

| Ferramenta | Tipo | Licença |
|---|---|---|
| ESLint + `eslint-plugin-security` | Linter com regras de segurança | Open source (MIT/Apache) |
| Semgrep Community Edition | SAST | Open source (LGPL-2.1) |
| CodeQL | SAST | **Gratuito em repositório público, mas não é open source** |

## Placar (execução local, 06/11/2026)

| Ferramenta | Plantadas achadas | Achados extras |
|---|---|---|
| Semgrep CE (regras JavaScript + secrets) | 3 de 3 | 1 — falta de middleware CSRF |
| CodeQL 2.27.4 (suite padrão e security-extended) | 2 de 3 — não acha o secret | 2 — falta de rate limiting |
| ESLint 10 + plugin security | 1 de 3 — só o command injection | 0 |

Observações:

- **ESLint sai com código 0** mesmo encontrando problema: as regras do plugin são `warning`. Sem `--max-warnings 0`, o pipeline fica verde.
- **CodeQL e secret:** a query `js/hardcoded-credentials` existe, mas tem `@precision low` e fica fora dos suites padrão e estendido. No GitHub, secret é papel do *secret scanning*.
- **Gate do Semgrep por severidade:** o achado do secret é `WARNING`. Com `--severity ERROR`, o gate bloqueia SQL e command injection, mas deixa o secret passar.
- **Uma app de 40 linhas não mede taxa de falso positivo.** O placar vale para esta demo, não como ranking geral.

## Rodando localmente

```bash
npm ci
npx eslint app/                       # ESLint
semgrep scan --config p/javascript --config p/secrets app/   # Semgrep
```

## No GitHub Actions

Workflow: `.github/workflows/sast-node-github-actions.yml` (na raiz do monorepo).

- Dispara só quando algo nesta pasta muda (filtro de `paths`).
- Os três jobs enviam SARIF para **Security → Code scanning**, cada um com sua `category`.
- ESLint e Semgrep têm gate no próprio job. O CodeQL não falha o job; o gate dele é um ruleset com *Require code scanning results*.
- Actions fixadas por SHA.

## Checklist antes de gravar

- [ ] Rodar o workflow no runner e anotar o tempo real de cada job
- [ ] Conferir se o placar com `p/javascript` (registro do Semgrep) bate com o local (lá foi usado o diretório `javascript` do repositório `semgrep-rules`)
- [ ] Confirmar na doc oficial: CodeQL gratuito em repositório público e a licença do CodeQL CLI
- [ ] Confirmar que a aba Security mostra as três categorias separadas
