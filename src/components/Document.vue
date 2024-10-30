<template>
  <div v-if="document">
    <div class="profile-header">
      <router-link to="/" class="back-link">←</router-link>
      <h1 v-html="formattedDisplayName"></h1>
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
import documentsData from '../documents.json'

export default {
  name: 'Document',
  data() {
    return {
      document: null,
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
    formattedDisplayName() {
      return this.document?.displayName.replace(/<br>/gi, '\n') || ''
    },
    filteredItems() {
      if (!this.document) return []
      
      const items = this.document.public_comment ? this.document.questions : this.document.tweets
      if (!this.searchQuery) return items

      const searchTerms = this.searchQuery.toLowerCase().split(' ').filter(term => term.length > 0)
      
      return items.filter(item => {
        const content = this.document.public_comment
          ? `${item.question} ${item.answer}`
          : item.content
        const searchContent = content.toLowerCase()
        
        return searchTerms.every(term => searchContent.includes(term))
      })
    }
  },
  created() {
    this.document = documentsData[this.$route.params.id]
  },
  methods: {
    goToItem(itemId) {
      this.$router.push({
        path: `/document/${this.$route.params.id}/${itemId}`,
        query: { back: this.$route.fullPath }
      })
    },
    highlightContent(text) {
      if (!text) return ''
      return text.replace(/<br>/gi, '\n')
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
}

.back-link {
  position: absolute;
  top: 20px;
  left: 20px;
  font-size: 24px;
  text-decoration: none;
  color: #1da1f2;
}

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

.question, .answer {
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

.link-count, .public-comment-count {
  margin-right: 15px;
}

h1 {
  white-space: pre-line;
  text-align: center;
  margin: 0;
  padding-left: 30px;
}
</style>