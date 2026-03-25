# next-utils

## リリース手順

このリポジトリは [changesets](https://github.com/changesets/changesets) を使ってバージョン管理と npm publish を行います。

### 1. changeset を作成する

パッケージに変更を加えたら、その変更内容を記録するファイルを作成します。

```bash
pnpm changeset
```

対話形式で以下を入力します：

- **対象パッケージ** — 変更したパッケージを選択
- **バージョンの種類** — `patch` / `minor` / `major` を選択
- **変更内容の説明** — changelog に記載されるメッセージを入力

実行後、`.changeset/` に `.md` ファイルが生成されます。このファイルを変更と一緒にコミットして PR を出してください。

### 2. main にマージする

PR を main にマージすると、GitHub Actions が自動的に動きます。

- **changeset ファイルがある場合** — "Version Packages" という PR が自動作成されます
- **changeset ファイルがない場合** — 何も起きません

### 3. "Version Packages" PR をマージする

自動作成された "Version Packages" PR には以下が含まれます：

- 各パッケージの `package.json` のバージョン更新
- `CHANGELOG.md` の更新

この PR をマージすると、GitHub Actions が npm に自動で publish します。

### 事前準備（初回のみ）

リポジトリの Settings → Secrets に以下を追加してください：

| Secret 名   | 値                                             |
| ----------- | ---------------------------------------------- |
| `NPM_TOKEN` | npm の Access Token（`Automation` タイプ推奨） |
