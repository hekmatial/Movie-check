# GitHub Actions CI/CD セットアップガイド

このドキュメントでは、GitHub Actionsを使ってCI/CDを設定する方法を説明します。

## 概要

このプロジェクトには2つのワークフローが含まれています：

1. **CI/CD** (`ci-cd.yml`): テスト、ビルド、デプロイを実行
2. **CI Only** (`ci-only.yml`): プルリクエスト時にテストとビルドのみ実行

## セットアップ手順

### ステップ1: Vercelの認証情報を取得

GitHub ActionsからVercelにデプロイするには、以下の情報が必要です：

1. **Vercel Token**
2. **Vercel Organization ID**
3. **Vercel Project ID**

#### Vercel Tokenの取得

1. [Vercel Dashboard](https://vercel.com/account/tokens)にアクセス
2. 「Create Token」をクリック
3. トークン名を入力（例: `github-actions`）
4. スコープを選択（Full Account Access または Project Access）
5. 「Create」をクリックしてトークンをコピー
   - ⚠️ **重要**: このトークンは一度しか表示されません。安全に保管してください

#### Vercel Organization IDとProject IDの取得

**方法1: Vercel CLIを使用（推奨）**

```bash
# Vercel CLIをインストール（権限エラーが出る場合は下記の「トラブルシューティング」を参照）
npm i -g vercel

# または、npxを使用（グローバルインストール不要）
npx vercel login
npx vercel link

# ログイン
vercel login

# プロジェクトディレクトリで実行
cd /path/to/Movie-check
vercel link

# 以下の情報が表示されます：
# - Organization ID
# - Project ID
```

**⚠️ 権限エラー（EACCES）が発生した場合**

グローバルインストールで権限エラーが出る場合は、以下のいずれかの方法を使用してください：

**方法A: npxを使用（推奨・グローバルインストール不要）**
```bash
# npxを使用すれば、グローバルインストール不要
npx vercel login
npx vercel link
```

**方法B: sudoを使用（注意が必要）**
```bash
# 管理者権限でインストール
sudo npm i -g vercel
```

**方法C: npmのグローバルディレクトリの権限を変更**
```bash
# npmのグローバルディレクトリを作成
mkdir ~/.npm-global

# npmの設定を変更
npm config set prefix '~/.npm-global'

# PATHに追加（~/.zshrc または ~/.bash_profile に追加）
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc

# 再度インストール
npm i -g vercel
```

**方法2: Vercel Dashboardから取得**

1. Vercelダッシュボードでプロジェクトを選択
2. 「Settings」→「General」に移動
3. 「Project ID」をコピー
4. Organization IDは、URLから取得できます：
   - URL例: `https://vercel.com/[ORG_NAME]/[PROJECT_NAME]`
   - `[ORG_NAME]` がOrganization IDです

### ステップ2: GitHub Secretsの設定

1. GitHubリポジトリのページに移動
2. 「Settings」タブをクリック
3. 左側のメニューから「Secrets and variables」→「Actions」を選択
4. 「New repository secret」をクリック
5. 以下の3つのシークレットを追加：

   **VERCEL_TOKEN**
   - Name: `VERCEL_TOKEN`
   - Value: ステップ1で取得したVercel Token

   **VERCEL_ORG_ID**
   - Name: `VERCEL_ORG_ID`
   - Value: ステップ1で取得したOrganization ID

   **VERCEL_PROJECT_ID**
   - Name: `VERCEL_PROJECT_ID`
   - Value: ステップ1で取得したProject ID

### ステップ3: ワークフローの確認

ワークフローファイルは既に作成されています：

- `.github/workflows/ci-cd.yml`: メインのCI/CDワークフロー
- `.github/workflows/ci-only.yml`: プルリクエスト用のCIワークフロー

## ワークフローの動作

### CI/CD ワークフロー (`ci-cd.yml`)

**トリガー:**
- `main` または `develop` ブランチへのプッシュ
- `main` または `develop` ブランチへのプルリクエスト

**実行内容:**
1. コードのチェックアウト
2. Node.jsのセットアップ
3. 依存関係のインストール
4. Lintの実行
5. 型チェック
6. ビルド
7. **mainブランチへのプッシュ時のみ**: Vercelへのデプロイ

### CI Only ワークフロー (`ci-only.yml`)

**トリガー:**
- `main` または `develop` ブランチへのプルリクエスト

**実行内容:**
1. コードのチェックアウト
2. Node.jsのセットアップ
3. 依存関係のインストール
4. Lintの実行
5. 型チェック
6. ビルド

**注意**: プルリクエスト時はデプロイは実行されません（セキュリティのため）

## 使用方法

### 通常の開発フロー

1. 機能ブランチを作成
2. 変更をコミット
3. プルリクエストを作成
   - CI Onlyワークフローが自動的に実行されます
   - テストとビルドが成功することを確認
4. プルリクエストをマージ
5. `main`ブランチにマージされると、CI/CDワークフローが実行され、自動的にVercelにデプロイされます

### 手動でワークフローを実行

1. GitHubリポジトリの「Actions」タブを開く
2. 左側のメニューから実行したいワークフローを選択
3. 「Run workflow」をクリック
4. ブランチを選択して実行

## トラブルシューティング

### デプロイが失敗する場合

1. **Secretsが正しく設定されているか確認**
   - Settings > Secrets and variables > Actions
   - 3つのシークレット（VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID）が存在するか確認

2. **Vercel Tokenの権限を確認**
   - Full Account Access または適切なProject Accessが設定されているか確認

3. **Actionsのログを確認**
   - Actionsタブで失敗したワークフローを選択
   - エラーメッセージを確認

### ビルドが失敗する場合

1. **ローカルでビルドが成功するか確認**
   ```bash
   npm ci
   npm run build
   ```

2. **依存関係の問題を確認**
   - `package-lock.json`が最新か確認
   - `npm ci`でクリーンインストールを試す

### Lintエラーが発生する場合

1. **ローカルでLintを実行**
   ```bash
   npm run lint
   ```

2. **自動修正を試す**
   ```bash
   npm run lint -- --fix
   ```

## カスタマイズ

### ブランチ名の変更

ワークフローファイルの以下の部分を編集：

```yaml
on:
  push:
    branches:
      - main  # ここを変更
```

### 追加のテストを実行

`ci-cd.yml`の`test`ジョブにステップを追加：

```yaml
- name: Run tests
  run: npm test  # テストスクリプトを追加する場合
```

### デプロイ前の通知

SlackやDiscordへの通知を追加することも可能です。必要に応じてワークフローを拡張してください。

## 参考リンク

- [GitHub Actions ドキュメント](https://docs.github.com/ja/actions)
- [Vercel CLI ドキュメント](https://vercel.com/docs/cli)
- [amondnet/vercel-action](https://github.com/amondnet/vercel-action)
