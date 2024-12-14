<template>
  <div class="page">
    <div class="container">
      <div v-if="document">
        <header class="page-header">
          <router-link to="/" class="back-link">
            <i class="fas fa-arrow-left"></i>
          </router-link>
          <h1>{{ formatDisplayName(document.displayName) }}</h1>
        </header>

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

        <div class="tweets-list">
          <div v-for="item in filteredItems" :key="item.id" class="card clickable">
            <div class="card-header" @click="handleCardClick($event, item)">
              <span class="index">{{ item.index }}</span>
              <i class="fas fa-chevron-right card-arrow"></i>
            </div>
            <div v-if="hasContent(item)" class="card-content">
              <template v-if="document.public_comment">
                <div class="qa-content">
                  <div v-if="item.question" class="question">
                    <div class="qa-label">
                      <i class="fas fa-question-circle"></i>
                      質問
                    </div>
                    <p class="tweet-content clickable" @click="handleContentClick($event, item)" v-html="highlightContent(item.question)"></p>
                  </div>
                  <div v-if="item.answer" class="answer">
                    <div class="qa-label">
                      <i class="fas fa-comment-dots"></i>
                      回答
                    </div>
                    <p class="tweet-content clickable" @click="handleContentClick($event, item)" v-html="highlightContent(item.answer)"></p>
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
                <p v-if="item.content" class="tweet-content clickable" @click="handleContentClick($event, item)" v-html="highlightContent(item.content)"></p>
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
      </div>
      <div v-else class="error-message">
        指定された文書が見つかりません。
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

    const hasContent = (item) => {
      if (document.value?.public_comment) {
        return item.question || item.answer || hasMetaInfo(item)
      }
      return item.content || hasMetaInfo(item)
    }

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

    const handleCardClick = (event, item) => {
      goToItem(item.id)
    }

    const handleContentClick = (event, item) => {
      // テキスト選択時は遷移しない
      const selection = window.getSelection()
      if (selection.toString().length > 0) {
        return
      }
      goToItem(item.id)
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
      handleCardClick,
      handleContentClick,
      hasMetaInfo,
      hasContent
    }
  }
}
</script>

<style scoped>
@import '../styles/common.css';

.tweets-list {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
}

.tweets-list .card {
  margin-bottom: 0;
  border-radius: 0;
  border-left: none;
  border-right: none;
}

.tweets-list .card:first-child {
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.tweets-list .card:last-child {
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.tweets-list .card + .card {
  border-top: none;
}

.card-header {
  position: relative;
  padding-right: 40px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.card-header:hover {
  background-color: #f8f9fa;
}

.card-arrow {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #657786;
  font-size: 14px;
  opacity: 0.5;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.card-header:hover .card-arrow {
  opacity: 1;
  transform: translateY(-50%) translateX(4px);
}

.index {
  font-weight: bold;
  color: #14171a;
}

.tweet-content {
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 20px;
  white-space: pre-wrap;
  user-select: text;
}

.tweet-content.clickable {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.tweet-content.clickable:hover {
  background-color: #f8f9fa;
}

.qa-content {
  background-color: #ffffff;
  border-radius: 8px;
  overflow: hidden;
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

@media (max-width: 768px) {
  .question,
  .answer {
    padding: 15px;
  }

  .tweet-content {
    font-size: 15px;
  }

  .meta-info {
    padding: 12px;
  }
}
</style>