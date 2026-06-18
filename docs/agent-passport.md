# Agent Passport

The **Agent Passport** is the cryptographic release identity for the Sovereign AI Containment Layer. It binds a specific certified release package — prompts, tools, policy, RAG config, memory rules, runtime config, and audit config — to a deterministic hash bundle.

## What it proves

- A named **release** (`release_id`) was built from a **fixed set of certified artifacts**.
- Each artifact has a **SHA-256 digest** (`sha256:<hex>`) computed with normalization rules so identical content always yields identical hashes.
- A **bundle root hash** commits to the full sorted hash bundle.
- The passport documents explicit **trust** and **non-claims** about model safety.

## What it does not prove

- The model is **not** inherently safe under all future inputs.
- TEE attestation, hashing, or passport generation does **not** mean the LLM cannot be misled or jailbroken.
- Milestone 1 does **not** execute policy, RAG, tools, or LLM calls — only release integrity.

## Certified artifacts

Located in `configs/certified-artifacts/`:

| File | Bundle key |
|------|------------|
| `model.json` | `model_hash` |
| `tokenizer.json` | `tokenizer_hash` |
| `system-prompt.md` | `system_prompt_hash` |
| `developer-prompt.md` | `developer_prompt_hash` |
| `tool-manifest.json` | `tool_manifest_hash` |
| `policy-rules.json` | `policy_rules_hash` |
| `rag-config.json` | `rag_config_hash` |
| `memory-rules.json` | `memory_rules_hash` |
| `runtime-config.json` | `runtime_config_hash` |
| `egress-allowlist.json` | `egress_allowlist_hash` |
| `audit-config.json` | `audit_config_hash` |
| `sbom-placeholder.json` | `sbom_placeholder_hash` |

Output: `artifacts/agent-passport.json` (generated, gitignored).

## How hashing works

1. **JSON artifacts** — parse, recursively sort keys, stringify with trailing newline, SHA-256 → `sha256:<hex>`.
2. **Markdown/text prompts** — Unicode NFC, LF line endings, trim trailing spaces per line, SHA-256 → `sha256:<hex>`.
3. **Bundle root** — sort `key=value` lines for every bundle entry except `bundle_root_hash`, join with newlines, SHA-256.

Changing any certified file changes its artifact hash and the `bundle_root_hash`.

## Generate passport

### CLI

```bash
npm run generate-passport
```

Or from the package:

```bash
npm run build -w @sovereign/agent-passport
npm run generate-passport -w @sovereign/agent-passport
```

### API

```bash
curl -s -X POST http://localhost:4100/passport/generate | jq
```

## Read passport

```bash
curl -s http://localhost:4100/passport/current | jq
```

If no passport exists yet:

```json
{
  "available": false,
  "reason": "passport_not_generated",
  "hint": "Run generate-passport or POST /passport/generate"
}
```

## Example passport (abbreviated)

```json
{
  "agent_did": "did:t3n:agent:sovereign-ai-containment",
  "release_id": "release-2026-06-23-v1",
  "project": "Sovereign AI Containment Layer",
  "certification_status": "draft",
  "policy_version": "0.1.0",
  "runtime_target": "tee-ready",
  "hash_bundle": {
    "model_hash": "sha256:…",
    "system_prompt_hash": "sha256:…",
    "bundle_root_hash": "sha256:…"
  },
  "trust_claim": "This passport proves release integrity, not inherent model safety.",
  "non_claim": "This passport does not prove the model is safe under all future inputs."
}
```

## Tests

```bash
npm run test -w @sovereign/agent-passport
npm run test -w @sovereign/api
```
