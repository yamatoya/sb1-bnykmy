<template>
  <div class="revision-page">
    <header class="page-header">
      <router-link :to="backLink" class="back-link">
        <i class="fas fa-arrow-left"></i>
        <span>戻る</span>
      </router-link>
      <h1>{{ pageTitle }}</h1>
    </header>

    <main class="page-content">
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
              <router-link 
                :to="`/revisions/${documentId}/${revision.id}`"
                class="view-button"
              >
                <i class="fas fa-eye"></i>
                表示
              </router-link>
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
                  :key="comment.accountId"
                  :to="`/document/${comment.accountId}`"
                  class="public-comment-link"
                >
                  {{ formatDisplayName(comment.displayName) }}
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-revisions">
        指定された文書が見つかりません
      </div>
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatDisplayName, formatDate } from '../utils/formatters'

const STORAGE_KEY = 'legal-documents-data'

export default {
  name: 'RevisionPage',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const documents = ref(null)

    const documentId = computed(() => route.params.documentId)
    const revisionId = computed(() => route.params.revisionId)
    
    const backLink = computed(() => `/document/${documentId.value}`)

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

    const pageTitle = computed(() => {
      if (!currentDocument.value) return '改訂履歴'
      return `${formatDisplayName(currentDocument.value.displayName)} - 改訂履歴`
    })

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

    onMounted(() => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          documents.value = JSON.parse(storedData)
        } catch (e) {
          console.error('Failed to parse stored documents:', e)
        }
      }
    })

    return {
      documentId,
      revisionId,
      currentDocument,
      sortedRevisions,
      backLink,
      pageTitle,
      formatDisplayName,
      formatDate,
      addNewRevision,
      editRevision,
      deleteRevision,
      getPublicComments
    }
  }
}
</script>

<style scoped>
.revision-page {
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
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

.view-button,
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
  text-decoration: none;
}

.view-button {
  background-color: #e8f5fd;
  color: #1da1f2;
}

.view-button:hover {
  background-color: #d8effd;
}

.edit-button {
  background-color: #f3f4f6;
  color: #4b5563;
}

.edit-button:hover {
  background-color: #e5e7eb;
}

.delete-button {
  background-color: #fee2e2;
  color: #ef4444;
}

.delete-button:hover {
  background-color: #fecaca;
}

.revision-info {
  padding: 16px;
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
  min-width: 120px;
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

@media (max-width: 768px) {
  .page-header {
    padding: 16px;
    flex-wrap: wrap;
  }

  h1 {
    font-size: 20px;
    width: 100%;
    order: -1;
    margin-bottom: 12px;
  }

  .page-content {
    padding: 20px 16px;
  }

  .revision-header {
    flex-direction: column;
    gap: 12px;
  }

  .revision-actions {
    width: 100%;
    justify-content: flex-end;
    gap: 8px;
  }

  .info-row {
    flex-direction: column;
    gap: 4px;
  }

  .label {
    min-width: auto;
  }

  .public-comments-list {
    width: 100%;
  }

  .public-comment-link {
    width: 100%;
    justify-content: center;
  }
}
</style>