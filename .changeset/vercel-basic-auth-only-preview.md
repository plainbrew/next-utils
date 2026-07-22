---
"@plainbrew/vercel-basic-auth": minor
---

feat: add `only-preview` value to `vercelEnvTarget`

`vercelEnvTarget: "only-preview"` applies Basic Auth only on Vercel preview
deployments. Useful when you want to protect preview URLs while keeping
production open.
