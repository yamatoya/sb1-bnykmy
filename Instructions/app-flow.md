# アプリケーションフロー

## 1. メインフロー

### 1.1 文書一覧画面 (Index.vue)

```mermaid
graph TD
    A[文書一覧画面] --> B{アクション選択}
    B -->|文書選択| C[文書詳細画面]
    B -->|検索| D[検索結果表示]
    B -->|リスト一覧| E[リスト一覧画面]
    B -->|パブコメ追加| F[パブコメ編集画面]
    B -->|JSONダウンロード| G[JSONファイル]
    B -->|データリセット| H[初期データ復元]
```

### 1.2 文書詳細画面 (Document.vue)

```mermaid
graph TD
    A[文書詳細画面] --> B{アクション選択}
    B -->|ツイート選択| C[ツイート詳細画面]
    B -->|検索| D[検索結果表示]
    B -->|戻る| E[文書一覧画面]
```

### 1.3 ツイート詳細画面 (Tweet.vue)

```mermaid
graph TD
    A[ツイート詳細画面] --> B{アクション選択}
    B -->|URL共有| C[URLコピー]
    B -->|関連リンク追加| D[リンクエディタ]
    B -->|改訂履歴追加| E[改訂セレクタ]
    B -->|関連ツイート追加| F[ツイートセレクタ]
    B -->|戻る| G[文書詳細画面]
```

## 2. リスト管理フロー

### 2.1 リスト一覧画面 (Lists.vue)

```mermaid
graph TD
    A[リスト一覧画面] --> B{アクション選択}
    B -->|新規作成| C[リストエディタ]
    B -->|リスト選択| D[リスト詳細画面]
    B -->|リスト編集| E[リストエディタ]
    B -->|リスト削除| F[削除確認]
    B -->|戻る| G[文書一覧画面]
```

### 2.2 リスト詳細画面 (ListDetail.vue)

```mermaid
graph TD
    A[リスト詳細画面] --> B{アクション選択}
    B -->|ツイート選択| C[ツイート詳細画面]
    B -->|コメント追加| D[コメント入力]
    B -->|戻る| E[リスト一覧画面]
```

## 3. 改訂履歴フロー

### 3.1 改訂一覧画面 (RevisionPage.vue)

```mermaid
graph TD
    A[改訂一覧画面] --> B{アクション選択}
    B -->|新規追加| C[改訂エディタ]
    B -->|改訂選択| D[改訂詳細画面]
    B -->|改訂編集| E[改訂エディタ]
    B -->|改訂削除| F[削除確認]
    B -->|戻る| G[文書詳細画面]
```

### 3.2 改訂詳細画面 (RevisionDetail.vue)

```mermaid
graph TD
    A[改訂詳細画面] --> B{アクション選択}
    B -->|コメント追加| C[コメント入力]
    B -->|パブコメ参照| D[パブコメ詳細画面]
    B -->|戻る| E[改訂一覧画面]
```

## 4. データフロー

### 4.1 ローカルストレージ

```mermaid
graph TD
    A[アプリケーション] -->|読み込み| B[LocalStorage]
    A -->|保存| B
    B -->|バックアップ| C[JSONファイル]
    C -->|リストア| B
```

### 4.2 状態管理

```mermaid
graph TD
    A[コンポーネント] -->|データ取得| B[LocalStorage]
    A -->|データ更新| C[一時データ]
    C -->|保存| B
```

## 5. エラーハンドリング

### 5.1 データ操作エラー

```mermaid
graph TD
    A[データ操作] --> B{エラー発生}
    B -->|保存エラー| C[エラーメッセージ表示]
    B -->|読み込みエラー| D[初期データ使用]
    B -->|JSON解析エラー| E[エラーログ出力]
```

### 5.2 ナビゲーションエラー

```mermaid
graph TD
    A[ページ遷移] --> B{エラー発生}
    B -->|404エラー| C[404ページ表示]
    B -->|パラメータ不正| D[一覧画面へリダイレクト]
    B -->|その他エラー| E[エラーページ表示]
```

## 6. レスポンシブ対応

### 6.1 画面サイズ別レイアウト

```mermaid
graph TD
    A[画面サイズ検出] --> B{サイズ判定}
    B -->|デスクトップ| C[グリッドレイアウト]
    B -->|タブレット| D[2カラムレイアウト]
    B -->|モバイル| E[シングルカラム]
```

### 6.2 インタラクション

```mermaid
graph TD
    A[ユーザー操作] --> B{デバイス判定}
    B -->|タッチデバイス| C[タッチ操作最適化]
    B -->|マウス操作| D[ホバーエフェクト]
    B -->|キーボード| E[フォーカス制御]
```