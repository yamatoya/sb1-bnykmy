<template>
  <div class="layout">
    <main class="main-content">
      <div class="container">
        <h1>法律文書一覧</h1>
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
        <div class="document-list">
          <div v-for="(doc, id) in filteredDocuments" :key="id" class="document-item">
            <router-link :to="`/document/${id}`" class="document-header">
              <div class="document-icon">{{ doc.displayName.charAt(0) }}</div>
              <div class="document-info">
                <div class="document-name">{{ formatDisplayName(doc.displayName) }}</div>
                <div v-if="doc.revisions" class="revision-badge">
                  改訂あり ({{ doc.revisions.length }}件)
                </div>
              </div>
            </router-link>
            
            <div v-if="searchQuery && getMatchingContent(doc, id).length > 0" class="search-matches">
              <div v-for="(match, index) in getMatchingContent(doc, id)" :key="index" class="match-item">
                <router-link 
                  :to="match.link"
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
    </main>

    <footer class="footer">
      <div class="footer-content">
        <div class="footer-buttons">
          <button class="footer-button" @click="downloadDocuments">
            <i class="fas fa-download"></i>
            <span>JSONをダウンロード</span>
          </button>
          <button class="footer-button" @click="showJsonDiffViewer">
            <i class="fas fa-code"></i>
            <span>JSON差分を表示</span>
          </button>
          <button class="footer-button" @click="showRevisionList">
            <i class="fas fa-edit"></i>
            <span>改訂履歴を編集</span>
          </button>
          <button class="footer-button warning" @click="resetToDefault">
            <i class="fas fa-sync-alt"></i>
            <span>データをリセット</span>
          </button>
        </div>
      </div>
    </footer>

    <json-diff-viewer
      v-if="showingJsonDiffViewer"
      @close="showingJsonDiffViewer = false"
    />

    <revision-list
      v-if="showingRevisionList"
      :documents="documents"
      @save="updateRevisions"
      @close="showingRevisionList = false"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import documentsData from '../documents.json'
import JsonDiffViewer from './JsonDiffViewer.vue'
import RevisionList from './RevisionList.vue'

const STORAGE_KEY = 'legal-documents-data'

export default {
  name: 'Index',
  components: {
    JsonDiffViewer,
    RevisionList
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const isSearchFocused = ref(false)
    const documents = ref(documentsData)
    const showingJsonDiffViewer = ref(false)
    const showingRevisionList = ref(false)
    const searchQuery = ref('')

    onMounted(() => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          documents.value = JSON.parse(storedData)
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

    watch(searchQuery, (newValue) => {
      router.replace({
        query: { ...route.query, q: newValue || undefined }
      })
    })

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

    const formatDisplayName = (name) => {
      return name.replace(/<br>/gi, '')
    }

    const getSearchableContent = (doc) => {
      if (doc.public_comment) {
        return doc.questions.map(q => 
          `${q.question} ${q.answer}`
        ).join(' ')
      } else if (doc.revisions) {
        return doc.revisions.flatMap(rev => 
          rev.articles.map(article => 
            `${article.before || ''} ${article.after || ''}`
          )
        ).join(' ')
      } else {
        return doc.tweets.map(t => t.content).join(' ')
      }
    }

    const getMatchingContent = (doc, docId) => {
      if (!searchQuery.value) return []

      const matches = []
      const maxLength = 150

      if (doc.public_comment) {
        doc.questions.forEach(q => {
          if (containsAllSearchTerms(q.question)) {
            matches.push({
              type: `質問 ${q.index}`,
              content: truncateText(q.question, maxLength),
              link: `/document/${docId}/${q.id}`
            })
          }
          if (containsAllSearchTerms(q.answer)) {
            matches.push({
              type: `回答 ${q.index}`,
              content: truncateText(q.answer, maxLength),
              link: `/document/${docId}/${q.id}`
            })
          }
        })
      } else if (doc.revisions) {
        doc.revisions.forEach(rev => {
          rev.articles.forEach(article => {
            const content = article.after || article.before
            if (containsAllSearchTerms(content)) {
              matches.push({
                type: `改訂 ${rev.title}`,
                content: truncateText(content, maxLength),
                link: `/document/${docId}/revisions?revision=${rev.id}`
              })
            }
          })
        })
      } else if (doc.tweets) {
        doc.tweets.forEach(tweet => {
          if (containsAllSearchTerms(tweet.content)) {
            matches.push({
              type: `${tweet.index}`,
              content: truncateText(tweet.content, maxLength),
              link: `/document/${docId}/${tweet.id}`
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

    const showRevisionList = () => {
      showingRevisionList.value = true
    }

    const resetToDefault = () => {
      if (confirm('データをリセットしてもよろしいですか？\n※この操作は元に戻せません。')) {
        saveToLocalStorage(documentsData)
      }
    }

    const updateRevisions = ({ documentId, revisions }) => {
      const updatedDocuments = { ...documents.value }
      updatedDocuments[documentId].revisions = revisions
      saveToLocalStorage(updatedDocuments)
      showingRevisionList.value = false
    }

    return {
      searchQuery,
      isSearchFocused,
      filteredDocuments,
      documents,
      showingJsonDiffViewer,
      showingRevisionList,
      formatDisplayName,
      getMatchingContent,
      highlightSearchTerms,
      downloadDocuments,
      showJsonDiffViewer,
      showRevisionList,
      resetToDefault,
      updateRevisions
    }
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  background-color: #f7f9fa;
  padding: 20px;
  width: 100%;
}

.container {
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

h1 {
  text-align: center;
  margin: 0 0 20px 0;
  color: #14171a;
  font-size: 2em;
}

.search-container {
  margin: 20px auto;
  max-width: 800px;
  padding: 0 20px;
}

.search-input {
  width: 100%;
  padding: 12px 20px;
  border: 2px solid #e1e8ed;
  border-radius: 30px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #1da1f2;
  box-shadow: 0 0 0 2px rgba(29, 161, 242, 0.1);
}

.document-list {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 20px;
}

.document-item {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.document-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.document-header {
  display: flex;
  align-items: center;
  padding: 16px;
  text-decoration: none;
  color: inherit;
  background: #f7f9fa;
  border-bottom: 1px solid #e1e8ed;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.search-matches {
  padding: 8px 16px;
}

.match-item {
  margin: 8px 0;
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

:deep(.highlight) {
  background-color: #fff3cd;
  padding: 2px 0;
  border-radius: 2px;
  font-weight: 500;
}

.footer {
  background-color: #ffffff;
  border-top: 1px solid #e1e8ed;
  padding: 16px 0;
  width: 100%;
  margin-top: auto;
}

.footer-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
}

.footer-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.footer-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #e1e8ed;
  border-radius: 20px;
  background: white;
  color: #1da1f2;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.footer-button:hover {
  background-color: #f8f9fa;
  border-color: #1da1f2;
}

.footer-button.warning {
  color: #e0245e;
  border-color: #e0245e;
}

.footer-button.warning:hover {
  background-color: #fff1f3;
}

.footer-button i {
  font-size: 16px;
}

@media (min-width: 1800px) {
  .document-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1400px) {
  .document-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1100px) {
  .document-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 16px;
  }

  .search-container {
    padding: 0 16px;
  }

  .document-list {
    padding: 0 16px;
    gap: 16px;
  }

  .document-header {
    padding: 12px;
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

  .footer {
    padding: 12px 0;
  }

  .footer-buttons {
    gap: 12px;
  }

  .footer-button {
    padding: 6px 12px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .search-input {
    padding: 10px 16px;
    font-size: 14px;
  }

  .footer-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .footer-button {
    justify-content: center;
  }
}
</style>