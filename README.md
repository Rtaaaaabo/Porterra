# Porterra MVP

旅先をシェアし、他ユーザーが「場所」と「写真」を見られるサービスの最小実装です。

## 機能（MVP）

- ユーザー登録 / ログイン / ログアウト
- 投稿作成
- 写真アップロード（複数可）
- 場所名の入力（都道府県・国・緯度経度も任意入力）
- コメント本文
- 投稿一覧
- 投稿詳細
- 他ユーザー投稿の閲覧
- いいね

## 技術方針（画像データ）

- 画像ファイル本体: `public/uploads`（Storage相当）
- 投稿データ: `data/db.json`（DB相当）
- 画像URLのみを `post_images` 相当データとして保存

## DBイメージ（実装上のJSONテーブル）

- `users`
- `posts`
- `postImages` (`post_images` 相当)
- `spots`
- `likes`
- `sessions`（ログインセッション用）

### `posts`

- `title`
- `body`
- `userId`
- `spotId`
- `createdAt`

### `spots`

- `name`
- `prefecture`
- `country`
- `lat`
- `lng`

## 起動方法

```bash
npm run dev
```

`http://localhost:3000` を開いて利用してください。

## 主なファイル

- `app/page.tsx`: 投稿一覧
- `app/posts/new/page.tsx`: 投稿作成
- `app/posts/[id]/page.tsx`: 投稿詳細
- `app/login/page.tsx`: ログイン
- `app/register/page.tsx`: 新規登録
- `app/actions.ts`: Server Actions（認証・投稿・いいね）
- `lib/auth.ts`: 認証処理
- `lib/db.ts`: DB相当アクセス層
- `data/db.json`: 永続データ
