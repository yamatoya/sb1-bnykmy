<template>
  <div v-if="document" class="tweet-container">
    <div class="tweet-profile-header">
      <router-link :to="backUrl" class="tweet-back-link">←</router-link>
      <h1>{{ document.displayName }}</h1>
    </div>

    <div class="tweet" v-if="tweet">
      <div class="tweet-header">
        <span class="index">{{ tweet.index }}</span>
        <span class="document-title">{{ document.displayName }}</span>
      </div>
      <p class="tweet-content" v-html="highlightedContent"></p>
      
      <div class="tweet-actions">
        <button class="copy-url-btn" @click="copyUrl">
          <i class="fas fa-link"></i> URLをコピー
        </button>
        <button v-if="document.revisions" class="add-revision-link-btn" @click="showRevisionSelector = true">
          <i class="fas fa-history"></i> 改訂履歴を追加
        </button>
      </div>

      <!-- 関連リンク -->
      <div v-if="tweet.links && tweet.links.length > 0" class="tweet-links">
        <h3>関連リンク:</h3>
        <tweet-links :links="tweet.links" :base-url="currentUrl" />
      </div>

      <!-- 改訂履歴 -->
      <div v-if="tweet.revision && tweet.revision.length > 0" class="revision-links">
        <h3>改訂履歴:</h3>
        <div v-for="revision in tweet.revision" :key="revision" class="revision-item">
          <div class="revision-content">
            <div v-if="getRevisionContent(revision)" class="revision-details">
              <h4>{{ getRevisionContent(revision).title }}</h4>
              <div v-if="getRevisionContent(revision).description" class="revision-description">
                {{ getRevisionContent(revision).description }}
              </div>
              <div v-if="getRevisionContent(revision).sourceUrl" class="revision-source">
                <a :href="getRevisionContent(revision).sourceUrl" target="_blank" rel="noopener noreferrer">
                  参考リンク
                </a>
              </div>
              <div v-for="article in getRevisionArticles(revision)" :key="article.id" class="article-container">
                <div class="article-status" :class="article.status">{{ article.status }}</div>
                <div class="comparison-container">
                  <div class="comparison-column before">
                    <h4>改正前</h4>
                    <div v-if="article.before" class="content">{{ article.before }}</div>
                    <div v-else class="no-content">改正前の内容なし</div>
                  </div>
                  <div class="comparison-column after">
                    <h4>改正後</h4>
                    <div v-if="article.after" class="content" v-html="highlightChanges(article.before, article.after)"></div>
                    <div v-else class="no-content">改正後の内容なし</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 改訂選択モーダル -->
      <div v-if="showRevisionSelector" class="modal-overlay" @click="showRevisionSelector = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>改訂履歴の選択</h2>
            <button class="close-button" @click="showRevisionSelector = false">&times;</button>
          </div>
          <div class="modal-body">
            <div v-for="revision in document.revisions" :key="revision.id" class="revision-selector-item">
              <h3>{{ revision.title }} ({{ formatDate(revision.date) }})</h3>
              <div v-if="revision.description" class="revision-description">
                {{ revision.description }}
              </div>
              <div class="articles-list">
                <div v-for="article in revision.articles" :key="article.id" class="article-selector">
                  <label class="article-checkbox">
                    <input 
                      type="checkbox" 
                      :value="`${document.accountId}/revisions/${revision.id}/${article.id}`"
                      v-model="selectedRevisions"
                    >
                    <div class="article-preview">
                      <div class="article-status" :class="article.status">{{ article.status }}</div>
                      <div class="article-content">
                        <div v-if="article.before" class="before-preview">
                          改正前: {{ truncateText(article.before) }}
                        </div>
                        <div v-if="article.after" class="after-preview">
                          改正後: {{ truncateText(article.after) }}
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-button" @click="showRevisionSelector = false">キャンセル</button>
            <button class="save-button" @click="saveRevisionLinks" :disabled="selectedRevisions.length === 0">
              選択した改訂を追加
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TweetLinks from './TweetLinks.vue'
import { diffChars } from 'diff'

const STORAGE_KEY = 'legal-documents-data'

export default {
  name: 'Tweet',
  components: {
    TweetLinks
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const document = ref(null)
    const tweet = ref(null)
    const showRevisionSelector = ref(false)
    const selectedRevisions = ref([])

    const currentUrl = computed(() => `/document/${route.params.documentId}/${route.params.tweetId}`)
    const backUrl = computed(() => route.query.back || `/document/${route.params.documentId}`)

    const highlightedContent = computed(() => {
      if (!tweet.value?.content) return ''
      let content = tweet.value.content
      if (tweet.value.links) {
        tweet.value.links.forEach(link => {
          const escapedLinkText = link.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const regex = new RegExp(`(${escapedLinkText})`, 'gi')
          content = content.replace(regex, '<span class="highlight">$1</span>')
        })
      }
      return content
    })

    const highlightChanges = (before, after) => {
      if (!before) return after

      const diff = diffChars(before, after)
      let result = ''
      
      diff.forEach(part => {
        if (part.added) {
          result += `<span class="diff-added">${part.value}</span>`
        } else if (!part.removed) {
          result += part.value
        }
      })
      
      return result
    }

    const getPathParts = (path) => {
      const parts = path.split('/')
      if (parts.length !== 4) {
        console.error('Invalid revision path format:', path)
        return { documentId: '', revisionId: '', articleId: '' }
      }
      return {
        documentId: parts[0],
        revisionId: parts[2],
        articleId: parts[3]
      }
    }

    const getRevisionContent = (revisionPath) => {
      const parts = getPathParts(revisionPath)
      if (!document.value || !parts.documentId) return null
      
      const doc = document.value
      if (!doc.revisions) return null

      return doc.revisions.find(r => r.id === parts.revisionId)
    }

    const getRevisionArticles = (revisionPath) => {
      const revision = getRevisionContent(revisionPath)
      const parts = getPathParts(revisionPath)
      if (!revision || !revision.articles) return []

      return revision.articles.filter(article => article.id === parts.articleId)
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    const truncateText = (text, maxLength = 50) => {
      if (!text) return ''
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    }

    const copyUrl = () => {
      const url = window.location.href
      navigator.clipboard.writeText(url).then(() => {
        alert('URLがコピーされました')
      }).catch(err => {
        console.error('URLのコピーに失敗しました:', err)
      })
    }

    const saveRevisionLinks = () => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          const documents = JSON.parse(storedData)
          const doc = documents[route.params.documentId]
          const currentTweet = doc.tweets.find(t => t.id === route.params.tweetId)
          
          if (currentTweet) {
            currentTweet.revision = selectedRevisions.value
            localStorage.setItem(STORAGE_KEY, JSON.stringify(documents))
            
            // 状態を更新
            document.value = doc
            tweet.value = currentTweet
            showRevisionSelector.value = false
            selectedRevisions.value = []
          }
        } catch (e) {
          console.error('Failed to save revision links:', e)
        }
      }
    }

    // Load document data from localStorage
    const loadData = () => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          const documents = JSON.parse(storedData)
          document.value = documents[route.params.documentId]
          if (document.value) {
            tweet.value = document.value.tweets.find(t => t.id === route.params.tweetId)
            if (tweet.value?.revision) {
              selectedRevisions.value = tweet.value.revision
            }
          }
        } catch (e) {
          console.error('Failed to load documents:', e)
        }
      }
    }

    loadData()

    return {
      document,
      tweet,
      currentUrl,
      backUrl,
      highlightedContent,
      highlightChanges,
      getPathParts,
      getRevisionContent,
      getRevisionArticles,
      showRevisionSelector,
      selectedRevisions,
      formatDate,
      truncateText,
      copyUrl,
      saveRevisionLinks
    }
  }
}
</script>

<style>
.tweet-container {
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.tweet-profile-header {
  background-color: #1da1f2;
  color: #ffffff;
  padding: 20px;
  position: relative;
  text-align: center;
}

.tweet-back-link {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 24px;
  text-decoration: none;
  color: #ffffff;
}

.tweet {
  padding: 20px;
}

.tweet-header {
  margin-bottom: 15px;
}

.index {
  font-weight: bold;
  margin-right: 10px;
}

.document-title {
  color: #657786;
}

.tweet-content {
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 20px;
  white-space: pre-wrap;
}

.tweet-actions {
  margin: 15px 0;
  display: flex;
  gap: 10px;
}

.copy-url-btn,
.add-revision-link-btn {
  background-color: #1da1f2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.add-revision-link-btn {
  background-color: #17bf63;
}

.tweet-links,
.revision-links {
  margin-top: 20px;
  border-top: 1px solid #e1e8ed;
  padding-top: 20px;
}

.revision-item {
  background-color: #f8f9fa;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  margin-bottom: 15px;
  padding: 15px;
}

.revision-details h4 {
  margin: 0 0 10px 0;
  color: #14171a;
}

.revision-description {
  color: #657786;
  margin-bottom: 10px;
}

.revision-source {
  margin-bottom: 15px;
}

.revision-source a {
  color: #1da1f2;
  text-decoration: none;
}

.article-container {
  margin-top: 15px;
}

.article-status {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-size: 0.9em;
}

.article-status.改正 {
  background-color: #e8f5fd;
  color: #1da1f2;
}

.article-status.新設 {
  background-color: #e6ffed;
  color: #28a745;
}

.article-status.削除 {
  background-color: #ffeef0;
  color: #d73a49;
}

.comparison-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.comparison-column {
  background-color: #ffffff;
  padding: 15px;
  border: 1px solid #e1e8ed;
  border-radius: 4px;
}

.comparison-column h4 {
  margin: 0 0 10px 0;
  font-size: 1em;
  color: #657786;
}

.content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}

.no-content {
  color: #657786;
  font-style: italic;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.highlight {
  color: #1da1f2;
  font-weight: bold;
}

.diff-added {
  background-color: #e6ffed;
  text-decoration: underline;
  text-decoration-color: #28a745;
  text-decoration-thickness: 2px;
}

/* モーダル関連のスタイル */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5em;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #657786;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e1e8ed;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  position: sticky;
  bottom: 0;
  background: white;
}

.revision-selector-item {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e1e8ed;
}

.revision-selector-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.revision-selector-item h3 {
  margin: 0 0 10px 0;
  color: #14171a;
}

.articles-list {
  margin-top: 15px;
}

.article-selector {
  margin-bottom: 10px;
}

.article-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
}

.article-checkbox input {
  margin-top: 4px;
}

.article-preview {
  flex-grow: 1;
  background: #f8f9fa;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  padding: 12px;
}

.before-preview,
.after-preview {
  margin-top: 8px;
  font-size: 14px;
  color: #657786;
}

.save-button,
.cancel-button {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
}

.save-button {
  background-color: #1da1f2;
  color: white;
  border: none;
}

.save-button:disabled {
  background-color: #a5d0f5;
  cursor: not-allowed;
}

.cancel-button {
  background-color: white;
  color: #1da1f2;
  border: 1px solid #1da1f2;
}

@media (max-width: 768px) {
  .comparison-container {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .tweet-profile-header {
    padding: 15px;
  }

  .tweet {
    padding: 15px;
  }

  .modal-content {
    width: 95%;
    height: 95vh;
    border-radius: 8px;
  }

  .tweet-actions {
    flex-wrap: wrap;
  }

  .copy-url-btn,
  .add-revision-link-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>