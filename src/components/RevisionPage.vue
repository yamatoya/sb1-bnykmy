<template>
  <div class="revision-page">
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
            <strong>Current Document:</strong> {{ currentDocument?.displayName }}
          </div>
        </div>

        <div class="debug-section">
          <h4>改訂情報</h4>
          <div class="debug-item">
            <strong>改訂数:</strong> {{ sortedRevisions.length }}
          </div>
          <div class="debug-item">
            <strong>パブリックコメントリンク:</strong>
            <pre>{{ JSON.stringify(publicCommentLinks, null, 2) }}</pre>
          </div>
        </div>

        <div class="debug-section">
          <h4>パブリックコメント情報</h4>
          <div class="debug-item">
            <strong>リンクされたパブリックコメント:</strong>
            <pre>{{ JSON.stringify(linkedPublicComments, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>

    <header class="page-header">
      <router-link :to="backLink" class="back-link">
        <i class="fas fa-arrow-left"></i>
        <span>戻る</span>
      </router-link>
      <h1>{{ pageTitle }}</h1>
    </header>

    <main class="page-content">
      <div v-if="!documentId" class="form-group">
        <label>対象文書</label>
        <select v-model="selectedDocument" class="form-control" @change="loadRevisions">
          <option value="">文書を選択してください</option>
          <option v-for="(doc, id) in documents" :key="id" :value="id">
            {{ doc.displayName }}
          </option>
        </select>
      </div>

      <div v-if="currentDocument" class="revisions-list">
        <div class="revisions-header">
          <h2>改訂一覧</h2>
          <button class="add-revision-button" @click="addNewRevision">
            <i class="fas fa-plus"></i>
            新規改訂を追加
          </button>
        </div>

        <div v-if="!currentDocument.revisions || currentDocument.revisions.length === 0" class="no-revisions">
          改訂履歴がありません
        </div>
        
        <div v-else v-for="revision in sortedRevisions" :key="revision.id" class="revision-item">
          <div class="revision-header">
            <h3>{{ revision.title }}</h3>
            <div class="revision-actions">
              <button class="edit-button" @click="editRevision(revision)">
                <i class="fas fa-pencil-alt"></i>
                編集
              </button>
              <button class="delete-button" @click="deleteRevision(revision)">
                <i class="fas fa-trash"></i>
                削除
              </button>
            </div>
          </div>
          <div class="revision-info">
            <div class="info-row">
              <span class="label">日付:</span>
              <span>{{ formatDate(revision.date) }}</span>
            </div>
            <div v-if="revision.description" class="info-row">
              <span class="label">説明:</span>
              <span>{{ revision.description }}</span>
            </div>
            <div v-if="revision.sourceUrl" class="info-row">
              <span class="label">URL:</span>
              <a :href="revision.sourceUrl" target="_blank" rel="noopener noreferrer">
                {{ revision.sourceUrl }}
              </a>
            </div>
            <div v-if="getPublicComments(revision).length > 0" class="info-row">
              <span class="label">パブリックコメント:</span>
              <div class="public-comments-list">
                <router-link
                  v-for="comment in getPublicComments(revision)"
                  :key="comment.id"
                  :to="`/document/${comment.id}`"
                  class="public-comment-link"
                >
                  {{ formatDisplayName(comment.displayName) }}
                </router-link>
              </div>
            </div>
          </div>
          <div class="articles-list">
            <div v-for="article in revision.articles" :key="article.id" class="article-container">
              <div class="article-status" :class="article.status">{{ article.status }}</div>
              <div class="comparison-container">
                <div v-if="article.status !== '新設'" class="comparison-column before">
                  <h4>改正前</h4>
                  <div v-if="article.before" class="content" v-html="article.before"></div>
                  <div v-else class="no-content">改正前の内容なし</div>
                </div>
                <div v-if="article.status !== '削除'" class="comparison-column after">
                  <h4>改正後</h4>
                  <div v-if="article.after" class="content" v-html="article.after"></div>
                  <div v-else class="no-content">改正後の内容なし</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const STORAGE_KEY = 'legal-documents-data'

export default {
  name: 'RevisionPage',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const documents = ref(null)
    const selectedDocument = ref('')
    const showDebug = ref(false)

    const documentId = computed(() => route.params.documentId)
    
    const backLink = computed(() => {
      return documentId.value ? `/document/${documentId.value}` : '/'
    })

    const pageTitle = computed(() => {
      if (!currentDocument.value) return '改訂履歴の編集'
      return `${currentDocument.value.displayName} - 改訂履歴`
    })

    const currentDocument = computed(() => {
      if (!documents.value || !documentId.value) return null
      return documents.value[documentId.value]
    })

    const sortedRevisions = computed(() => {
      if (!currentDocument.value?.revisions) return []
      return [...currentDocument.value.revisions].sort((a, b) => {
        return new Date(b.date) - new Date(a.date)
      })
    })

    const publicCommentLinks = computed(() => {
      return sortedRevisions.value.reduce((acc, revision) => {
        if (revision.publicCommentLinks) {
          acc[revision.id] = revision.publicCommentLinks
        }
        return acc
      }, {})
    })

    const linkedPublicComments = computed(() => {
      const links = new Set()
      sortedRevisions.value.forEach(revision => {
        if (revision.publicCommentLinks) {
          revision.publicCommentLinks.forEach(id => links.add(id))
        }
      })
      return Array.from(links).map(id => {
        const doc = documents.value[id]
        return doc ? {
          id,
          displayName: doc.displayName,
          hasPublicComment: !!doc.public_comment
        } : null
      }).filter(Boolean)
    })

    const loadDocuments = () => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          documents.value = JSON.parse(storedData)
        } catch (e) {
          console.error('Failed to parse stored documents:', e)
        }
      }
    }

    const loadRevisions = () => {
      if (selectedDocument.value) {
        router.replace(`/revisions/${selectedDocument.value}`)
      }
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    const formatDisplayName = (name) => {
      return name.replace(/<br>/gi, '')
    }

    const addNewRevision = () => {
      router.push(`/revisions/${documentId.value}/new`)
    }

    const editRevision = (revision) => {
      router.push(`/revisions/${documentId.value}/edit/${revision.id}`)
    }

    const deleteRevision = async (revision) => {
      if (confirm('この改訂履歴を削除してもよろしいですか？')) {
        const updatedDocuments = { ...documents.value }
        const doc = updatedDocuments[documentId.value]
        doc.revisions = doc.revisions.filter(r => r.id !== revision.id)
        
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDocuments))
          documents.value = updatedDocuments
        } catch (e) {
          console.error('Failed to save documents:', e)
          alert('改訂履歴の削除に失敗しました')
        }
      }
    }

    const getPublicComments = (revision) => {
      if (!revision.publicCommentLinks || !documents.value) return []
      return revision.publicCommentLinks
        .map(id => documents.value[id])
        .filter(doc => doc && doc.public_comment)
    }

    const toggleDebug = () => {
      showDebug.value = !showDebug.value
    }

    onMounted(() => {
      loadDocuments()
    })

    return {
      documentId,
      documents,
      selectedDocument,
      currentDocument,
      sortedRevisions,
      backLink,
      pageTitle,
      loadRevisions,
      formatDate,
      formatDisplayName,
      addNewRevision,
      editRevision,
      deleteRevision,
      getPublicComments,
      publicCommentLinks,
      linkedPublicComments,
      showDebug,
      toggleDebug
    }
  }
}
</script>

<style scoped>
.revision-page {
  min-height: 100vh;
  background-color: #f7f9fa;
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.form-group {
  margin-bottom: 30px;
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

.revisions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.revisions-header h2 {
  margin: 0;
  font-size: 20px;
  color: #14171a;
}

.add-revision-button {
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

.add-revision-button:hover {
  background-color: #1991db;
}

.no-revisions {
  text-align: center;
  padding: 40px;
  background-color: #ffffff;
  border-radius: 8px;
  color: #657786;
  font-style: italic;
}

.revision-item {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
}

.revision-header {
  padding: 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.revision-header h3 {
  margin: 0;
  font-size: 18px;
  color: #14171a;
}

.revision-actions {
  display: flex;
  gap: 12px;
}

.edit-button,
.delete-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-button {
  background-color: #e8f5fd;
  color: #1da1f2;
}

.edit-button:hover {
  background-color: #d8effd;
}

.delete-button {
  background-color: #ffefef;
  color: #e0245e;
}

.delete-button:hover {
  background-color: #ffe7e7;
}

.revision-info {
  padding: 16px;
  border-bottom: 1px solid #e1e8ed;
}

.info-row {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: bold;
  color: #657786;
  min-width: 80px;
}

.info-row a {
  color: #1da1f2;
  text-decoration: none;
}

.info-row a:hover {
  text-decoration: underline;
}

.public-comments-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.public-comment-link {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background-color: #e8f5fd;
  color: #1da1f2;
  border-radius: 16px;
  text-decoration: none;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.public-comment-link:hover {
  background-color: #d8effd;
}

.articles-list {
  padding: 16px;
}

.article-container {
  margin-bottom: 24px;
}

.article-container:last-child {
  margin-bottom: 0;
}

.article-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
}

.article-status.改正 {
  background-color: #e8f5fd;
  color: #1da1f2;
}

.article-status.新設 {
  background-color: #e6ffed;
  color: #28a745;
}

.article-status.削除 {
  background-color: #ffeef0;
  color: #e0245e;
}

.comparison-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.comparison-column {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.comparison-column h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #657786;
}

.content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}

.no-content {
  color: #657786;
  font-style: italic;
}

@media (max-width: 768px) {
  .page-header {
    padding: 16px;
  }

  .page-content {
    padding: 20px;
  }

  .revision-header {
    flex-direction: column;
    gap: 12px;
  }

  .revision-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .comparison-container {
    grid-template-columns: 1fr;
  }

  .info-row {
    flex-direction: column;
    gap: 4px;
  }

  .label {
    min-width: auto;
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
}
</style>