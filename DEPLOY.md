# Vercelへのデプロイ手順

このドキュメントでは、動画チェックツールをVercelにデプロイする詳細な手順を説明します。

## 前提条件

- GitHubアカウント
- Vercelアカウント（無料で作成可能）
- Gemini APIキー（[Google AI Studio](https://makersuite.google.com/app/apikey)で取得可能）

## ステップ1: Vercelアカウントの作成

1. [Vercel](https://vercel.com)にアクセス
2. 「Sign Up」をクリック
3. 「Continue with GitHub」を選択してGitHubアカウントでログイン
   - これにより、GitHubリポジトリと自動的に連携できます

## ステップ2: プロジェクトのインポート

1. Vercelダッシュボードにログイン後、「Add New...」→「Project」をクリック
2. GitHubリポジトリ一覧から「Movie-check」を選択
3. 「Import」をクリック

## ステップ3: プロジェクト設定

### 基本設定

- **Framework Preset**: Viteを選択（自動検出される場合があります）
- **Root Directory**: `./`（デフォルト）
- **Build Command**: `npm run build`（自動設定される場合があります）
- **Output Directory**: `dist`（自動設定される場合があります）

### 環境変数の設定（重要）

1. プロジェクト設定画面で「Environment Variables」セクションを探す
2. または、プロジェクト作成後、Settings > Environment Variables に移動

3. 以下の環境変数を追加：

   **変数名**: `GEMINI_API_KEY`
   
   **値**: あなたのGemini APIキー
   
   **環境**: 以下の3つすべてにチェックを入れる
   - ☑ Production（本番環境）
   - ☑ Preview（プレビュー環境）
   - ☑ Development（開発環境）

4. 「Add」または「Save」をクリック

### Gemini APIキーの取得方法

1. [Google AI Studio](https://makersuite.google.com/app/apikey)にアクセス
2. Googleアカウントでログイン
3. 「Create API Key」をクリック
4. プロジェクトを選択（または新規作成）
5. APIキーが生成されるので、コピーしてVercelの環境変数に貼り付け

## ステップ4: デプロイの実行

1. プロジェクト設定が完了したら、「Deploy」ボタンをクリック
2. デプロイが開始されます（通常1-3分程度）
3. デプロイが完了すると、以下のようなURLが表示されます：
   - `https://movie-check-xxxxx.vercel.app`
   - このURLでアプリケーションにアクセスできます

## ステップ5: デプロイの確認

1. デプロイ完了後、表示されたURLにアクセス
2. ファイルをアップロードしてチェック機能が動作するか確認
3. 誤字脱字チェック機能が正常に動作することを確認

## 今後の更新方法

GitHubリポジトリにプッシュすると、自動的にVercelで再デプロイされます：

```bash
git add .
git commit -m "Update"
git push
```

Vercelが自動的に変更を検知して、新しいデプロイを開始します。

## 環境変数の後から追加・変更する方法

1. Vercelダッシュボードでプロジェクトを選択
2. 「Settings」タブをクリック
3. 左側のメニューから「Environment Variables」を選択
4. 既存の変数を編集するか、新しい変数を追加
5. 変更後、再デプロイが必要な場合があります

## トラブルシューティング

### 環境変数が反映されない場合

1. 環境変数を追加/変更した後、手動で再デプロイを実行
   - プロジェクトページの「Deployments」タブから「Redeploy」をクリック
2. 環境変数の環境設定（Production/Preview/Development）を確認
3. 変数名が正確に `GEMINI_API_KEY` になっているか確認（大文字小文字を区別）

### デプロイエラーが発生する場合

1. Vercelダッシュボードの「Deployments」タブでエラーログを確認
2. ビルドログを確認して、エラーの原因を特定
3. よくある原因：
   - 依存関係のインストールエラー
   - ビルドコマンドのエラー
   - 環境変数の設定漏れ

### APIが動作しない場合

1. ブラウザの開発者ツール（F12）でコンソールエラーを確認
2. NetworkタブでAPIリクエストのステータスを確認
3. Vercelの関数ログを確認（プロジェクト > Functions タブ）

## カスタムドメインの設定（オプション）

1. プロジェクトの「Settings」>「Domains」に移動
2. カスタムドメインを追加
3. DNS設定をVercelの指示に従って設定

## 参考リンク

- [Vercel公式ドキュメント](https://vercel.com/docs)
- [Vercel環境変数の設定](https://vercel.com/docs/concepts/projects/environment-variables)
- [Google AI Studio](https://makersuite.google.com/app/apikey)
