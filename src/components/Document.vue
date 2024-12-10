<template>
  <div v-if="document">
    <div class="profile-header">
      <router-link to="/" class="back-link">←</router-link>
      <h1>{{ formatDisplayName(document.displayName) }}</h1>
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
              <div class="qa-label">
                <i class="fas fa-question-circle"></i>
                質問
              </div>
              <p class="tweet-content" v-html="highlightContent(item.question)"></p>
            </div>
            <div class="answer">
              <div class="qa-label">
                <i class="fas fa-comment-dots"></i>
                回答
              </div>
              <p class="tweet-content" v-html="highlightContent(item.answer)"></p>
            </div>
            <div v-if="item.links?.length" class="meta-info">
              <span class="link-count">
                <i class="fas fa-link"></i>
                関連リンク({{ item.links.length }})
              </span>
            </div>
          </div>
        </template>
        <template v-else>
          <p class="tweet-content" v-html="highlightContent(item.content)"></p>
          <div v-if="hasMetaInfo(item)" class="meta-info">
            <span v-if="item.links?.length" class="link-count">
              <i class="fas fa-link"></i>
              関連リンク({{ item.links.length }})
            </span>
            <span v-if="item.public_comment_links?.length" class="public-comment-count">
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
import { formatDisplayName, formatDate } from '../utils/formatters'

const STORAGE_KEY = 'legal-documents-data'

export default {
  name: 'Document',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const document = ref(null)
    const isSearchFocused = ref(false)

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

    const highlightContent = (text) => {
      if (!text || !searchQuery.value) return text
      let content = text
      
      const searchTerms = searchQuery.value.toLowerCase().split(' ').filter(term => term.length > 0)
      searchTerms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi')
        content = content.replace(regex, '<span class="highlight">$1</span>')
      })
      
      return content
    }

    const hasMetaInfo = (item) => {
      return (item.links?.length > 0) || (item.public_comment_links?.length > 0)
    }

    const goToItem = (itemId) => {
      router.push({
        path: `/document/${route.params.id}/${itemId}`,
        query: { 
          back: route.fullPath,
          highlight: searchQuery.value
        }
      })
    }

    onMounted(() => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          const documents = JSON.parse(storedData)
          document.value = documents[route.params.id]
        } catch (e) {
          console.error('Failed to parse stored documents:', e)
        }
      }
    })

    return {
      document,
      isSearchFocused,
      searchQuery,
      filteredItems,
      formatDisplayName,
      formatDate,
      highlightContent,
      goToItem,
      hasMetaInfo
    }
  }
}
</script>

<style scoped>
.profile-header {
  background-color: #ffffff;
  padding: 20px;
  margin-bottom: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 80px;
  border: 1px solid #e1e8ed;
  border-radius: 12px;
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
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.tweet + .tweet {
  border-top: none;
}

.tweet:first-child {
  border-radius: 12px 12px 0 0;
}

.tweet:last-child {
  border-radius: 0 0 12px 12px;
}

.tweet:hover {
  background-color: #f8f9fa;
}

.tweet-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e1e8ed;
}

.index {
  font-weight: bold;
  color: #14171a;
}

.tweet-content {
  font-size: 16px;
  line-height: 1.6;
  color: #2d3748;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  padding: 12px 16px;
}

.qa-content {
  background-color: #ffffff;
}

.question {
  background-color: #f8f9fa;
  border-bottom: 1px solid #e1e8ed;
  padding: 20px;
}

.answer {
  background-color: #ffffff;
  padding: 20px;
}

.qa-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
  padding: 4px 12px;
  border-radius: 16px;
  margin-bottom: 12px;
}

.question .qa-label {
  background-color: #e8f5fd;
  color: #1da1f2;
}

.answer .qa-label {
  background-color: #f3f4f6;
  color: #4b5563;
}

.qa-label i {
  font-size: 16px;
}

.meta-info {
  padding: 12px 16px;
  border-top: 1px solid #e1e8ed;
  background-color: #f8f9fa;
  display: flex;
  gap: 12px;
}

.link-count,
.public-comment-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background-color: #ffffff;
  border: 1px solid #e1e8ed;
  border-radius: 16px;
  font-size: 12px;
  color: #657786;
  transition: background-color 0.2s ease;
}

.link-count:hover,
.public-comment-count:hover {
  background-color: #f3f4f6;
}

.link-count i {
  color: #1da1f2;
}

:deep(.highlight) {
  background-color: #fff3cd;
  padding: 2px;
  border-radius: 2px;
}

@media (max-width: 768px) {
  .search-container {
    margin: 16px 8px;
  }

  .tweets {
    padding: 0 8px;
  }

  .tweet {
    margin-bottom: 0;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  .tweet:first-child {
    border-top: none;
  }

  .qa-content {
    border-radius: 0;
  }

  .question,
  .answer {
    padding: 16px;
  }

  .tweet-content {
    font-size: 15px;
    padding: 0 8px;
  }

  .meta-info {
    padding: 12px 16px;
  }
}
</style>