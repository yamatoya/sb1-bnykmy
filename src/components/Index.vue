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
      <router-link v-for="(doc, id) in filteredDocuments" :key="id" :to="`/document/${id}`">
        <div class="document-item">
          <div class="document-icon">{{ doc.displayName.charAt(0) }}</div>
          <div class="document-info">
            <div class="document-name">{{ formatDisplayName(doc.displayName) }}</div>
            <div v-if="doc.revisions" class="revision-badge">
              改訂あり ({{ doc.revisions.length }}件)
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
    filteredDocuments() {
      if (!this.searchQuery) return this.documents

      const searchTerms = this.searchQuery.toLowerCase().split(' ').filter(term => term.length > 0)
      return Object.fromEntries(
        Object.entries(this.documents).filter(([_, doc]) => {
          const searchableContent = [
            doc.displayName,
            ...(doc.tweets?.map(t => t.content) || []),
            ...(doc.revisions?.flatMap(r => 
              r.articles.map(a => [a.before, a.after].filter(Boolean).join(' '))
            ) || [])
          ].join(' ').toLowerCase()
          
          return searchTerms.every(term => searchableContent.includes(term))
        })
      )
    }
  },
  methods: {
    formatDisplayName(name) {
      return name.replace(/<br>/gi, '')
    }
  }
}
</script>

<style scoped>
.document-list {
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

.revision-badge {
  display: inline-block;
  background-color: #17bf63;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  margin-top: 4px;
}

.search-container {
  margin: 20px 0;
  padding: 0 20px;
}

.search-input {
  width: 100%;
  max-width: 400px;
  padding: 8px 12px;
  border: 1px solid #e1e8ed;
  border-radius: 20px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #1da1f2;
  box-shadow: 0 0 0 2px rgba(29, 161, 242, 0.1);
}

h1 {
  text-align: center;
  margin: 0;
  padding: 20px;
  color: #14171a;
}

a {
  text-decoration: none;
}
</style>