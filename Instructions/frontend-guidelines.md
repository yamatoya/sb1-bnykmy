# フロントエンドガイドライン

## 1. コーディング規約

### 1.1 ファイル構成

- 1ファイル1コンポーネントの原則を守る
- コンポーネントは機能単位で分割する
- ユーティリティ関数は専用ディレクトリに配置
- スタイルは共通のものを分離

```
src/
  ├── components/     # Vueコンポーネント
  ├── utils/         # ユーティリティ関数
  ├── styles/        # グローバルスタイル
  └── main.js        # エントリーポイント
```

### 1.2 命名規則

- コンポーネント: PascalCase (例: `TweetList.vue`)
- メソッド/変数: camelCase (例: `getUserData`)
- CSS クラス: kebab-case (例: `tweet-container`)
- 定数: SNAKE_CASE (例: `MAX_ITEMS`)

### 1.3 コンポーネント構造

```vue
<template>
  <!-- テンプレートは1つのルート要素 -->
  <div class="component-name">
    <!-- 内容 -->
  </div>
</template>

<script>
// Composition API形式で記述
export default {
  name: 'ComponentName',
  props: {
    // プロパティ定義
  },
  setup(props) {
    // ロジック
    return {
      // 公開する変数/メソッド
    }
  }
}
</script>

<style scoped>
/* スコープ付きCSS */
</style>
```

## 2. コンポーネント設計

### 2.1 責務の分離

- プレゼンテーショナルコンポーネント
  - UIのみを担当
  - データの取得・更新は行わない
  - propsとemitのみで通信

- コンテナコンポーネント
  - データの取得・更新を担当
  - 子コンポーネントにデータを渡す
  - ビジネスロジックを含む

### 2.2 Props

- 型定義を必ず行う
- デフォルト値を設定
- バリデーションを追加

```javascript
props: {
  items: {
    type: Array,
    required: true,
    validator: items => items.length > 0
  }
}
```

### 2.3 イベント

- 命名は動詞から始める
- カスタムイベントは明示的に定義
- ペイロードは必要最小限に

```javascript
emits: ['updateItem', 'deleteItem'],
setup(props, { emit }) {
  const handleUpdate = (item) => {
    emit('updateItem', item)
  }
}
```

## 3. スタイリング

### 3.1 CSS設計

- BEMベースの命名規則
  - Block: 独立したコンポーネント
  - Element: コンポーネントの一部
  - Modifier: バリエーション

```css
.tweet-card { /* Block */ }
.tweet-card__header { /* Element */ }
.tweet-card--highlighted { /* Modifier */ }
```

### 3.2 レスポンシブデザイン

- モバイルファーストアプローチ
- ブレークポイント
  - モバイル: 〜767px
  - タブレット: 768px〜1199px
  - デスクトップ: 1200px〜

```css
/* モバイル（デフォルト） */
.container {
  width: 100%;
}

/* タブレット */
@media (min-width: 768px) {
  .container {
    width: 750px;
  }
}

/* デスクトップ */
@media (min-width: 1200px) {
  .container {
    width: 1170px;
  }
}
```

## 4. パフォーマンス最適化

### 4.1 コンポーネント最適化

- `v-show` vs `v-if`の適切な使用
- 重い処理は`computed`プロパティを使用
- 大きなリストには`v-virtual-scroll`を検討

### 4.2 データ管理

- ローカルストレージの使用を最小限に
- 必要なデータのみを保存
- 定期的なクリーンアップ

## 5. エラーハンドリング

### 5.1 エラー表示

- ユーザーフレンドリーなメッセージ
- エラーの種類に応じた表示
- リカバリー方法の提示

```javascript
try {
  await saveData()
} catch (error) {
  showErrorMessage({
    title: 'エラーが発生しました',
    message: error.message,
    action: '再試行'
  })
}
```

### 5.2 バリデーション

- 入力値の検証
- フォーマットチェック
- 必須項目の確認

```javascript
const validateInput = (value) => {
  if (!value) {
    return '入力は必須です'
  }
  if (value.length < 3) {
    return '3文字以上入力してください'
  }
  return ''
}
```

## 6. テスト

### 6.1 単体テスト

- コンポーネントの独立したテスト
- プロップスとイベントのテスト
- エッジケースの考慮

```javascript
import { mount } from '@vue/test-utils'
import MyComponent from './MyComponent.vue'

test('コンポーネントのマウント', () => {
  const wrapper = mount(MyComponent)
  expect(wrapper.exists()).toBe(true)
})
```

### 6.2 インテグレーションテスト

- コンポーネント間の連携テスト
- ルーティングのテスト
- データフローのテスト

## 7. アクセシビリティ

### 7.1 基本対応

- 適切なHTML要素の使用
- ARIA属性の追加
- キーボード操作対応

```html
<button
  aria-label="閉じる"
  @click="close"
  @keyup.enter="close"
>
  <i class="fas fa-times"></i>
</button>
```

### 7.2 フォーカス管理

- フォーカスの可視化
- フォーカストラップ
- フォーカスの移動

```css
:focus {
  outline: 2px solid #1da1f2;
  outline-offset: 2px;
}
```

## 8. セキュリティ

### 8.1 XSS対策

- テンプレートのエスケープ
- ユーザー入力の検証
- CSPの設定

### 8.2 データ保護

- センシティブデータの暗号化
- セッション管理
- CORS設定