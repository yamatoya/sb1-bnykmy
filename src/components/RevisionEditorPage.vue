<template>
  <div class="editor-page">
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
                    <span class="document-name">{{ formatDisplayName(doc.displayName) }}</span>
                    <router-link 
                      :to="`/document/${doc.id}`" 
                      class="view-link"
                      target="_blank"
                    >
                      <i class="fas fa-external-link-alt"></i>
                      表示
                    </router-link>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div class="articles-section">
          <div class="section-header">
            <h2>条文の編集</h2>
            <button type="button" class="add-button" @click="addArticle">
              <i class="fas fa-plus"></i>
              条文を追加
            </button>
          </div>

          <div v-if="articles.length === 0" class="no-items">
            条文が追加されていません
          </div>

          <div v-else v-for="(article, index) in articles" :key="article.id" class="article-item">
            <div class="article-header">
              <h3>条文 {{ index + 1 }}</h3>
              <button type="button" class="remove-button" @click="removeArticle(index)">
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

              <div class="form-group">
                <label>改正前</label>
                <div v-if="article.status === '新設'" class="no-content">
                  改正前の内容なし
                </div>
                <textarea 
                  v-else
                  v-model="article.before" 
                  class="form-control" 
                  rows="4"
                  required
                ></textarea>
              </div>

              <div class="form-group">
                <label>改正後</label>
                <div v-if="article.status === '削除'" class="no-content deleted">
                  削除
                </div>
                <textarea 
                  v-else
                  v-model="article.after" 
                  class="form-control" 
                  rows="4"
                  required
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

    const documentId = computed(() => route.params.documentId)
    const revisionId = computed(() => route.params.revisionId)
    const isNew = computed(() => route.params.action === 'new')
    const backLink = computed(() => `/revisions/${documentId.value}`)

    const availablePublicComments = computed(() => {
      if (!documents.value) return []
      return Object.entries(documents.value)
        .filter(([_, doc]) => doc.public_comment)
        .map(([id, doc]) => ({
          id,
          displayName: doc.displayName
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

    const formatDisplayName = (name) => {
      return name?.replace(/<br>/gi, '') || ''
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

    const saveRevision = async () => {
      const revision = {
        id: revisionId.value || uuidv4(),
        title: title.value,
        date: date.value,
        description: description.value,
        sourceUrl: sourceUrl.value,
        articles: articles.value.map(article => ({
          ...article,
          before: article.status === '新設' ? null : article.before,
          after: article.status === '削除' ? null : article.after
        })),
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
      isValid,
      formatDisplayName,
      addArticle,
      removeArticle,
      saveRevision
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

.public-comments-section,
.articles-section {
  margin-top: 40px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.no-items,
.no-comments {
  text-align: center;
  padding: 40px;
  background-color: #f8f9fa;
  border-radius: 8px;
  color: #657786;
  font-style: italic;
}

.comment-item {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  margin-bottom: 12px;
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

.article-content {
  padding: 16px;
}

.no-content {
  padding: 12px;
  background-color: #ffffff;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  color: #657786;
  font-style: italic;
}

.no-content.deleted {
  color: #e0245e;
  font-weight: bold;
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

  .article-header {
    flex-direction: column;
    gap: 12px;
  }

  .article-actions {
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
}
</style>