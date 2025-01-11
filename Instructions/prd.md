# 法律文書管理システム PRD

## 概要

法律文書を効率的に管理・閲覧するためのWebアプリケーション。法律文書をTwitterライクなインターフェースで表示し、改訂履歴の管理やパブリックコメントの追加、関連文書のリンク付けなどの機能を提供する。

## 目的

- 法律文書の閲覧性向上
- 改訂履歴の効率的な管理
- パブリックコメントの整理と関連付け
- 文書間の関連性の可視化

## 主要機能

### 1. 文書管理

- 文書一覧表示
- 全文検索機能
- 文書の詳細表示（Twitterライクなインターフェース）
- JSONデータのダウンロード/リセット機能

### 2. 改訂履歴管理

- 改訂履歴の追加・編集・削除
- 改訂前後の差分表示
- 改訂に関するコメント機能
- パブリックコメントとの関連付け

### 3. パブリックコメント管理

- パブリックコメントの追加・編集
- 質問と回答の表示
- 関連する法律文書へのリンク付け
- 原文URLの保存

### 4. リスト機能

- カスタムリストの作成・編集・削除
- リストへの文書の追加・削除
- リスト内文書の並び替え
- リスト内文書へのコメント機能

### 5. リンク機能

- 文書間の相互リンク
- リンクテキストのカスタマイズ
- リンク先プレビュー表示
- リンクの追加・削除

## 技術要件

### フロントエンド

- Vue.js 3.x
- Vite
- Vue Router
- モバイルファーストのレスポンシブデザイン

### データ管理

- ローカルストレージを使用したデータ永続化
- JSONベースのデータ構造
- データのバックアップ/リストア機能

### デプロイメント

- GitHub Pagesへの自動デプロイ
- SPA対応の404ページ設定

## UI/UX要件

### デザイン

- クリーンでモダンなインターフェース
- Twitterライクなカード型レイアウト
- 直感的な操作性
- ダークモード非対応

### レスポンシブ対応

- デスクトップ（1200px以上）
- タブレット（768px-1199px）
- モバイル（767px以下）

### アクセシビリティ

- キーボード操作対応
- スクリーンリーダー対応
- 適切なコントラスト比
- フォントサイズの調整

## データ構造

### 文書データ

```json
{
  "accountId": "string",
  "displayName": "string",
  "tweets": [
    {
      "id": "string",
      "index": "string",
      "content": "string",
      "links": [
        {
          "text": "string",
          "url": "string"
        }
      ]
    }
  ]
}
```

### パブリックコメント

```json
{
  "accountId": "string",
  "displayName": "string",
  "url": "string",
  "public_comment": true,
  "questions": [
    {
      "id": "string",
      "index": "string",
      "question": "string",
      "answer": "string"
    }
  ]
}
```

### 改訂履歴

```json
{
  "id": "string",
  "title": "string",
  "date": "string",
  "description": "string",
  "sourceUrl": "string",
  "articles": [
    {
      "id": "string",
      "status": "改正" | "新設" | "削除",
      "before": "string",
      "after": "string"
    }
  ]
}
```

### リスト

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "tweets": ["string"],
  "createdAt": "string",
  "updatedAt": "string",
  "tweetComments": {
    "tweetPath": [
      {
        "id": "string",
        "content": "string",
        "date": "string"
      }
    ]
  }
}
```

## 将来の拡張性

### 1. データ管理

- バックエンド連携（Supabase等）
- ユーザー認証
- 複数ユーザーでの共同編集

### 2. 機能拡張

- ダークモード対応
- 多言語対応
- ファイルのインポート/エクスポート
- 文書の自動分類

### 3. インテグレーション

- 外部APIとの連携
- 他の法律文書システムとの統合
- ソーシャルメディア共有機能

## 制限事項

- オフライン環境での使用不可
- ローカルストレージの容量制限
- 同時編集非対応
- ファイルアップロード非対応

## URL体系

### メイン機能

- `/`: 文書一覧
- `/document/:id`: 文書詳細
- `/document/:documentId/:tweetId`: ツイート詳細

### 改訂履歴

- `/revisions/:documentId`: 改訂一覧
- `/revisions/:documentId/:revisionId`: 改訂詳細
- `/revisions/:documentId/new`: 新規改訂作成
- `/revisions/:documentId/edit/:revisionId`: 改訂編集

### パブリックコメント

- `/public-comment/new`: パブリックコメント新規作成

### リスト機能

- `/lists`: リスト一覧
- `/lists/new`: 新規リスト作成
- `/lists/:id`: リスト詳細
- `/lists/:id/edit`: リスト編集

### クエリパラメータ

- `q`: 検索クエリ
- `back`: 戻り先URL
- `highlight`: 検索ハイライト用キーワード