# CI/CD トラブルシューティングガイド

## 失敗の原因を確認する方法

### ステップ1: 失敗したワークフローを開く

1. GitHubリポジトリの「Actions」タブを開く
2. 失敗したワークフロー（赤い×マーク）をクリック
3. 失敗したジョブ（赤い×マーク）をクリック
4. 失敗したステップをクリックしてログを確認

### ステップ2: よくあるエラーと解決方法

#### エラー1: "Secrets not found" または "VERCEL_TOKEN is not set"

**原因**: GitHub Secretsが設定されていない

**解決方法**:
1. Settings > Secrets and variables > Actions に移動
2. 以下の3つのシークレットが設定されているか確認：
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
3. 設定されていない場合は、`GITHUB_SECRETS_SETUP.md` を参照して設定

#### エラー2: "Vercel authentication failed" または "Invalid token"

**原因**: Vercel Tokenが無効または権限が不足している

**解決方法**:
1. [Vercel Dashboard - Tokens](https://vercel.com/account/tokens) にアクセス
2. 新しいトークンを作成
3. スコープを「Full Account Access」に設定
4. GitHub Secretsの `VERCEL_TOKEN` を更新

#### エラー3: "Build failed" または "npm ci failed"

**原因**: 依存関係のインストールエラー

**解決方法**:
1. ローカルで以下を実行して確認：
   ```bash
   npm ci
   npm run build
   ```
2. `package-lock.json` が最新か確認
3. Node.jsのバージョンが20以上か確認

#### エラー4: "Lint failed" または "Type check failed"

**原因**: コードにLintエラーまたは型エラーがある

**解決方法**:
1. ローカルで以下を実行：
   ```bash
   npm run lint
   npx tsc --noEmit
   ```
2. エラーを修正
3. コミット・プッシュ

#### エラー5: "Project not found" または "Organization not found"

**原因**: Vercel Project IDまたはOrganization IDが間違っている

**解決方法**:
1. `.vercel/project.json` を確認
2. 正しいIDをGitHub Secretsに設定
3. または、`npx vercel link` を再実行

## ログの見方

### 成功したステップ
- 緑のチェックマーク（✓）が表示される
- ログに "Success" や "Completed" と表示される

### 失敗したステップ
- 赤い×マーク（✗）が表示される
- ログにエラーメッセージが表示される
- エラーメッセージの最後の数行を確認

### 実行中のステップ
- 黄色の円（○）が表示される
- ログがリアルタイムで更新される

## デバッグのコツ

1. **最初の失敗したステップを確認**: 最初に失敗したステップが根本原因のことが多い
2. **エラーメッセージの全文を読む**: エラーメッセージには解決のヒントが含まれている
3. **ローカルで再現**: 同じコマンドをローカルで実行してエラーを再現
4. **ワークフローファイルを確認**: YAMLの構文エラーがないか確認

## よくある質問

### Q: ワークフローが実行されない

A: 以下を確認：
- GitHub Secretsが設定されているか
- ワークフローファイルの構文が正しいか
- ブランチが正しいか（`main` または `develop`）

### Q: デプロイが失敗するが、テストは成功する

A: Vercel関連のSecretsが正しく設定されているか確認：
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Q: ローカルでは成功するが、GitHub Actionsで失敗する

A: 以下を確認：
- Node.jsのバージョンが一致しているか（ワークフローでは20を使用）
- 環境変数が設定されているか
- キャッシュの問題（Actionsのキャッシュをクリア）

## サポート

問題が解決しない場合：
1. エラーログの全文を確認
2. ローカルで同じコマンドを実行して再現
3. GitHub Actionsのドキュメントを確認
4. Vercelのドキュメントを確認
