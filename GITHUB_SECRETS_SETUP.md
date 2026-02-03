# GitHub Secrets セットアップ手順

このドキュメントでは、GitHub Actionsで使用するSecretsの設定方法を説明します。

## 取得済みの情報

以下の情報は既に取得できています：

- **Project ID**: `prj_jR30hjtJ7JPPd9gGAi9oJLEC2f4I`
- **Organization ID**: `team_O1AGBabFeibEuBD5oRQoe2Mo`

## ステップ1: Vercel Tokenの取得

1. [Vercel Dashboard - Tokens](https://vercel.com/account/tokens) にアクセス
2. 「Create Token」ボタンをクリック
3. トークン名を入力（例: `github-actions-movie-check`）
4. スコープを選択：
   - **Full Account Access**（推奨）または
   - **Project Access**（特定のプロジェクトのみ）
5. 「Create」をクリック
6. **重要**: 表示されたトークンをコピーしてください（一度しか表示されません！）

## ステップ2: GitHub Secretsの設定

1. GitHubリポジトリのページに移動
   - `https://github.com/[あなたのユーザー名]/Movie-check`

2. 「Settings」タブをクリック

3. 左側のメニューから「Secrets and variables」→「Actions」を選択

4. 「New repository secret」ボタンをクリック

5. 以下の3つのシークレットを追加：

### Secret 1: VERCEL_TOKEN

- **Name**: `VERCEL_TOKEN`
- **Value**: ステップ1で取得したVercel Token
- 「Add secret」をクリック

### Secret 2: VERCEL_ORG_ID

- **Name**: `VERCEL_ORG_ID`
- **Value**: `team_O1AGBabFeibEuBD5oRQoe2Mo`
- 「Add secret」をクリック

### Secret 3: VERCEL_PROJECT_ID

- **Name**: `VERCEL_PROJECT_ID`
- **Value**: `prj_jR30hjtJ7JPPd9gGAi9oJLEC2f4I`
- 「Add secret」をクリック

## ステップ3: 動作確認

1. GitHubリポジトリの「Actions」タブを開く
2. 左側のメニューから「CI/CD」ワークフローを選択
3. 「Run workflow」をクリック
4. ブランチを選択（`main`）して「Run workflow」をクリック
5. ワークフローが正常に実行されることを確認

## トラブルシューティング

### Secretsが正しく設定されているか確認

1. Settings > Secrets and variables > Actions
2. 以下の3つが表示されているか確認：
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

### デプロイが失敗する場合

1. Actionsタブで失敗したワークフローを確認
2. エラーログを確認
3. よくある原因：
   - Vercel Tokenの権限が不足している
   - Organization IDまたはProject IDが間違っている
   - Vercel Tokenが無効になっている

## 参考

- [Vercel Tokens](https://vercel.com/account/tokens)
- [GitHub Secrets](https://docs.github.com/ja/actions/security-guides/encrypted-secrets)
