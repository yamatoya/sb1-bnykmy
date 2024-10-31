<template>
  <div v-if="document">
    <div class="profile-header">
      <router-link to="/" class="back-link">←</router-link>
      <h1>{{ formatDisplayName(document.displayName) }}</h1>
      <div class="document-actions">
        <router-link 
          v-if="document.revisions"
          :to="`/document/${$route.params.id}/revisions`" 
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
import documentsData from '../documents.json'

export default {
  name: 'Document',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const document = ref(null)
    const isSearchFocused = ref(false)

    onMounted(() => {
      document.value = documentsData[route.params.id]
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
      return name?.replace(/<br>/gi, '\n') || ''
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
      formatDisplayName,
      highlightContent,
      goToItem
    }
  }
}
</script>

<style scoped>
.profile-header {
  background-color: #f0f0f0;
  padding: 20px;
  margin-bottom: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.back-link {
  position: absolute;
  left: 20px;
  font-size: 24px;
  text-decoration: none;
  color: #1da1f2;
}

h1 {
  text-align: center;
  margin: 0;
  padding: 0 40px;
  color: #14171a;
  white-space: pre-line;
}

.document-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.revision-link,
.original-doc-btn {
  background-color: #1da1f2;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  text-decoration: none;
  font-size: 14px;
  font-weight: bold;
  transition: background-color 0.2s ease;
}

.revision-link:hover,
.original-doc-btn:hover {
  background-color: #1991db;
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

.tweets {
  margin-top: 20px;
}

.tweet {
  background-color: #ffffff;
  border: 1px solid #e1e8ed;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 10px;
  cursor: pointer;
}

.tweet:hover {
  background-color: #f8f9fa;
}

.tweet-header {
  margin-bottom: 10px;
}

.index {
  font-weight: bold;
  color: #1da1f2;
}

.qa-content {
  margin-top: 10px;
  background-color: #ffffff;
  border-radius: 8px;
}

.question,
.answer {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  position: relative;
}

.question {
  border-left: 4px solid #1da1f2;
}

.answer {
  border-left: 4px solid #17bf63;
}

.qa-label {
  font-size: 0.85em;
  font-weight: bold;
  color: #657786;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.question .qa-label {
  color: #1da1f2;
}

.answer .qa-label {
  color: #17bf63;
}

.tweet-content {
  font-size: 16px;
  line-height: 1.5;
  margin: 0;
  padding-left: 0;
  white-space: pre-line;
}

.meta-info {
  margin-top: 10px;
  font-size: 12px;
  color: #657786;
}

.link-count,
.public-comment-count {
  margin-right: 15px;
}

@media (max-width: 480px) {
  .profile-header {
    padding-top: 60px;
  }

  .document-actions {
    width: 100%;
  }

  .revision-link,
  .original-doc-btn {
    width: 100%;
    text-align: center;
  }
}
</style>