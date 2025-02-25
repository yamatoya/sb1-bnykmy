<template>
  <div class="editor-page">
    <header class="page-header">
      <router-link to="/" class="back-link">
        <i class="fas fa-arrow-left"></i>
        <span>戻る</span>
      </router-link>
      <h1>{{ isEditing ? '文書の編集' : '新規文書の作成' }}</h1>
    </header>

    <main class="page-content">
      <form @submit.prevent="saveDocument" class="editor-form">
        <div class="form-group">
          <label>文書名</label>
          <input 
            type="text" 
            v-model="displayName" 
            class="form-control" 
            placeholder="文書名を入力"
            required
          />
        </div>

        <div class="form-group">
          <label>概要</label>
          <textarea 
            v-model="description" 
            class="form-control" 
            rows="3" 
            placeholder="文書の概要を入力"
          ></textarea>
        </div>

        <div class="form-group">
          <label>原文URL</label>
          <input 
            type="url" 
            v-model="url" 
            class="form-control" 
            placeholder="https://..."
          />
        </div>

        <div class="tweets-section">
          <div class="section-header">
            <h2>条文</h2>
            <button type="button" class="add-button" @click="addTweet">
              <i class="fas fa-plus"></i>
              条文を追加
            </button>
          </div>

          <div v-if="tweets.length === 0" class="no-items">
            条文が追加されていません
          </div>

          <div v-else v-for="(tweet, index) in tweets" :key="tweet.id" class="tweet-item">
            <div class="tweet-header">
              <h3>条文 {{ index + 1 }}</h3>
              <button type="button" class="remove-button" @click="removeTweet(index)">
                <i class="fas fa-trash"></i>
              </button>
            </div>

            <div class="tweet-content">
              <div class="form-group">
                <label>インデックス</label>
                <input 
                  type="text" 
                  v-model="tweet.index" 
                  class="form-control"
                  placeholder="例: 第1条"
                  required
                />
              </div>

              <div class="form-group">
                <label>内容</label>
                <div class="input-group">
                  <textarea 
                    v-model="tweet.content" 
                    class="form-control" 
                    rows="4"
                    placeholder="内容を入力（省略可）"
                  ></textarea>
                  <button 
                    type="button" 
                    class="format-button" 
                    @click="formatContent(index)"
                  >
                    <i class="fas fa-magic"></i>
                    フォーマット
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="pre-action-buttons">
          <button type="button" class="add-tweet-button" @click="addTweet">
            <i class="fas fa-plus"></i>
            条文を追加
          </button>
        </div>

        <div class="form-actions">
          <router-link to="/" class="cancel-button">キャンセル</router-link>
          <button type="submit" class="save-button" :disabled="!isValid">保存</button>
        </div>
      </form>
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY = 'legal-documents-data'

export default {
  name: 'DocumentEditor',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const displayName = ref('')
    const tweets = ref([])
    const description = ref('')
    const url = ref('')
    const documentId = ref('')

    const formatContent = (index) => {
      if (tweets.value[index]) {
        let content = tweets.value[index].content || ''
        
        // 基本的なクリーンアップ
        content = content.trim()
        
        // 全角文字の正規化
        content = content.replace(/　/g, ' ')
        content = content.replace(/[！]/g, '!')
        content = content.replace(/[？]/g, '?')
        content = content.replace(/[（]/g, '(')
        content = content.replace(/[）]/g, ')')
        content = content.replace(/[「]/g, '『')
        content = content.replace(/[」]/g, '』')
        
        // スペースの正規化
        content = content.replace(/ +/g, ' ')
        
        // 改行を削除
        content = content.replace(/\r\n|\r|\n/g, '')
        
        // 箇条書きの整形
        content = content.replace(/([①-⑳]|[0-9]+\.)/g, ' $1')
        
        tweets.value[index].content = content
      }
    }

    const isEditing = computed(() => route.params.id !== undefined)

    const isValid = computed(() => {
      return displayName.value && tweets.value.length > 0 && 
             tweets.value.every(tweet => tweet.index)
    })

    const addTweet = () => {
      tweets.value.push({
        id: uuidv4().substring(0, 8),
        index: '',
        content: ''
      })
    }

    const removeTweet = (index) => {
      tweets.value.splice(index, 1)
    }

    const saveDocument = () => {
      const id = documentId.value || uuidv4().substring(0, 8)
      const newDocument = {
        accountId: id,
        displayName: displayName.value,
        description: description.value || null,
        url: url.value || null,
        tweets: tweets.value,
      }

      try {
        const storedData = localStorage.getItem(STORAGE_KEY)
        const documents = storedData ? JSON.parse(storedData) : {}
        documents[id] = newDocument
        localStorage.setItem(STORAGE_KEY, JSON.stringify(documents))
        router.push('/')
      } catch (e) {
        console.error('Failed to save document:', e)
        alert('文書の保存に失敗しました')
      }
    }

    const loadDocument = () => {
      if (!isEditing.value) return

      const id = route.params.id
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          const documents = JSON.parse(storedData)
          const document = documents[id]
          if (document) {
            documentId.value = id
            displayName.value = document.displayName
            description.value = document.description || ''
            url.value = document.url || ''
            tweets.value = document.tweets.map(tweet => ({
              ...tweet,
              id: tweet.id || uuidv4().substring(0, 8)
            }))
          }
        } catch (e) {
          console.error('Failed to load document:', e)
        }
      }
    }

    onMounted(() => {
      loadDocument()
    })

    return {
      isEditing,
      displayName,
      tweets,
      description,
      url,
      isValid,
      addTweet,
      removeTweet,
      saveDocument,
      formatContent
    }
  }
}
</script>

<style scoped>
.editor-page {
  min-height: 100vh;
  background-color: #f7f9fa;
}

.page-header {
  background-color: #ffffff;
  padding: 20px;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1da1f2;
  text-decoration: none;
  font-size: 16px;
}

.back-link:hover {
  color: #1991db;
}

h1 {
  margin: 0;
  font-size: 24px;
  color: #14171a;
}

.page-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.editor-form {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #14171a;
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  font-size: 16px;
  background-color: #ffffff;
}

.form-control:focus {
  outline: none;
  border-color: #1da1f2;
  box-shadow: 0 0 0 2px rgba(29, 161, 242, 0.1);
}

textarea.form-control {
  resize: vertical;
  min-height: 100px;
}

.input-group {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.format-button {
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #e8f5fd;
  color: #1da1f2;
  border: none;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.format-button:hover {
  background-color: #d8effd;
}

.format-button i {
  font-size: 12px;
}
.tweets-section {
  margin-top: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  font-size: 20px;
  color: #14171a;
}

.add-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #1da1f2;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.add-button:hover {
  background-color: #1991db;
}

.no-items {
  text-align: center;
  padding: 40px;
  background-color: #f8f9fa;
  border-radius: 8px;
  color: #657786;
  font-style: italic;
}

.tweet-item {
  background: #f8f9fa;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
}

.tweet-header {
  padding: 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tweet-header h3 {
  margin: 0;
  font-size: 18px;
  color: #14171a;
}

.remove-button {
  background: none;
  border: none;
  color: #e0245e;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.remove-button:hover {
  background-color: rgba(224, 36, 94, 0.1);
}

.tweet-content {
  padding: 16px;
}

.form-actions {
  margin-top: 40px;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

.save-button,
.cancel-button {
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.save-button {
  background-color: #1da1f2;
  color: white;
  border: none;
}

.save-button:hover:not(:disabled) {
  background-color: #1991db;
}

.save-button:disabled {
  background-color: #a5d0f5;
  cursor: not-allowed;
}

.pre-action-buttons {
  margin: 32px 0;
  display: flex;
  justify-content: center;
}

.add-tweet-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background-color: #1da1f2;
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  box-shadow: 0 2px 4px rgba(29, 161, 242, 0.2);
}

.add-tweet-button:hover {
  background-color: #1991db;
  box-shadow: 0 4px 8px rgba(29, 161, 242, 0.3);
}

.cancel-button {
  background-color: white;
  color: #1da1f2;
  border: 1px solid #1da1f2;
}

.cancel-button:hover {
  background-color: rgba(29, 161, 242, 0.1);
}

@media (max-width: 768px) {
  .page-header {
    padding: 16px;
  }

  .page-content {
    padding: 20px;
  }

  .editor-form {
    padding: 16px;
  }

  .tweet-header {
    flex-direction: column;
    gap: 12px;
  }

  .tweet-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 12px;
  }

  .save-button,
  .cancel-button {
    width: 100%;
  }

  .add-tweet-button {
    width: 100%;
    justify-content: center;
  }
}
</style>