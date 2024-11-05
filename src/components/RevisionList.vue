<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>改訂履歴の編集</h2>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal-body">
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
          <div v-if="currentRevisions.length === 0" class="no-revisions">
            改訂履歴がありません
          </div>
          <div v-else v-for="revision in currentRevisions" :key="revision.id" class="revision-item">
            <div class="revision-header">
              <h3>{{ revision.title }}</h3>
              <div class="revision-actions">
                <button class="edit-button" @click="editRevision(revision)">
                  <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="delete-button" @click="deleteRevision(revision)">
                  <i class="fas fa-trash"></i>
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
      </div>

      <div class="modal-footer">
        <button class="cancel-button" @click="$emit('close')">キャンセル</button>
        <button class="save-button" @click="saveRevision" :disabled="!isValid">保存</button>
      </div>

      <revision-editor
        v-if="showingEditor"
        :documents="documents"
        :selected-document="selectedDocument"
        :initial-revision="selectedRevision"
        @save="saveRevision"
        @close="showingEditor = false"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import RevisionEditor from './RevisionEditor.vue'

export default {
  name: 'RevisionList',
  components: {
    RevisionEditor
  },
  props: {
    documents: {
      type: Object,
      required: true
    }
  },
  setup(props, { emit }) {
    const selectedDocument = ref('')
    const showingEditor = ref(false)
    const selectedRevision = ref(null)

    const currentRevisions = computed(() => {
      if (!selectedDocument.value || !props.documents[selectedDocument.value].revisions) {
        return []
      }
      return props.documents[selectedDocument.value].revisions
    })

    const loadRevisions = () => {
      showingEditor.value = false
      selectedRevision.value = null
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    const editRevision = (revision) => {
      selectedRevision.value = revision
      showingEditor.value = true
    }

    const deleteRevision = (revision) => {
      if (confirm('この改訂履歴を削除してもよろしいですか？')) {
        const updatedRevisions = currentRevisions.value.filter(r => r.id !== revision.id)
        emit('save', {
          documentId: selectedDocument.value,
          revisions: updatedRevisions
        })
      }
    }

    const saveRevision = (revision) => {
      let updatedRevisions = [...currentRevisions.value]
      const index = updatedRevisions.findIndex(r => r.id === revision.id)
      
      if (index !== -1) {
        updatedRevisions[index] = revision
      } else {
        updatedRevisions.push(revision)
      }

      emit('save', {
        documentId: selectedDocument.value,
        revisions: updatedRevisions
      })
      showingEditor.value = false
      selectedRevision.value = null
    }

    return {
      selectedDocument,
      showingEditor,
      selectedRevision,
      currentRevisions,
      loadRevisions,
      formatDate,
      editRevision,
      deleteRevision,
      saveRevision
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5em;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #657786;
}

.modal-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e1e8ed;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background-color: white;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #14171a;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e1e8ed;
  border-radius: 4px;
  font-size: 16px;
}

.form-control:focus {
  outline: none;
  border-color: #1da1f2;
  box-shadow: 0 0 0 2px rgba(29, 161, 242, 0.1);
}

.revisions-list {
  margin-top: 20px;
}

.no-revisions {
  text-align: center;
  padding: 40px;
  color: #657786;
  font-style: italic;
}

.revision-item {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
}

.revision-header {
  padding: 12px 16px;
  background-color: #f7f9fa;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.revision-header h3 {
  margin: 0;
  font-size: 1.1em;
  color: #14171a;
}

.revision-actions {
  display: flex;
  gap: 8px;
}

.edit-button,
.delete-button {
  background: none;
  border: none;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.edit-button {
  color: #1da1f2;
}

.delete-button {
  color: #e0245e;
}

.edit-button:hover {
  background-color: rgba(29, 161, 242, 0.1);
}

.delete-button:hover {
  background-color: rgba(224, 36, 94, 0.1);
}

.revision-info {
  padding: 16px;
}

.info-row {
  margin-bottom: 8px;
  display: flex;
  gap: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: bold;
  color: #657786;
  min-width: 60px;
}

.info-row a {
  color: #1da1f2;
  text-decoration: none;
}

.info-row a:hover {
  text-decoration: underline;
}

.save-button,
.cancel-button {
  padding: 8px 24px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.save-button {
  background-color: #1da1f2;
  color: white;
  border: none;
}

.save-button:hover {
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
  .modal-content {
    width: 95%;
    max-height: 95vh;
  }

  .revision-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
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

  .modal-footer {
    padding: 16px;
  }

  .save-button,
  .cancel-button {
    padding: 8px 16px;
  }
}
</style>