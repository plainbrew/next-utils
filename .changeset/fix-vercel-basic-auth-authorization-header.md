---
"@plainbrew/vercel-basic-auth": patch
---

fix: Authorization ヘッダのパース処理を改善

- Basic スキーム以外（Bearer・Digest 等）を弾くよう正規表現でスキームを検証
- パスワード中の `:` を正しく扱うため、最初の `:` のみで username と password を分割
