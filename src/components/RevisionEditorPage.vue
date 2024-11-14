<template>
  <div class="editor-page">
    <!-- デバッグ情報パネル -->
    <div class="debug-panel">
      <div class="debug-header" @click="toggleDebug">
        <i class="fas fa-bug"></i> デバッグ情報
        <span class="toggle-icon">{{ showDebug ? '▼' : '▶' }}</span>
      </div>
      <div v-if="showDebug" class="debug-content">
        <div class="debug-section">
          <h4>基本情報</h4>
          <div class="debug-item">
            <strong>Document ID:</strong> {{ documentId }}
          </div>
          <div class="debug-item">
            <strong>Revision ID:</strong> {{ revisionId }}
          </div>
          <div class="debug-item">
            <strong>Is New Revision:</strong> {{ isNew }}
          </div>
        </div>

        <div class="debug-section">
          <h4>パブリックコメント検索情報</h4>
          <div class="debug-item">
            <strong>検索条件:</strong>
            <pre>
1. ドキュメントの存在確認
   - Documents loaded: {{ !!documents }}
   - Total documents: {{ Object.keys(documents || {}).length }}

2. パブリックコメントの検索
   - Documents with public comments: {{ documentsWithPublicComments.length }}
   - Available public comment documents: {{ availablePublicComments.length }}

3. 選択状態
   - Selected documents: {{ selectedPublicComments.length }}
   - Selection IDs: {{ JSON.stringify(selectedPublicComments) }}
            </pre>
          </div>
          <div class="debug-item">
            <strong>パブリックコメントを含むドキュメント:</strong>
            <pre>{{ documentsWithPublicComments.map(doc => ({
              id: doc.id,
              name: doc.displayName,
              hasPublicComment: doc.public_comment
            })) }}</pre>
          </div>
        </div>

        <div class="debug-section">
          <h4>現在の改訂データ</h4>
          <div class="debug-item">
            <pre>{{ JSON.stringify({
              id: revisionId,
              title: title,
              date: date,
              description: description,
              sourceUrl: sourceUrl,
              articlesCount: articles.length,
              publicCommentLinks: selectedPublicComments
            }, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>

    <header class="page-header">
      <router-link :to="backLink" class="back-link">
        <i class="fas fa-arrow-left"></i>
        <span>戻る</span>
      </router-link>
      <h1>{{ isNew ? '新規改訂の追加' : '改訂の編集' }}</h1>
    </header>

    <main class="page-content">
      <form @submit.prevent="saveRevision" class="editor-form">
        <div class="form-group">
          <label>改訂タイトル</label>
          <input 
            type="text" 
            v-model="title" 
            class="form-control" 
            placeholder="例: 令和5年改正"
            required
          />
        </div>

        <div class="form-group">
          <label>改訂日</label>
          <input 
            type="date" 
            v-model="date" 
            class="form-control"
            required
          />
        </div>

        <div class="form-group">
          <label>改訂説明</label>
          <textarea 
            v-model="description" 
            class="form-control" 
            rows="3" 
            placeholder="改訂の概要を入力してください"
          ></textarea>
        </div>

        <div class="form-group">
          <label>改訂ソースURL</label>
          <input 
            type="url" 
            v-model="sourceUrl" 
            class="form-control" 
            placeholder="https://..."
          />
        </div>

        <div class="public-comments-section">
          <h2>関連するパブリックコメント</h2>
          <div v-if="availablePublicComments.length === 0" class="no-comments">
            利用可能なパブリックコメントがありません
          </div>
          <div v-else class="comments-list">
            <div v-for="doc in availablePublicComments" :key="doc.id" class="comment-item">
              <label class="comment-checkbox">
                <input 
                  type="checkbox" 
                  :value="doc.id"
                  v-model="selectedPublicComments"
                >
                <div class="comment-preview">
                  <div class="comment-header">
                    <span class="document-name">{{ doc.displayName }}</span>
                    <a 
                      :href="`/document/${doc.id}`" 
                      target="_blank" 
                      class="view-link"
                      @click.prevent="openDocument(doc.id)"
                    >
                      <i class="fas fa-external-link-alt"></i>
                      表示
                    </a>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div class="articles-section">
          <div class="articles-header">
            <h2>条文の編集</h2>
            <button type="button" class="add-article-button" @click="addArticle">
              <i class="fas fa-plus"></i>
              条文を追加
            </button>
          </div>

          <div v-if="articles.length === 0" class="no-articles">
            条文が追加されていません
          </div>

          <div v-else v-for="(article, index) in articles" :key="article.id" class="article-item">
            <div class="article-header">
              <h3>条文 {{ index + 1 }}</h3>
              <button type="button" class="remove-article-button" @click="removeArticle(index)">
                <i class="fas fa-trash"></i>
              </button>
            </div>

            <div class="article-content">
              <div class="form-group">
                <label>状態</label>
                <select v-model="article.status" class="form-control" required>
                  <option value="改正">改正</option>
                  <option value="新設">新設</option>
                  <option value="削除">削除</option>
                </select>
              </div>

              <div class="form-group" v-if="article.status !== '新設'">
                <label>改正前</label>
                <textarea 
                  v-model="article.before" 
                  class="form-control" 
                  rows="4"
                  :required="article.status !== '新設'"
                ></textarea>
              </div>

              <div class="form-group" v-if="article.status !== '削除'">
                <label>改正後</label>
                <textarea 
                  v-model="article.after" 
                  class="form-control" 
                  rows="4"
                  :required="article.status !== '削除'"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <router-link :to="backLink" class="cancel-button">キャンセル</router-link>
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
  name: 'RevisionEditorPage',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const documents = ref(null)
    const title = ref('')
    const date = ref('')
    const description = ref('')
    const sourceUrl = ref('')
    const articles = ref([])
    const selectedPublicComments = ref([])
    const showDebug = ref(false)

    const documentId = computed(() => route.params.documentId)
    const revisionId = computed(() => route.params.revisionId)
    const isNew = computed(() => route.params.action === 'new')
    const backLink = computed(() => `/revisions/${documentId.value}`)

    const documentsWithPublicComments = computed(() => {
      if (!documents.value) return []
      return Object.entries(documents.value)
        .filter(([_, doc]) => doc.public_comment)
        .map(([id, doc]) => ({ id, ...doc }))
    })

    const availablePublicComments = computed(() => {
      return documentsWithPublicComments.value.map(doc => ({
        id: doc.id,
        displayName: doc.displayName,
        selected: selectedPublicComments.value.includes(doc.id)
      }))
    })

    const isValid = computed(() => {
      return title.value &&
             date.value &&
             articles.value.length > 0 &&
             articles.value.every(article => {
               if (article.status === '新設') return !!article.after
               if (article.status === '削除') return !!article.before
               return article.before && article.after
             })
    })

    const loadDocuments = () => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          documents.value = JSON.parse(storedData)
          if (!isNew.value && revisionId.value) {
            loadRevision()
          }
        } catch (e) {
          console.error('Failed to parse stored documents:', e)
        }
      }
    }

    const loadRevision = () => {
      const document = documents.value[documentId.value]
      if (document?.revisions) {
        const revision = document.revisions.find(r => r.id === revisionId.value)
        if (revision) {
          title.value = revision.title
          date.value = revision.date
          description.value = revision.description || ''
          sourceUrl.value = revision.sourceUrl || ''
          articles.value = revision.articles.map(article => ({
            ...article,
            id: article.id || uuidv4()
          }))
          selectedPublicComments.value = revision.publicCommentLinks || []
        }
      }
    }

    const addArticle = () => {
      articles.value.push({
        id: uuidv4(),
        status: '改正',
        before: '',
        after: ''
      })
    }

    const removeArticle = (index) => {
      articles.value.splice(index, 1)
    }

    const toggleDebug = () => {
      showDebug.value = !showDebug.value
    }

    const openDocument = (docId) => {
      router.push(`/document/${docId}`)
    }

    const saveRevision = async () => {
      const revision = {
        id: revisionId.value || uuidv4(),
        title: title.value,
        date: date.value,
        description: description.value,
        sourceUrl: sourceUrl.value,
        articles: articles.value,
        publicCommentLinks: selectedPublicComments.value
      }

      const updatedDocuments = { ...documents.value }
      const document = updatedDocuments[documentId.value]

      if (!document.revisions) {
        document.revisions = []
      }

      const index = document.revisions.findIndex(r => r.id === revision.id)
      if (index !== -1) {
        document.revisions[index] = revision
      } else {
        document.revisions.push(revision)
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDocuments))
        router.push(backLink.value)
      } catch (e) {
        console.error('Failed to save revision:', e)
        alert('改訂の保存に失敗しました')
      }
    }

    onMounted(() => {
      loadDocuments()
    })

    return {
      isNew,
      backLink,
      title,
      date,
      description,
      sourceUrl,
      articles,
      selectedPublicComments,
      availablePublicComments,
      documents,
      documentsWithPublicComments,
      documentId,
      revisionId,
      isValid,
      showDebug,
      addArticle,
      removeArticle,
      saveRevision,
      toggleDebug,
      openDocument
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

.debug-panel {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  margin: 20px;
}

.debug-header {
  padding: 12px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e1e8ed;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: #1da1f2;
}

.debug-content {
  padding: 16px;
}

.debug-section {
  margin-bottom: 20px;
}

.debug-section h4 {
  margin: 0 0 12px 0;
  color: #14171a;
}

.debug-item {
  margin-bottom: 8px;
  font-family: monospace;
}

.debug-item strong {
  color: #657786;
}

.debug-item pre {
  margin: 8px 0;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.toggle-icon {
  margin-left: auto;
}

.public-comments-section {
  margin-top: 40px;
  margin-bottom: 40px;
}

.public-comments-section h2 {
  margin-bottom: 20px;
  font-size: 20px;
  color: #14171a;
}

.no-comments {
  text-align: center;
  padding: 40px;
  background-color: #f8f9fa;
  border-radius: 8px;
  color: #657786;
  font-style: italic;
}

.comments-list {
  display: grid;
  gap: 16px;
}

.comment-item {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  overflow: hidden;
}

.comment-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  cursor: pointer;
  width: 100%;
}

.comment-checkbox input {
  margin-top: 4px;
}

.comment-preview {
  flex-grow: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.document-name {
  font-size: 16px;
  font-weight: bold;
  color: #14171a;
}

.view-link {
  color: #1da1f2;
  text-decoration: none;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.view-link:hover {
  text-decoration: underline;
}

.articles-section {
  margin-top: 40px;
}

.articles-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.articles-header h2 {
  margin: 0;
  font-size: 20px;
  color: #14171a;
}

.add-article-button {
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

.add-article-button:hover {
  background-color: #1991db;
}

.no-articles {
  text-align: center;
  padding: 40px;
  background-color: #f8f9fa;
  border-radius: 8px;
  color: #657786;
  font-style: italic;
  margin-bottom: 20px;
}

.article-item {
  background: #f8f9fa;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
}

.article-header {
  padding: 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.article-header h3 {
  margin: 0;
  font-size: 18px;
  color: #14171a;
}

.remove-article-button {
  background: none;
  border: none;
  color: #e0245e;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.remove-article-button:hover {
  background-color: rgba(224, 36, 94, 0.1);
}

.article-content {
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

  .form-actions {
    flex-direction: column-reverse;
    gap: 12px;
  }

  .save-button,
  .cancel-button {
    width: 100%;
  }

  .debug-panel {
    margin: 12px;
  }

  .debug-content {
    padding: 12px;
  }

  .debug-item pre {
    font-size: 12px;
  }

  .comment-checkbox {
    padding: 12px;
  }

  .comment-header {
    flex-direction: column;
    gap: 8px;
  }

  .view-link {
    align-self: flex-start;
  }
}
</style>