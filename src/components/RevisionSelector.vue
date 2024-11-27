<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>改訂履歴の追加</h2>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>

      <div class="search-container">
        <div class="search-input-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="改訂履歴を検索..."
            class="search-input"
          />
          <button 
            v-if="searchQuery" 
            class="clear-button"
            @click="searchQuery = ''"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div class="modal-body">
        <div v-if="document.revisions && document.revisions.length > 0">
          <div v-for="revision in filteredRevisions" :key="revision.id" class="revision-item">
            <div class="revision-header">
              <span class="revision-date">{{ formatDate(revision.date) }}</span>
            </div>
            <div v-for="article in filteredArticles(revision)" :key="article.id" class="article-item">
              <label class="article-checkbox">
                <input 
                  type="checkbox" 
                  :value="`${document.accountId}/revisions/${revision.id}/${article.id}`"
                  v-model="selectedRevisions"
                >
                <div class="article-preview">
                  <div class="article-header">
                    <span class="revision-title">{{ revision.title }}</span>
                    <span class="article-status" :class="article.status">{{ article.status }}</span>
                  </div>
                  <div class="article-content">
                    <div v-if="article.before" class="before-content">
                      <strong>改正前:</strong>
                      <span v-html="highlightSearchTerms(article.before)"></span>
                    </div>
                    <div v-if="article.after" class="after-content">
                      <strong>改正後:</strong>
                      <span v-html="highlightSearchTerms(article.after)"></span>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div v-else class="no-revisions">
          改訂履歴がありません
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-button" @click="$emit('close')">キャンセル</button>
        <button class="save-button" @click="save">保存</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'RevisionSelector',
  props: {
    document: {
      type: Object,
      required: true
    },
    initialSelections: {
      type: Array,
      default: () => []
    }
  },
  emits: ['save', 'close'],
  setup(props, { emit }) {
    const selectedRevisions = ref([...props.initialSelections])
    const searchQuery = ref('')

    const filteredRevisions = computed(() => {
      if (!props.document.revisions) return []
      if (!searchQuery.value) return props.document.revisions

      return props.document.revisions.filter(revision => {
        const searchTerms = searchQuery.value.toLowerCase().split(' ')
        const searchableContent = [
          revision.title,
          revision.description,
          ...revision.articles.map(article => `${article.before || ''} ${article.after || ''}`)
        ].join(' ').toLowerCase()

        return searchTerms.every(term => searchableContent.includes(term))
      })
    })

    const filteredArticles = (revision) => {
      if (!searchQuery.value) return revision.articles

      const searchTerms = searchQuery.value.toLowerCase().split(' ')
      return revision.articles.filter(article => {
        const searchableContent = `${article.before || ''} ${article.after || ''}`
        return searchTerms.every(term => searchableContent.toLowerCase().includes(term))
      })
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    const highlightSearchTerms = (text) => {
      if (!searchQuery.value || !text) return text

      let highlightedText = text
      const searchTerms = searchQuery.value.toLowerCase().split(' ')
      
      searchTerms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi')
        highlightedText = highlightedText.replace(regex, '<span class="highlight">$1</span>')
      })

      return highlightedText
    }

    const save = () => {
      emit('save', selectedRevisions.value)
      emit('close')
    }

    return {
      selectedRevisions,
      searchQuery,
      filteredRevisions,
      filteredArticles,
      formatDate,
      highlightSearchTerms,
      save
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

.search-container {
  padding: 16px 20px;
  border-bottom: 1px solid #e1e8ed;
  background-color: #ffffff;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #657786;
}

.search-input {
  width: 100%;
  padding: 8px 36px;
  border: 1px solid #e1e8ed;
  border-radius: 20px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #1da1f2;
  box-shadow: 0 0 0 2px rgba(29, 161, 242, 0.1);
}

.clear-button {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #657786;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.clear-button:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e1e8ed;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.revision-item {
  margin-bottom: 24px;
}

.revision-header {
  margin-bottom: 12px;
}

.revision-date {
  color: #657786;
  font-size: 14px;
}

.article-item {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  margin-bottom: 12px;
}

.article-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  cursor: pointer;
  width: 100%;
}

.article-checkbox input {
  margin-top: 4px;
}

.article-preview {
  flex-grow: 1;
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.revision-title {
  font-weight: bold;
  color: #14171a;
}

.article-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.article-status.改正 {
  background-color: #e8f5fd;
  color: #1da1f2;
}

.article-status.新設 {
  background-color: #dcfce7;
  color: #16a34a;
}

.article-status.削除 {
  background-color: #fee2e2;
  color: #ef4444;
}

.article-content {
  font-size: 14px;
  color: #4b5563;
}

.before-content,
.after-content {
  margin-bottom: 8px;
}

.after-content {
  margin-bottom: 0;
}

.no-revisions {
  text-align: center;
  padding: 40px;
  color: #657786;
  font-style: italic;
}

.save-button,
.cancel-button {
  padding: 8px 24px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-button {
  background-color: #1da1f2;
  color: white;
  border: none;
}

.save-button:hover {
  background-color: #1991db;
}

.cancel-button {
  background-color: white;
  color: #1da1f2;
  border: 1px solid #1da1f2;
}

.cancel-button:hover {
  background-color: rgba(29, 161, 242, 0.1);
}

.highlight {
  background-color: #fff3cd;
  padding: 2px;
  border-radius: 2px;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 95vh;
  }

  .article-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .article-checkbox {
    padding: 12px;
  }

  .search-container {
    padding: 12px 16px;
  }

  .search-input {
    font-size: 16px;
  }
}
</style>