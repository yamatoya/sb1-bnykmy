<template>
  <div v-if="document">
    <div class="profile-header">
      <router-link to="/" class="back-link">←</router-link>
      <h1>{{ formatDisplayName(document.displayName) }}</h1>
      <div class="document-actions">
        <router-link 
          v-if="document.revisions"
          :to="`/revisions/${$route.params.id}`" 
          class="revision-link"
        >
          改訂履歴を表示
        </router-link>
        <a v-if="document.public_comment && document.url" 
           :href="document.url" 
           target="_blank" 
           rel="noopener noreferrer" 
           class="original-doc-btn">
          原文を表示
        </a>
      </div>
    </div>

    <!-- 関連する改訂履歴へのリンク -->
    <div v-if="document.public_comment && linkedRevisions.length > 0" class="linked-revisions">
      <h2>関連する改訂履歴</h2>
      <div class="revision-links">
        <router-link
          v-for="revision in linkedRevisions"
          :key="`${revision.documentId}-${revision.id}`"
          :to="`/revisions/${revision.documentId}`"
          class="revision-link-item"
        >
          <div class="revision-link-header">
            <span class="document-name">{{ formatDisplayName(revision.documentName) }}</span>
            <span class="revision-title">{{ revision.title }}</span>
          </div>
          <div v-if="revision.description" class="revision-description">
            {{ revision.description }}
          </div>
          <div class="revision-date">
            {{ formatDate(revision.date) }}
          </div>
        </router-link>
      </div>
    </div>

    <div class="search-container">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="検索..."
        class="search-input"
        @focus="isSearchFocused = true"
        @blur="isSearchFocused = false"
      />
    </div>

    <div class="tweets">
      <div v-for="item in filteredItems" :key="item.id" class="tweet" @click="goToItem(item.id)">
        <div class="tweet-header">
          <span class="index">{{ item.index }}</span>
        </div>
        <template v-if="document.public_comment">
          <div class="qa-content">
            <div class="question">
              <div class="qa-label">質問</div>
              <p class="tweet-content" v-html="highlightContent(item.question)"></p>
            </div>
            <div class="answer">
              <div class="qa-label">回答</div>
              <p class="tweet-content" v-html="highlightContent(item.answer)"></p>
            </div>
            <div class="meta-info">
              <span v-if="item.links" class="link-count">関連リンク({{ item.links.length }})</span>
            </div>
          </div>
        </template>
        <template v-else>
          <p class="tweet-content" v-html="highlightContent(item.content)"></p>
          <div class="meta-info">
            <span v-if="item.links" class="link-count">関連リンク({{ item.links.length }})</span>
            <span v-if="item.public_comment_links" class="public-comment-count">
              パブリックコメント({{ item.public_comment_links.length }})
            </span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const STORAGE_KEY = 'legal-documents-data'

export default {
  name: 'Document',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const document = ref(null)
    const isSearchFocused = ref(false)
    const documents = ref(null)

    onMounted(() => {
      loadDocuments()
    })

    const loadDocuments = () => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          documents.value = JSON.parse(storedData)
          document.value = documents.value[route.params.id]
        } catch (e) {
          console.error('Failed to parse stored documents:', e)
        }
      }
    }

    const linkedRevisions = computed(() => {
      if (!documents.value || !document.value?.public_comment) return []

      const revisions = []
      Object.entries(documents.value).forEach(([docId, doc]) => {
        if (doc.revisions) {
          doc.revisions.forEach(revision => {
            if (revision.publicCommentLinks?.includes(route.params.id)) {
              revisions.push({
                documentId: docId,
                documentName: doc.displayName,
                id: revision.id,
                title: revision.title,
                description: revision.description,
                date: revision.date
              })
            }
          })
        }
      })

      return revisions.sort((a, b) => new Date(b.date) - new Date(a.date))
    })

    const searchQuery = computed({
      get: () => route.query.q || '',
      set: (value) => {
        router.replace({
          query: { ...route.query, q: value || undefined }
        })
      }
    })

    const filteredItems = computed(() => {
      if (!document.value) return []
      
      const items = document.value.public_comment ? document.value.questions : document.value.tweets
      if (!searchQuery.value) return items

      const searchTerms = searchQuery.value.toLowerCase().split(' ').filter(term => term.length > 0)
      
      return items.filter(item => {
        const content = document.value.public_comment
          ? `${item.question} ${item.answer}`
          : item.content
        const searchContent = content.toLowerCase()
        
        return searchTerms.every(term => searchContent.includes(term))
      })
    })

    const formatDisplayName = (name) => {
      return name?.replace(/<br>/gi, '') || ''
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    const highlightContent = (text) => {
      if (!text) return ''
      return text.replace(/<br>/gi, '\n')
    }

    const goToItem = (itemId) => {
      router.push({
        path: `/document/${route.params.id}/${itemId}`,
        query: { back: route.fullPath }
      })
    }

    return {
      document,
      isSearchFocused,
      searchQuery,
      filteredItems,
      linkedRevisions,
      formatDisplayName,
      formatDate,
      highlightContent,
      goToItem
    }
  }
}
</script>

<style scoped>
.linked-revisions {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  margin: 20px;
  padding: 20px;
}

.linked-revisions h2 {
  font-size: 18px;
  color: #14171a;
  margin: 0 0 16px 0;
}

.revision-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.revision-link-item {
  display: block;
  padding: 16px;
  background-color: #f8f9fa;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: background-color 0.2s ease;
}

.revision-link-item:hover {
  background-color: #f0f3f5;
}

.revision-link-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.document-name {
  font-weight: bold;
  color: #14171a;
}

.revision-title {
  color: #1da1f2;
}

.revision-description {
  font-size: 14px;
  color: #657786;
  margin-bottom: 8px;
}

.revision-date {
  font-size: 12px;
  color: #657786;
}

.profile-header {
  background-color: #f0f0f0;
  padding: 20px;
  margin-bottom: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 80px;
}

.back-link {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 24px;
  text-decoration: none;
  color: #1da1f2;
  z-index: 1;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

h1 {
  margin: 0;
  padding: 0 60px;
  text-align: center;
  font-size: 1.5em;
  max-width: 100%;
  word-break: break-word;
  box-sizing: border-box;
}

.document-actions {
  margin-top: 12px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.revision-link,
.original-doc-btn {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  text-decoration: none;
  transition: background-color 0.2s ease;
}

.revision-link {
  background-color: #e8f5fd;
  color: #1da1f2;
}

.revision-link:hover {
  background-color: #d8effd;
}

.original-doc-btn {
  background-color: #f3f4f6;
  color: #4b5563;
}

.original-doc-btn:hover {
  background-color: #e5e7eb;
}

.search-container {
  margin: 20px;
  display: flex;
  justify-content: center;
}

.search-input {
  width: 100%;
  max-width: 600px;
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

.tweets {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.tweet {
  background-color: #ffffff;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.tweet:hover {
  background-color: #f8f9fa;
}

.tweet-header {
  margin-bottom: 12px;
}

.index {
  font-weight: bold;
  color: #14171a;
}

.tweet-content {
  font-size: 16px;
  line-height: 1.5;
  color: #2d3748;
  white-space: pre-wrap;
  word-break: break-word;
}

.meta-info {
  margin-top: 12px;
  display: flex;
  gap: 12px;
}

.link-count,
.public-comment-count {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background-color: #f3f4f6;
  border-radius: 12px;
  font-size: 12px;
  color: #4b5563;
}

.qa-content {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.question,
.answer {
  margin-bottom: 16px;
}

.qa-label {
  font-weight: bold;
  color: #4b5563;
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .profile-header {
    padding: 16px;
  }

  h1 {
    font-size: 1.2em;
    padding: 0 40px;
  }

  .document-actions {
    flex-wrap: wrap;
  }

  .search-container {
    margin: 16px;
  }

  .tweets {
    padding: 0 16px;
  }

  .tweet {
    padding: 12px;
  }

  .linked-revisions {
    margin: 16px;
    padding: 16px;
  }

  .revision-link-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>