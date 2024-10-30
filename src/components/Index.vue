<template>
  <div>
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
      <router-link v-for="(doc, id) in filteredDocuments" :key="id" :to="'/document/' + id">
        <div class="document-item">
          <div class="document-icon">{{ doc.displayName.charAt(0) }}</div>
          <div class="document-info">
            <div class="document-name">{{ formatDisplayName(doc.displayName) }}</div>
            <div v-if="searchQuery && getMatchingContent(doc).length > 0" class="search-matches">
              <div v-for="(match, index) in getMatchingContent(doc)" :key="index" class="match-item">
                <router-link 
                  :to="`/document/${id}/${match.id}`"
                  class="match-link"
                  @click.native.stop
                >
                  <div class="match-content" v-html="highlightSearchTerms(match.content)"></div>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script>
import documentsData from '../documents.json'

export default {
  name: 'Index',
  data() {
    return {
      documents: documentsData,
      isSearchFocused: false
    }
  },
  computed: {
    searchQuery: {
      get() {
        return this.$route.query.q || ''
      },
      set(value) {
        this.$router.replace({
          query: { ...this.$route.query, q: value || undefined }
        })
      }
    },
    searchTerms() {
      return this.searchQuery.toLowerCase().split(' ').filter(term => term.length > 0)
    },
    filteredDocuments() {
      if (!this.searchQuery) return this.documents

      return Object.fromEntries(
        Object.entries(this.documents).filter(([_, doc]) => {
          const contents = this.getSearchableContent(doc)
          return this.searchTerms.every(term => contents.toLowerCase().includes(term))
        })
      )
    }
  },
  methods: {
    formatDisplayName(name) {
      return name.replace(/<br>/gi, '')
    },
    getSearchableContent(doc) {
      if (doc.public_comment) {
        return doc.questions.map(q => 
          `${q.question} ${q.answer}`
        ).join(' ')
      } else {
        return doc.tweets.map(t => t.content).join(' ')
      }
    },
    getMatchingContent(doc) {
      if (!this.searchQuery) return []

      const matches = []
      const maxLength = 100

      if (doc.public_comment) {
        doc.questions.forEach(q => {
          if (this.containsAllSearchTerms(q.question)) {
            matches.push({
              content: this.truncateText(q.question, maxLength),
              id: q.id
            })
          }
          if (this.containsAllSearchTerms(q.answer)) {
            matches.push({
              content: this.truncateText(q.answer, maxLength),
              id: q.id
            })
          }
        })
      } else {
        doc.tweets.forEach(tweet => {
          if (this.containsAllSearchTerms(tweet.content)) {
            matches.push({
              content: this.truncateText(tweet.content, maxLength),
              id: tweet.id
            })
          }
        })
      }

      return matches.slice(0, 3)
    },
    containsAllSearchTerms(text) {
      const lowerText = text.toLowerCase()
      return this.searchTerms.every(term => lowerText.includes(term))
    },
    truncateText(text, maxLength) {
      if (text.length <= maxLength) return text

      const searchTermPositions = []
      this.searchTerms.forEach(term => {
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
      
      let start = Math.max(0, firstMatch - 20)
      let end = Math.min(text.length, lastMatch + 20)
      
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
    },
    highlightSearchTerms(text) {
      let highlighted = text
      this.searchTerms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi')
        highlighted = highlighted.replace(regex, '<span class="highlight">$1</span>')
      })
      return highlighted
    }
  }
}
</script>

<style scoped>
.search-container {
  margin: 20px 0;
  padding: 0 20px;
  max-width: 100%;
}

.search-input {
  width: 200px;
  padding: 8px 12px;
  border: 1px solid #e1e8ed;
  border-radius: 20px;
  font-size: 16px;
  transition: all 0.3s ease;
  max-width: calc(100% - 24px);
  -webkit-appearance: none;
  appearance: none;
}

@media (hover: hover) {
  .search-input:focus {
    width: 100%;
    outline: none;
    border-color: #1da1f2;
    box-shadow: 0 0 0 2px rgba(29, 161, 242, 0.1);
  }
}

@supports (-webkit-touch-callout: none) {
  .search-input:focus {
    width: calc(100% - 24px);
    outline: none;
    border-color: #1da1f2;
    box-shadow: 0 0 0 2px rgba(29, 161, 242, 0.1);
  }
}

.document-list {
  margin-top: 20px;
}

.document-item {
  display: flex;
  align-items: flex-start;
  padding: 15px;
  border-bottom: 1px solid #e6ecf0;
  transition: background-color 0.2s ease;
}

.document-item:hover {
  background-color: #f8f9fa;
}

.document-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #1da1f2;
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 20px;
  flex-shrink: 0;
}

.document-info {
  flex-grow: 1;
  min-width: 0;
}

.document-name {
  color: #14171a;
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 4px;
  word-wrap: break-word;
}

.search-matches {
  margin-top: 8px;
}

.match-item {
  margin-top: 8px;
  font-size: 14px;
  color: #657786;
  line-height: 1.4;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.match-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.match-link:hover {
  background-color: #edf0f2;
  border-radius: 4px;
}

.match-content {
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.highlight) {
  background-color: #fff3cd;
  color: #856404;
  padding: 0 2px;
  border-radius: 2px;
}

h1 {
  text-align: center;
  margin: 0;
  padding: 20px;
  color: #14171a;
}
</style>