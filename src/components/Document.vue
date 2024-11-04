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

const STORAGE_KEY = 'legal-documents-data'

export default {
  name: 'Document',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const document = ref(null)
    const isSearchFocused = ref(false)

    onMounted(() => {
      loadDocument()
    })

    const loadDocument = () => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          const documents = JSON.parse(storedData)
          document.value = documents[route.params.id]
        } catch (e) {
          console.error('Failed to parse stored documents:', e)
        }
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
/* スタイルは変更なし */
</style>