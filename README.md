# LINE ミニアプリ（イベント予約・受付・履歴管理）

- This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 概要
本プロジェクトは、**LINE ミニアプリ（LIFF）を利用した最小構成のイベント管理システム**です。  
目的は、以下の技術・連携の理解と検証です。

- LINE ミニアプリ（LIFF）
- Next.js（App Router）
- Prisma + PostgreSQL（Supabase）
- Google Cloud Run
- 予約 → 当日受付 → 参加履歴 という一連の流れ

UI は最小限とし、**機能検証を優先**しています。

---

## システム構成

### フロントエンド
- Next.js（App Router）
- LINE 内ブラウザ／スマートフォン利用を前提
- UI は後続タスクで最適化予定

### バックエンド
- Next.js Route Handlers
- Server Actions（管理者操作・ワンタップ操作）
- Prisma ORM

### データベース
- PostgreSQL（Supabase）
- Prisma schema による管理

### デプロイ
- Google Cloud Run
- `output: "standalone"`
- `gcloud run deploy --source .` による **既存サービス更新**

---

## データモデル

### Event
| フィールド | 内容 |
|---|---|
| id | イベントID |
| title | イベント名 |
| date | 開催日時（表示用） |
| deadline | 申込締切 |
| place | 開催場所 |
| fee | 参加費 |
| memo | 補足 |
| isActive | 現在イベント判定 |

### Rsvp
| フィールド | 内容 |
|---|---|
| userId | LINEユーザーID |
| displayName | 表示名 |
| status | `join`（参加） / `absent`（欠席） |
| comment | コメント |
| checkedInAt | 当日受付時刻（管理者操作） |
| eventId | 紐づくイベント |
| createdAt / updatedAt | 管理用 |

---

## 実装済み機能

### ユーザー側

#### 出欠登録（ワンタップ）
- URL: `/line-app`
- フォームなし
- 「参加」「欠席」ボタンで即時反映

#### 参加履歴表示
- URL: `/line-app/history`
- 過去イベント一覧表示
- 出欠状況・受付済み／未受付を確認可能

---

### 管理者側

#### 管理ダッシュボード
- URL: `/line-app/admin`
- `ADMIN_USER_ID` による管理者ガード

#### 参加者一覧
- イベントごとの参加者リスト表示
- 出欠状況の確認

#### 当日受付（管理者操作）
- 参加者行ごとに「受付」ボタン
- 押下で `checkedInAt` をセット
- 受付済み時刻表示
- 「取消」ボタンで受付解除（テスト・誤操作対応）

※ 当初は「参加者セルフ受付」も検討したが、  
**実運用では管理者操作が適切**と判断し管理画面側に実装。

---

## API 構成（主要）

### ユーザー向け
- `GET /api/me/reservations/current`
- `PATCH /api/me/reservations/current`
- `GET /api/me/history`

### 管理者向け
- Server Actions（受付／取消）
- 管理画面経由のみ実行

---

## デプロイ・運用

### Cloud Run
- 既存サービスへの **アップデートデプロイ**
- 実行ディレクトリは **プロジェクト直下**
  - `app/line-app` 配下で deploy するとビルド失敗する点に注意

### 環境変数（例）
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `LINE_CLIENT_ID`
- `LINE_CLIENT_SECRET`
- `NEXTAUTH_GOOGLE_CLIENT_ID` ※管理画面Googleログイン用（旧: `GOOGLE_CLIENT_ID`）
- `NEXTAUTH_GOOGLE_CLIENT_SECRET` ※管理画面Googleログイン用（旧: `GOOGLE_CLIENT_SECRET`）
- `GCAL_OAUTH_CLIENT_ID` ※Google Calendar同期OAuth用（旧: `GCAL_CLIENT_ID`）
- `GCAL_OAUTH_CLIENT_SECRET` ※Google Calendar同期OAuth用（旧: `GCAL_CLIENT_SECRET`）
- `GCAL_OAUTH_REDIRECT_URI` ※Google Calendar同期OAuth用（旧: `GOOGLE_REDIRECT_URI`）
- `GCAL_SYNC_EMAIL` ※同期対象アカウント
- `GCAL_CALENDAR_ID` ※同期対象カレンダー（通常 `primary`）
- `ADMIN_USER_ID` ※LINE User ID（カンマ区切りで複数指定可）
- `ADMIN_USER_EMAILS` ※Google認証用（カンマ区切りで複数指定可）
- `NOTICE_EDITOR_USER_IDS` ※LINE User ID（カンマ区切りで複数指定可）
- `NOTICE_EDITOR_EMAILS` ※Google認証用（カンマ区切りで複数指定可）

---

## 認証システム

### LINE 認証
- LINE ミニアプリユーザー向けの認証
- LINE User ID で識別
- `session.user.id` に LINE User ID が格納される

### Google 認証（管理者向け）
- 管理画面へのアクセス用
- メールアドレスで識別
- `session.user.email` に Google Email が格納される

### 権限管理（環境変数方式）

#### 管理者権限
- **LINE**: `ADMIN_USER_ID` にカンマ区切りでLINE User IDを記載
- **Google**: `ADMIN_USER_EMAILS` にカンマ区切りでメールアドレスを記載
- 両方の認証方式で管理者としてログイン可能

#### 通知編集権限
- **LINE**: `NOTICE_EDITOR_USER_IDS` にカンマ区切りでLINE User IDを記載
- **Google**: `NOTICE_EDITOR_EMAILS` にカンマ区切りでメールアドレスを記載
- 管理者は自動的に通知編集権限も持つ

### 権限チェック
- `app/_lib/auth-utils.ts` に集約
- `isAdmin(session)`: 管理者かどうかを判定
- `canEditNotice(session)`: 通知編集権限を持つかを判定

---

## 確認状況
- Cloud Run へ反映済み
- スマートフォン（LINE 内ブラウザ）で動作確認済み
- 意図した機能はすべて動作確認完了
- UI 最適化は後続タスクとして分離

## Google カレンダー連携（追加）

### 目的
- **既存のイベント管理を Google カレンダー起点に集約**
- 管理者が Google カレンダーでイベントを管理し、
  LINE ミニアプリ側へ **手動同期**で反映する運用を想定

※ カレンダー更新頻度が低いため、自動同期は行わず  
**管理者操作による明示的同期**を採用。

---

## Google カレンダー連携の設計方針

### 方針
- Google カレンダー → Event テーブルへ **一方向同期**
- Event は **Google カレンダーを正**とする
- 同期は「開始日〜終了日」を指定して実行
- 同期単位は **1か月想定**

---

## データモデル変更（Event）

### Event（更新後）
| フィールド | 内容 |
|---|---|
| id | イベントID |
| title | イベント名 |
| date | 開始日時（Google Calendar start） |
| endAt | 終了日時（Google Calendar end / optional） |
| deadline | 申込締切（optional） |
| place | 開催場所（optional） |
| fee | 参加費（optional） |
| memo | 補足 |
| isActive | 現在イベント判定 |
| gcalEventId | Google カレンダーの event.id（unique） |
| gcalUpdatedAt | Google カレンダー側の最終更新日時 |

※ `date = 開始日時`, `endAt = 終了日時` として扱う。

---

## Google 認証情報管理

### GoogleAuth テーブル
- Google OAuth の `refresh_token` を保存
- 同期時は **設定ファイル（環境変数）で指定した email** に対応する
  Google アカウントを利用

---

## 同期API

### Google カレンダー同期
- エンドポイント  


## 今後の拡張予定

- プロフィール編集機能
- 複数イベント対応
- 管理者権限の複数化
- QRコードによる受付
- 操作ログ（誰が受付したか）



## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
