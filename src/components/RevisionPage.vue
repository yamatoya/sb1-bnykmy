<template>
  <div class="revision-page">
    <header class="page-header">
      <router-link to="/" class="back-link">
        <i class="fas fa-arrow-left"></i>
        <span>戻る</span>
      </router-link>
      <h1>改訂履歴の編集</h1>
    </header>

    <main class="page-content">
      <div class="form-group">
        <label>対象文書</label>
        <select v-model="selectedDocument" class="form-control" @change="loadRevisions">
          <option value="">文書を選択してください</option>
          <option v-for="(doc, id) in documents" :key="id" :value="id">
            {{ doc.displayName }}
          </option>
        </select>
      </div>

      <div v-if="selectedDocument" class="revisions-list">
        <div class="revisions-header">
          <h2>改訂一覧</h2>
          <button class="add-revision-button" @click="addNewRevision">
            <i class="fas fa-plus"></i>
            新規改訂を追加
          </button>
        </div>

        <div v-if="currentRevisions.length === 0" class="no-revisions">
          改訂履歴がありません
        </div>
        
        <div v-else v-for="revision in currentRevisions" :key="revision.id" class="revision-item">
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
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const STORAGE_KEY = 'legal-documents-data'

export default {
  name: 'RevisionPage',
  props: {
    documents: {
      type: Object,
      required: true
    }
  },
  setup() {
    const router = useRouter()
    const selectedDocument = ref('')
    const documents = ref(null)

    // LocalStorageからデータを読み込む
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

    loadDocuments()

    const currentRevisions = computed(() => {
      if (!selectedDocument.value || !documents.value?.[selectedDocument.value]?.revisions) {
        return []
      }
      return documents.value[selectedDocument.value].revisions
    })

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

    const addNewRevision = () => {
      router.push(`/revisions/${selectedDocument.value}/new`)
    }

    const editRevision = (revision) => {
      router.push(`/revisions/${selectedDocument.value}/edit/${revision.id}`)
    }

    const deleteRevision = async (revision) => {
      if (confirm('この改訂履歴を削除してもよろしいですか？')) {
        const updatedRevisions = currentRevisions.value.filter(r => r.id !== revision.id)
        const updatedDocuments = { ...documents.value }
        updatedDocuments[selectedDocument.value].revisions = updatedRevisions
        
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDocuments))
          documents.value = updatedDocuments
        } catch (e) {
          console.error('Failed to save documents:', e)
          alert('改訂履歴の削除に失敗しました')
        }
      }
    }

    return {
      selectedDocument,
      documents,
      currentRevisions,
      loadRevisions,
      formatDate,
      addNewRevision,
      editRevision,
      deleteRevision
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

  .info-row {
    flex-direction: column;
    gap: 4px;
  }

  .label {
    min-width: auto;
  }
}
</style>