# Porterra MVP

旅先をシェアし、他ユーザーが「場所」と「写真」を見られるサービスです。

## 機能（MVP）

- ユーザー登録 / ログイン / ログアウト
- 投稿作成
- 写真アップロード（複数可）
- 場所名の入力（都道府県・国）
- コメント本文
- 投稿一覧
- 投稿詳細
- 他ユーザー投稿の閲覧
- いいね

## 位置情報の扱い

- 投稿時に画像EXIFのGPS情報があれば、それを `spots.lat/lng` に保存
- EXIFにGPSがない場合は、場所名（場所名/都道府県/国）から推定して保存

## 技術方針（画像データ）

- 画像ファイル本体: Cloudinary
- 投稿データ: PostgreSQL（Prisma）
- 画像URLのみを `post_images` テーブルに保存

## DBテーブル（Prisma）

- `users`
- `posts`
- `post_images`
- `spots`
- `likes`
- `sessions`

## セットアップ

1. 環境変数を作成

```bash
cp .env.example .env
```

2. `.env` を更新

- `DATABASE_URL`
- `AUTH_SECRET`（`openssl rand -base64 32` などで生成）
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`（任意）

3. Prisma Client生成

```bash
npm run prisma:generate
```

4. スキーマ反映

```bash
npm run prisma:push
```

5. 開発サーバー起動

```bash
npm run dev
```

## Prisma関連コマンド

- `npm run prisma:generate`
- `npm run prisma:push`
- `npm run prisma:migrate`

## 主なファイル

- `auth.ts`: Auth.js設定（Credentials）
- `prisma.config.ts`: Prisma 7 datasource設定
- `prisma/schema.prisma`: PostgreSQLスキーマ
- `lib/prisma.ts`: Prisma Client
- `lib/db.ts`: DBアクセス層
- `lib/cloudinary.ts`: Cloudinaryアップロード
- `lib/auth.ts`: 認証処理
- `app/actions.ts`: Server Actions
