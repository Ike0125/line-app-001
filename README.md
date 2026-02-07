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
- `ADMIN_USER_ID`

---

## 確認状況
- Cloud Run へ反映済み
- スマートフォン（LINE 内ブラウザ）で動作確認済み
- 意図した機能はすべて動作確認完了
- UI 最適化は後続タスクとして分離

---

## 今後の拡張予定

- Google カレンダーのイベント取り込み
- プロフィール編集機能
- 複数イベント対応
- 管理者権限の複数化
- QRコードによる受付
- 操作ログ（誰が受付したか）

---

## 次のステップ
次フェーズでは **Google カレンダーのイベントを取り込み、Event テーブルへ反映する仕組み**を実装予定。





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
