# Porterra MVP

旅先をシェアし、他ユーザーが「場所」と「写真」を見られるサービスです。

## 機能（MVP）

- ユーザー登録 / ログイン / ログアウト
- 投稿作成
- 写真アップロード（複数可）
- 場所情報の自動補完（写真GPS + Map API）
- コメント本文
- 投稿一覧
- 投稿詳細
- 他ユーザー投稿の閲覧
- いいね
- 投稿マップ（クラスタ表示）
- 投稿公開範囲（自分のみ/カスタム・友達のみ・全員）

## 位置情報の扱い

- 投稿時に画像EXIFのGPS情報があれば、それを `spots.lat/lng` に保存
- GPSが取れた場合は、Map API（Nominatim reverse geocoding）で場所名/都道府県/国を補完
- GPSが取れない場合は `不明な場所` として保存

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
- `post_visibility_accesses`
- `friendships`

## セットアップ

1. 環境変数を作成

```bash
cp .env.example .env
```

2. `.env` を更新

- `DATABASE_URL`
  - `sslmode=require` / `prefer` / `verify-ca` を使っている場合は、`sslmode=verify-full` を推奨（本プロジェクト内でも自動補正）
  - 互換モードを使いたい場合は `uselibpqcompat=true&sslmode=require` を指定
- `AUTH_SECRET`（`openssl rand -base64 32` などで生成）
- `PRODUCTION_ACCESS_RESTRICT`（本番アクセス制限を有効化するなら `true`）
- `PRODUCTION_ALLOWED_EMAILS`（許可メールを`,`区切りで指定。例: `admin@example.com,owner@example.com`）
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`（任意）
- `CLOUDINARY_UPLOAD_MAX_WIDTH`（任意, 既定: `1920`）
- `CLOUDINARY_UPLOAD_MAX_HEIGHT`（任意, 既定: `1920`）
- `CLOUDINARY_UPLOAD_QUALITY`（任意, 既定: `auto:good`）

### 画像アップロードのコスト最適化

- 投稿時アップロードで `c_limit` 変換を適用し、指定サイズを超える画像だけ自動縮小します。
- 既定は `1920x1920` / `q_auto:good` です（小さい画像はそのまま）。
- 配信時は `f_auto,q_auto` を付けたURLを返すため、閲覧時の転送量も抑えます。

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
- `proxy.ts`: 本番アクセス制限（Next.js 16 Proxy）
- `prisma.config.ts`: Prisma 7 datasource設定
- `prisma/schema.prisma`: PostgreSQLスキーマ
- `lib/prisma.ts`: Prisma Client
- `lib/db.ts`: DBアクセス層
- `lib/cloudinary.ts`: Cloudinaryアップロード
- `lib/auth.ts`: 認証処理
- `lib/access-control.ts`: 本番アクセス制限ロジック
- `app/actions.ts`: Server Actions

## 本番アクセス制限

本番環境で `PRODUCTION_ACCESS_RESTRICT=true` の場合、`PRODUCTION_ALLOWED_EMAILS` に含まれるメールアドレスのみアクセス可能になります。

- 未ログインユーザーは `/login` にリダイレクト
- 許可されていないメールはログイン/登録不可
- `PRODUCTION_ALLOWED_EMAILS` が空のまま有効化した場合は、全員アクセス不可になります
