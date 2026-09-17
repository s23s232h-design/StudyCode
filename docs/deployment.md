# デプロイ手順・公開前チェック

Vercelへの公開を想定した手順です。設定ファイルの追加だけでは公開されません。以下の設定と公開URLでの動作確認を終えてから、ポートフォリオとして案内します。

## 1. ローカルで確認

```bash
npm ci
npm run check
npm audit --omit=dev
npm run preview
```

- Node.jsは24.xを使用します（`.nvmrc`、`package.json`に記載）。
- `check`はESLintと本番ビルドです。認証・DBへの保存を検証するE2Eテストではありません。
- `dist`と実際の環境変数ファイルはコミットしません。
- READMEのスクリーンショットはローカルの実画面を撮影したもので、表示データはサンプルです。

## 2. Vercelに設定

1. GitHubのStudyCodeリポジトリをインポートします。
2. 公開するブランチを明示的に選びます。`release-prep`から公開する場合はProduction Branchも`release-prep`に設定します。
3. Root Directoryはリポジトリ直下、Node.jsは24.xを使用します。
4. 次の環境変数をProductionに登録します。Previewでも動かす場合はPreview側にも設定します。

| 環境変数 | 値 |
| --- | --- |
| `VITE_SUPABASE_URL` | 接続先SupabaseプロジェクトのURL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | 同じプロジェクトのPublishable key |

ビルド設定は`vercel.json`で指定しています。

| 項目 | 設定 |
| --- | --- |
| Framework | Vite |
| Install Command | `npm ci` |
| Build Command | `npm run check` |
| Output Directory | `dist` |
| SPAのリライト | `/(.*)` → `/index.html` |

`BrowserRouter`を使用するため、リライトがないホスティングでは投稿詳細などを直接開くと404になることがあります。[VercelのVite / SPA設定](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas)

環境変数はビルド時に埋め込まれます。変更後は再デプロイしてください。管理用のSecret keyや`service_role`キーはフロントエンドに設定しません。

Previewから本番用Supabaseに接続した場合、保存・削除は本番データにも反映されます。検証用データまたは別プロジェクトを用意してください。

## 3. Supabaseの認証設定

- AuthenticationのURL Configurationで、Site URLを実際の公開URLに設定します。
- Redirect URLsには、必要な本番URL・ローカルURL・検証用URLを登録します。本番では必要なURLに限定します。
- 現在の新規登録は`emailRedirectTo`を明示していないため、確認メールの戻り先にはSite URLが使用されます。ローカルURLを許可リストに追加しただけでは戻り先は切り替わりません。
- アプリの登録完了メッセージはメール確認を前提としています。メール確認設定、送信方法・送信制限を確認し、公開対象のメールアドレスへ実際に確認メールが届くことをテストします。
- Supabase標準のメール送信はプロジェクトのチームメンバー宛てに制限されています。一般ユーザーの新規登録を公開する場合はカスタムSMTPを設定します。現在の送信設定・到達性は今回の確認対象外のため、公開前に確認が必要です。

参考：[Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)、[メール送信の設定](https://supabase.com/docs/guides/auth/auth-smtp)

## Supabaseの前提

既存プロジェクトの構成を利用します。この作業ではDB・RLS・Storage Policyを変更していません。以下はアプリが参照する主なテーブル・カラムの一覧で、DBを自動構築するSQLではありません。

| テーブル | 主なカラム・役割 |
| --- | --- |
| `profiles` | `id`, `username`, `introduction`, `avatar_url` |
| `posts` | `id`, `user_id`, `term`, `explanation`, `created_at`, `edited_at`, `quoted_post_id`, `quote_comment`, `deleted_at` |
| `likes` | `id`, `user_id`, `post_id` |
| `reposts` | `id`, `user_id`, `post_id`, `created_at` |
| `replies` | `id`, `user_id`, `post_id`, `content`, `created_at` |
| `study_times` | `id`, `user_id`, `study_date`, `seconds`。`user_id,study_date`をキーにupsert |
| `materials` | `id`, `user_id`, `name` |
| `portfolios` | `id`, `user_id`, `title`, `url` |

投稿者情報などのネスト取得に使う外部キーと、重複を防ぐ制約も必要です。新規環境を構築する場合は既存環境の定義を確認してください。npmのインストールではこれらは作成されません。

### アクセス制御と画像

- 上記8テーブルでRLSを有効にし、本人の書き込みだけを許可します。
- 投稿・プロフィール・学習記録などの読み取りは公開設定です。登録内容を非公開データとして扱わないでください。
- Storageに公開バケット`avatars`を用意し、画像は`ユーザーID/avatar`に保存します。
- 画像は5MiB以下の画像ファイルをアプリ側で受け付けます。上書き保存には本人フォルダのSELECT・INSERT・UPDATE、削除にはDELETEのStorage Policyが必要です。[Storageのアクセス制御](https://supabase.com/docs/guides/storage/security/access-control)
- 公開バケットの画像URLはログインせず閲覧可能です。

## 4. 公開前に実施した確認

2026-09-17時点の確認です。将来の変更後も再確認してください。

- [x] 実装と照合してREADMEを日本語で整備
- [x] 本番用環境変数の記入例とSPAの配信設定を追加
- [x] `npm run check`成功（ESLintエラー・警告0件、本番ビルド成功）
- [x] Edgeで本番ビルドの8画面をPC・スマートフォン幅／ライト・ダークで確認（32項目）
- [x] タイマーの停止・再開・復元・画面移動・記録成功／失敗、モーダルとフォームのキーボード操作を確認
- [x] 環境変数の設定漏れ検出、画像パス、環境ファイルのGit除外を確認
- [x] 公開テーブル8件のRLS有効化と、本人に限定した書き込みポリシーを読み取りで確認
- [x] `avatars`の本人フォルダに対するSELECT・INSERT・UPDATE・DELETEポリシーを読み取りで確認
- [x] 本番依存関係の監査（`npm audit --omit=dev`）で脆弱性0件

RLSの定義確認は、別ユーザーとして不正な更新を試す実機検証の代わりにはなりません。次の項目は公開先で確認します。

上記のブラウザ確認はSupabase応答をモックにしたローカルテストです。実データへの書き込みや、Vercel上の動作・認証メールの到達性は検証していません。タイマーは画面移動時のinterval解除を修正し、既存の保存処理を維持しています。

## 5. 公開URLでの最終確認

- [ ] HTTPSの公開URLでホームが表示され、ConsoleやNetworkに予期しないエラーがない
- [ ] `/search`、`/profile`、`/timer`、実在する`/posts/:postId`、`/users/:userId`を直接開く・再読み込みする
- [ ] 未ログインでも投稿を閲覧でき、投稿・リアクションにはログインが必要
- [ ] 新規登録メールが届き、リンクから本番へ戻ってログイン・ログアウトできる
- [ ] プロフィールの名前・画像変更がヘッダー・投稿・引用元・リポスト表示へ即時反映される
- [ ] 画像の初回アップロードと同じパスへの上書きが成功する
- [ ] 通常投稿の追加・編集・検索、いいね・リポストの追加と解除が反映される
- [ ] 引用元を削除しても、引用側のコメント・元の投稿者と日時が残り、削除済み本文が表示されない
- [ ] 投稿詳細で返信の追加・自分の返信の削除ができる
- [ ] 学習時間の記録と教材・ポートフォリオの登録・削除ができる
- [ ] 別のテストユーザーで他人の投稿・返信・プロフィール・画像を書き換えられない
- [ ] スマートフォン幅、キーボード操作、ライト・ダーク表示で内容が読める
- [ ] 公開してよいデータだけが登録されていることを確認し、READMEに実際の公開URLを追記する

## 現時点の制約

- 投稿は一括取得し、検索もブラウザ側で行います。ホーム表示は最新10件でも、取得件数を10件に制限する実装ではありません。件数増加時は取得・検索のページネーションを検討します。
- 未記録のタイマーはブラウザのlocalStorageで保持し、ユーザー別には分けていません。同じブラウザでアカウントを切り替える場合は記録・リセットしてから切り替えます。
- 学習時間の加算は読み取り後に保存するため、複数タブ・端末から同時に記録する用途には対応していません。
- 現在、パスワード再設定・通知・フォロー・ブックマークの画面はありません。
