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
            
            <div class="document-actions">
              <router-link 
                v-if="doc.revisions"
                :to="`/revisions/${id}`" 
                class="action-button revision-button"
              >
                <i class="fas fa-history"></i>
                改訂履歴を表示
              </router-link>
              <a 
                v-if="doc.public_comment && doc.url" 
                :href="doc.url" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="action-button original-button"
              >
                <i class="fas fa-external-link-alt"></i>
                原文を表示
              </a>
            </div>

            <div v-if="searchQuery && getMatchingContent(doc, id).length > 0" class="search-matches">
              <div v-for="(match, index) in getMatchingContent(doc, id)" :key="index" class="match-item">
                <router-link 
                  :to="getMatchLink(match, id)"
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
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import documentsData from '../documents.json'
import JsonDiffViewer from './JsonDiffViewer.vue'

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

    const searchQuery = computed({
      get: () => route.query.q || '',
      set: (value) => {
        router.replace({
          query: { ...route.query, q: value || undefined }
        })
      }
    })

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
      return name?.replace(/<br>/gi, '') || ''
    }

    const getSearchableContent = (doc) => {
      let contents = []

      // ツイートの検索
      if (doc.tweets) {
        contents = contents.concat(doc.tweets.map(t => t.content))
      }

      // パブリックコメントの検索
      if (doc.public_comment) {
        contents = contents.concat(doc.questions.map(q => `${q.question} ${q.answer}`))
      }

      // 改訂履歴の検索
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

    const getMatchLink = (match, docId) => {
      if (match.type.startsWith('改訂')) {
        return {
          path: `/revisions/${docId}/${match.revisionId}`,
          query: { 
            highlight: match.content
          }
        }
      } else if (match.type.startsWith('質問') || match.type.startsWith('回答')) {
        return {
          path: `/document/${docId}/${match.id}`,
          query: { 
            type: 'public_comment',
            back: '/',
            highlight: match.content
          }
        }
      } else {
        return {
          path: `/document/${docId}/${match.id}`,
          query: { 
            back: '/',
            highlight: match.content
          }
        }
      }
    }

    const getMatchingContent = (doc, docId) => {
      if (!searchQuery.value) return []

      const matches = []
      const maxLength = 150
      const searchTerms = searchQuery.value.toLowerCase().split(' ').filter(term => term.length > 0)

      // 通常のツイート検索
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

      // パブリックコメント検索
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

      // 改訂履歴検索
      if (doc.revisions) {
        doc.revisions.forEach(rev => {
          if (containsAllSearchTerms(rev.title) || containsAllSearchTerms(rev.description)) {
            matches.push({
              type: `改訂 ${rev.title}`,
              content: truncateText(rev.description || rev.title, maxLength),
              revisionId: rev.id
            })
          }

          rev.articles.forEach(article => {
            const beforeContent = article.before || ''
            const afterContent = article.after || ''
            
            if (containsAllSearchTerms(beforeContent) || containsAllSearchTerms(afterContent)) {
              matches.push({
                type: `改訂 ${rev.title}`,
                content: truncateText(`${beforeContent} ${afterContent}`, maxLength),
                revisionId: rev.id
              })
            }
          })
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
      getMatchingContent,
      getMatchLink,
      highlightSearchTerms,
      downloadDocuments,
      showJsonDiffViewer,
      resetToDefault
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
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

h1 {
  text-align: center;
  margin: 0 0 20px 0;
  color: #14171a;
  font-size: 28px;
}

.search-container {
  margin: 20px 0;
  display: flex;
  justify-content: center;
}

.search-input {
  width: 100%;
  max-width: 800px;
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
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.document-item {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 12px;
  overflow: hidden;
}

.document-header {
  display: flex;
  align-items: center;
  padding: 16px;
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
  padding: 12px 16px;
  border-top: 1px solid #e1e8ed;
  display: flex;
  gap: 12px;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.revision-button {
  background-color: #e8f5fd;
  color: #1da1f2;
  border: none;
}

.revision-button:hover {
  background-color: #d8effd;
}

.original-button {
  background-color: #f3f4f6;
  color: #4b5563;
  border: none;
}

.original-button:hover {
  background-color: #e5e7eb;
}

.search-matches {
  padding: 8px 16px;
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

:deep(.highlight) {
  background-color: #fff3cd;
  padding: 2px 0;
  border-radius: 2px;
  font-weight: 500;
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
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.footer-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #1da1f2;
  border-radius: 20px;
  background: none;
  color: #1da1f2;
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}

.footer-button:hover {
  background-color: rgba(29, 161, 242, 0.1);
}

.footer-button.warning {
  border-color: #e0245e;
  color: #e0245e;
}

.footer-button.warning:hover {
  background-color: rgba(224, 36, 94, 0.1);
}

@media (max-width: 768px) {
  .main-content {
    padding: 16px;
  }

  .container {
    padding: 0;
  }

  .document-list {
    grid-template-columns: 1fr;
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

  .search-matches {
    padding: 8px 12px;
  }

  .footer {
    padding: 12px;
  }

  .footer-buttons {
    gap: 8px;
  }

  .footer-button {
    padding: 6px 12px;
    font-size: 12px;
  }
}

@media (min-width: 1920px) {
  .container {
    max-width: 1800px;
  }

  .document-list {
    grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  }
}
</style>