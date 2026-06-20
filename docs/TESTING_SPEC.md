# Testing Specification (M0 placeholder)

## Required commands (M0)

```bash
npm run build
npm test
python -m pytest tests/dashboard
streamlit run dashboard/app.py   # manual smoke
```

## Layout

| Path | Scope |
|------|-------|
| `packages/core/tests/` | Core unit placeholders |
| `packages/t3-adapter/tests/` | Adapter interface placeholders |
| `tests/integration/` | Cross-package placeholders |
| `tests/dashboard/` | Dashboard import / shell tests |

## M0 acceptance

- All placeholder tests pass
- No network calls to T3 in CI
- No secrets in test fixtures
