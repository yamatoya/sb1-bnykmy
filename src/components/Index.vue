<template>
  <div class="page">
    <aside class="sidebar">
      <div class="sidebar-buttons">
        <router-link to="/document/new" class="action-button primary-button sidebar-button">
          <i class="fas fa-plus"></i>
          <span>新規文書を作成</span>
        </router-link>
        <router-link to="/lists" class="action-button primary-button sidebar-button">
          <i class="fas fa-list"></i>
          <span>リスト一覧</span>
        </router-link>
        <router-link to="/public-comment/new" class="action-button primary-button sidebar-button">
          <i class="fas fa-plus"></i>
          <span>パブリックコメントを追加</span>
        </router-link>
        <button class="action-button secondary-button sidebar-button" @click="downloadDocuments">
          <i class="fas fa-download"></i>
          <span>JSONをダウンロード</span>
        </button>
        <button class="action-button secondary-button sidebar-button" @click="showJsonDiffViewer">
          <i class="fas fa-code"></i>
          <span>JSON差分を表示</span>
        </button>
        <button class="action-button warning-button sidebar-button" @click="resetToDefault">
          <i class="fas fa-sync-alt"></i>
          <span>データをリセット</span>
        </button>
      </div>
    </aside>

    <div class="container">
      <header class="page-header">
        <h1>法律文書一覧</h1>
      </header>

      <div class="search-container">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="全文検索..."
          class="search-input"
          @focus="isSearchFocused = true"
          @blur="isSearchFocused = false"
        />
      </div>

      <div class="documents-grid">
        <div v-for="(doc, id) in filteredDocuments" :key="id" class="card">
          <router-link :to="`/document/${id}`" class="document-header">
            <div class="document-icon">{{ getFirstChar(doc.displayName) }}</div>
            <div class="document-info">
              <div class="document-name">{{ formatDisplayName(doc.displayName) }}</div>
              <div v-if="doc.revisions" class="revision-badge">
                改訂あり ({{ doc.revisions.length }}件)
              </div>
            </div>
          </router-link>
          
          <div class="document-actions">
            <router-link 
              :to="`/revisions/${id}`" 
              class="action-button secondary-button"
            >
              <i class="fas fa-history"></i>
              {{ doc.revisions ? '改訂履歴を表示' : '改訂履歴を追加' }}
            </router-link>
            <a 
              v-if="doc.public_comment && doc.url" 
              :href="doc.url" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="action-button secondary-button"
            >
              <i class="fas fa-external-link-alt"></i>
              原文を表示
            </a>
          </div>

          <div v-if="searchQuery && getMatchingContent(doc, id).length > 0" class="search-matches">
            <div v-for="(match, index) in getMatchingContent(doc, id)" :key="index" class="match-item">
              <router-link 
                :to="{
                  path: `/document/${id}/${match.id}`,
                  query: { 
                    back: `/?q=${encodeURIComponent(searchQuery)}`,
                    highlight: searchQuery
                  }
                }"
                class="match-link"
              >
                <div class="match-header">
                  <span class="match-index">{{ match.type }}</span>
                </div>
                <div class="match-content" v-html="highlightSearchTerms(match.content)"></div>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <json-diff-viewer
      v-if="showingJsonDiffViewer"
      @close="showingJsonDiffViewer = false"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import documentsData from '../documents.json'
import JsonDiffViewer from './JsonDiffViewer.vue'
import { formatDisplayName } from '../utils/formatters'

const STORAGE_KEY = 'legal-documents-data'

export default {
  name: 'Index',
  components: {
    JsonDiffViewer
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const isSearchFocused = ref(false)
    const documents = ref(documentsData)
    const showingJsonDiffViewer = ref(false)
    const searchQuery = ref('')

    onMounted(() => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData)
          // Skip arrays that start with "lists"
          const filteredData = Object.fromEntries(
            Object.entries(parsedData).filter(([key]) => !key.startsWith('lists'))
          )
          documents.value = filteredData
        } catch (e) {
          console.error('Failed to parse stored documents:', e)
          saveToLocalStorage(documentsData)
        }
      } else {
        saveToLocalStorage(documentsData)
      }

      searchQuery.value = route.query.q || ''
    })

    const saveToLocalStorage = (data) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        documents.value = data
      } catch (e) {
        console.error('Failed to save documents to localStorage:', e)
      }
    }

    const filteredDocuments = computed(() => {
      if (!searchQuery.value) return documents.value

      const searchTerms = searchQuery.value.toLowerCase().split(' ').filter(term => term.length > 0)
      
      return Object.fromEntries(
        Object.entries(documents.value).filter(([_, doc]) => {
          const contents = getSearchableContent(doc)
          return searchTerms.every(term => contents.toLowerCase().includes(term))
        })
      )
    })

    const getSearchableContent = (doc) => {
      let contents = []

      if (doc.tweets) {
        contents = contents.concat(doc.tweets.map(t => t.content))
      }

      if (doc.public_comment) {
        contents = contents.concat(doc.questions.map(q => `${q.question} ${q.answer}`))
      }

      if (doc.revisions) {
        contents = contents.concat(doc.revisions.flatMap(rev => {
          const revisionContents = [rev.title]
          if (rev.description) revisionContents.push(rev.description)
          revisionContents.push(...rev.articles.map(article => 
            `${article.before || ''} ${article.after || ''}`
          ))
          return revisionContents
        }))
      }

      return contents.join(' ')
    }

    const getMatchingContent = (doc, docId) => {
      if (!searchQuery.value) return []

      const matches = []
      const maxLength = 150
      const searchTerms = searchQuery.value.toLowerCase().split(' ').filter(term => term.length > 0)

      if (doc.tweets) {
        doc.tweets.forEach(tweet => {
          if (containsAllSearchTerms(tweet.content)) {
            matches.push({
              type: `${tweet.index}`,
              content: truncateText(tweet.content, maxLength),
              id: tweet.id
            })
          }
        })
      }

      if (doc.public_comment) {
        doc.questions.forEach(q => {
          if (containsAllSearchTerms(q.question)) {
            matches.push({
              type: `質問 ${q.index}`,
              content: truncateText(q.question, maxLength),
              id: q.id
            })
          }
          if (containsAllSearchTerms(q.answer)) {
            matches.push({
              type: `回答 ${q.index}`,
              content: truncateText(q.answer, maxLength),
              id: q.id
            })
          }
        })
      }

      return matches
    }

    const containsAllSearchTerms = (text) => {
      if (!text) return false
      const lowerText = text.toLowerCase()
      return searchQuery.value.toLowerCase().split(' ')
        .filter(term => term.length > 0)
        .every(term => lowerText.includes(term))
    }

    const truncateText = (text, maxLength) => {
      if (!text || text.length <= maxLength) return text

      const searchTerms = searchQuery.value.toLowerCase().split(' ').filter(term => term.length > 0)
      const searchTermPositions = []
      
      searchTerms.forEach(term => {
        let pos = text.toLowerCase().indexOf(term.toLowerCase())
        while (pos !== -1) {
          searchTermPositions.push({ start: pos, end: pos + term.length })
          pos = text.toLowerCase().indexOf(term.toLowerCase(), pos + 1)
        }
      })

      if (searchTermPositions.length === 0) {
        return text.substring(0, maxLength) + '...'
      }

      const firstMatch = Math.min(...searchTermPositions.map(p => p.start))
      const lastMatch = Math.max(...searchTermPositions.map(p => p.end))
      
      let start = Math.max(0, firstMatch - 40)
      let end = Math.min(text.length, lastMatch + 40)
      
      if (end - start > maxLength) {
        if (firstMatch - start > lastMatch - end) {
          start = end - maxLength
        } else {
          end = start + maxLength
        }
      }

      return (start > 0 ? '...' : '') +
             text.substring(start, end) +
             (end < text.length ? '...' : '')
    }

    const highlightSearchTerms = (text) => {
      if (!text || !searchQuery.value) return text
      
      let highlighted = text
      const searchTerms = searchQuery.value.toLowerCase().split(' ').filter(term => term.length > 0)
      
      searchTerms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi')
        highlighted = highlighted.replace(regex, '<span class="highlight">$1</span>')
      })
      
      return highlighted
    }

    const getFirstChar = (displayName) => {
      return displayName ? displayName.charAt(0) : '?'
    }

    const downloadDocuments = () => {
      const jsonString = JSON.stringify(documents.value, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'documents.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    const showJsonDiffViewer = () => {
      showingJsonDiffViewer.value = true
    }

    const resetToDefault = () => {
      if (confirm('データをリセットしてもよろしいですか？\n※この操作は元に戻せません。')) {
        saveToLocalStorage(documentsData)
      }
    }

    return {
      searchQuery,
      isSearchFocused,
      filteredDocuments,
      documents,
      showingJsonDiffViewer,
      formatDisplayName,
      getFirstChar,
      getMatchingContent,
      highlightSearchTerms,
      downloadDocuments,
      showJsonDiffViewer,
      resetToDefault
    }
  }
}
</script>

<style scoped>
@import '../styles/common.css';

.page {
  min-height: 100vh;
  background-color: #f7f9fa;
  display: flex;
}

.container {
  flex: 1;
  padding: 20px 40px;
  margin-left: 280px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(700px, 1fr));
  gap: 20px;
}

.page-header {
  background-color: #1da1f2;
  color: #ffffff;
  padding: 20px 40px;
  position: relative;
  border-radius: 12px 12px 0 0;
  margin-bottom: 0;
  display: flex;
  align-items: center;
  grid-column: 1 / -1;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  flex: 1;
  text-align: left;
  word-break: break-word;
}

.search-container {
  margin: 20px 0;
  padding: 0;
  grid-column: 1 / -1;
}

.search-input {
  width: 100%;
  padding: 12px 20px;
  border: 2px solid #e1e8ed;
  border-radius: 30px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.documents-grid {
  display: contents;
}

.card {
  width: 100%;
  background-color: #ffffff;
  border: 1px solid #e1e8ed;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.sidebar {
  width: 280px;
  background-color: #ffffff;
  border-right: 1px solid #e1e8ed;
  padding: 20px;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  left: 0;
  top: 0;
  z-index: 100;
}

.sidebar-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-button {
  width: 100%;
  justify-content: flex-start;
  padding: 12px 16px;
}

.document-header {
  display: flex;
  align-items: center;
  padding: 20px;
  text-decoration: none;
  color: inherit;
  background: #f7f9fa;
  border-bottom: 1px solid #e1e8ed;
  transition: background-color 0.2s ease;
}

.document-header:hover {
  background: #f0f3f5;
}

.document-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #1da1f2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 20px;
  flex-shrink: 0;
  margin-right: 16px;
}

.document-info {
  flex: 1;
  min-width: 0;
}

.document-name {
  font-size: 18px;
  font-weight: bold;
  color: #14171a;
  margin-bottom: 4px;
  word-wrap: break-word;
}

.revision-badge {
  display: inline-block;
  padding: 4px 8px;
  background-color: #e8f5fd;
  color: #1da1f2;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.document-actions {
  padding: 16px 20px;
  display: flex;
  gap: 16px;
}

.search-matches {
  padding: 12px 20px;
}

.match-item {
  margin: 12px 0;
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
}

.match-link {
  display: block;
  padding: 12px;
  text-decoration: none;
  color: inherit;
  transition: background-color 0.2s ease;
}

.match-link:hover {
  background: #f0f3f5;
}

.match-header {
  margin-bottom: 8px;
}

.match-index {
  display: inline-block;
  padding: 4px 8px;
  background: #e8f5fd;
  color: #1da1f2;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.match-content {
  font-size: 14px;
  line-height: 1.5;
  color: #14171a;
}

.footer {
  background-color: #ffffff;
  border-top: 1px solid #e1e8ed;
  padding: 16px;
  position: sticky;
  bottom: 0;
  z-index: 100;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
}

.footer-buttons {
  display: flex;
  justify-content: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  padding: 0 20px;
}

.warning-button {
  background-color: #fee2e2;
  color: #ef4444;
  border: none;
}

.warning-button:hover {
  background-color: #fecaca;
}

@media (max-width: 768px) {
  .page {
    flex-direction: column;
  }

  .container {
    margin-left: 0;
    padding: 10px;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .page-header {
    padding: 15px 20px;
  }

  .page-header h1 {
    font-size: 18px;
  }

  .search-container {
    margin: 16px 0;
  }

  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
    border-right: none;
    border-bottom: 1px solid #e1e8ed;
  }

  .sidebar-buttons {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }

  .sidebar-button {
    width: auto;
    min-width: 200px;
  }

  .document-header {
    padding: 16px;
  }

  .document-icon {
    width: 40px;
    height: 40px;
    font-size: 16px;
    margin-right: 12px;
  }

  .document-name {
    font-size: 16px;
  }

  .document-actions {
    padding: 12px 16px;
    flex-direction: column;
    gap: 12px;
  }

  .search-matches {
    padding: 8px 16px;
  }

  .footer-buttons {
    padding: 0 10px;
    gap: 8px;
  }

  .action-button {
    width: auto;
    min-width: 200px;
  }
}

@media (min-width: 1920px) {
  .documents-grid {
    grid-template-columns: repeat(auto-fit, minmax(800px, 1fr));
  }
}
</style>