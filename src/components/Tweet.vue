<template>
  <div class="tweet-page">
    <div v-if="document" class="tweet-container">
      <div class="tweet-profile-header">
        <router-link :to="backUrl" class="tweet-back-link">←</router-link>
        <h1>{{ formatDisplayName(document.displayName) }}</h1>
      </div>

      <div v-if="tweet" class="tweet">
        <div class="tweet-header">
          <span class="index">{{ tweet.index }}</span>
          <span class="document-title">{{ formatDisplayName(document.displayName) }}</span>
        </div>

        <!-- パブリックコメントの場合 -->
        <div v-if="document.public_comment" class="qa-content">
          <div class="question">
            <div class="qa-label">
              <i class="fas fa-question-circle"></i>
              質問
            </div>
            <p class="tweet-content" v-html="highlightContent(tweet.question)"></p>
          </div>
          <div class="answer">
            <div class="qa-label">
              <i class="fas fa-comment-dots"></i>
              回答
            </div>
            <p class="tweet-content" v-html="highlightContent(tweet.answer)"></p>
          </div>
        </div>

        <!-- 通常のツイートの場合 -->
        <template v-else>
          <p class="tweet-content" v-html="highlightContent(tweet.content)"></p>
        </template>
        
        <div class="tweet-actions">
          <button class="copy-url-btn" @click="copyUrl">
            <i class="fas fa-link"></i> URLをコピー
          </button>
          <button class="add-link-btn" @click="showLinkEditor = true">
            <i class="fas fa-plus"></i> 関連リンクを追加
          </button>
          <button v-if="document.public_comment" class="add-related-btn" @click="showTweetSelector = true">
            <i class="fas fa-plus"></i> 関連ツイートを追加
          </button>
          <button v-if="document.revisions" class="add-revision-link-btn" @click="showRevisionSelector = true">
            <i class="fas fa-history"></i> 改訂履歴を追加
          </button>
        </div>

        <!-- 関連ツイート -->
        <div v-if="tweet.relatedTweets && tweet.relatedTweets.length > 0" class="related-tweets">
          <h3>関連ツイート:</h3>
          <div v-for="relatedTweet in tweet.relatedTweets" :key="relatedTweet" class="related-tweet-item">
            <div class="related-tweet-content">
              <div v-if="getRelatedTweetContent(relatedTweet)" class="related-tweet-details">
                <div class="related-tweet-header">
                  <span class="document-name">{{ formatDisplayName(getRelatedTweetDocument(relatedTweet)?.displayName) }}</span>
                  <span class="tweet-index">{{ getRelatedTweetContent(relatedTweet)?.index }}</span>
                </div>
                <div v-if="isPublicComment(getRelatedTweetDocument(relatedTweet))" class="tweet-text">
                  <div class="related-question">
                    <strong>質問:</strong>
                    <div v-html="formatText(getRelatedTweetContent(relatedTweet)?.question)"></div>
                  </div>
                  <div class="related-answer">
                    <strong>回答:</strong>
                    <div v-html="formatText(getRelatedTweetContent(relatedTweet)?.answer)"></div>
                  </div>
                </div>
                <div v-else class="tweet-text" v-html="formatText(getRelatedTweetContent(relatedTweet)?.content)"></div>
              </div>
            </div>
          </div>
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
      </div>
      <div v-else class="error-message">
        指定されたツイートが見つかりません。
      </div>
    </div>
    <div v-else class="error-message">
      指定された文書が見つかりません。
    </div>

    <tweet-selector
      v-if="showTweetSelector"
      :documents="documents"
      :current-document-id="route.params.documentId"
      :current-tweet-id="route.params.tweetId"
      :initial-selections="tweet?.relatedTweets || []"
      @save="saveRelatedTweets"
      @close="showTweetSelector = false"
    />

    <revision-selector
      v-if="showRevisionSelector"
      :document="document"
      :initial-selections="tweet?.revision || []"
      @save="saveRevisionLinks"
      @close="showRevisionSelector = false"
    />

    <tweet-link-editor
      v-if="showLinkEditor"
      :documents="documents"
      :current-document-id="route.params.documentId"
      :current-tweet-id="route.params.tweetId"
      @save="saveTweetLink"
      @close="showLinkEditor = false"
    />
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TweetLinks from './TweetLinks.vue'
import RevisionSelector from './RevisionSelector.vue'
import TweetSelector from './TweetSelector.vue'
import TweetLinkEditor from './TweetLinkEditor.vue'
import { diffChars } from 'diff'
import { formatDisplayName, formatText } from '../utils/formatters'

const STORAGE_KEY = 'legal-documents-data'

export default {
  name: 'Tweet',
  components: {
    TweetLinks,
    RevisionSelector,
    TweetSelector,
    TweetLinkEditor
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const document = ref(null)
    const documents = ref(null)
    const tweet = ref(null)
    const showRevisionSelector = ref(false)
    const showTweetSelector = ref(false)
    const showLinkEditor = ref(false)

    const currentUrl = computed(() => `/document/${route.params.documentId}/${route.params.tweetId}`)
    const backUrl = computed(() => route.query.back || `/document/${route.params.documentId}`)

    const highlightContent = (text) => {
      if (!text || !route.query.highlight) return text
      let content = text
      
      const searchTerms = route.query.highlight.toLowerCase().split(' ').filter(term => term.length > 0)
      searchTerms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi')
        content = content.replace(regex, '<span class="highlight">$1</span>')
      })
      
      return content
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

    const getRelatedTweetDocument = (tweetPath) => {
      const [documentId] = tweetPath.split('/')
      return documents.value?.[documentId]
    }

    const getRelatedTweetContent = (tweetPath) => {
      const [documentId, tweetId] = tweetPath.split('/')
      const doc = documents.value?.[documentId]
      if (!doc) return null

      if (doc.public_comment) {
        return doc.questions.find(q => q.id === tweetId)
      }
      return doc.tweets.find(t => t.id === tweetId)
    }

    const isPublicComment = (doc) => {
      return doc?.public_comment === true
    }

    const copyUrl = () => {
      const url = window.location.href
      navigator.clipboard.writeText(url).then(() => {
        alert('URLがコピーされました')
      }).catch(err => {
        console.error('URLのコピーに失敗しました:', err)
      })
    }

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

    const saveRevisionLinks = (selectedRevisions) => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          const docs = JSON.parse(storedData)
          const doc = docs[route.params.documentId]
          const currentTweet = doc.public_comment ? 
            doc.questions.find(t => t.id === route.params.tweetId) :
            doc.tweets.find(t => t.id === route.params.tweetId)
          
          if (currentTweet) {
            currentTweet.revision = selectedRevisions
            localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
            
            document.value = doc
            documents.value = docs
            tweet.value = currentTweet
          }
        } catch (e) {
          console.error('Failed to save revision links:', e)
        }
      }
    }

    const saveRelatedTweets = (selectedTweets) => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          const docs = JSON.parse(storedData)
          const doc = docs[route.params.documentId]
          const currentTweet = doc.public_comment ?
            doc.questions.find(t => t.id === route.params.tweetId) :
            doc.tweets.find(t => t.id === route.params.tweetId)
          
          if (currentTweet) {
            currentTweet.relatedTweets = selectedTweets
            localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
            
            document.value = doc
            documents.value = docs
            tweet.value = currentTweet
          }
        } catch (e) {
          console.error('Failed to save related tweets:', e)
        }
      }
    }

    const saveTweetLink = (link) => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          const docs = JSON.parse(storedData)
          const doc = docs[route.params.documentId]
          const currentTweet = doc.public_comment ?
            doc.questions.find(t => t.id === route.params.tweetId) :
            doc.tweets.find(t => t.id === route.params.tweetId)
          
          if (currentTweet) {
            if (!currentTweet.links) {
              currentTweet.links = []
            }
            currentTweet.links.push(link)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
            
            document.value = doc
            documents.value = docs
            tweet.value = currentTweet
          }
        } catch (e) {
          console.error('Failed to save tweet link:', e)
        }
      }
    }

    const loadData = () => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          const docs = JSON.parse(storedData)
          documents.value = docs
          document.value = docs[route.params.documentId]
          if (document.value) {
            if (document.value.public_comment) {
              tweet.value = document.value.questions.find(q => q.id === route.params.tweetId)
            } else {
              tweet.value = document.value.tweets.find(t => t.id === route.params.tweetId)
            }
          }
        } catch (e) {
          console.error('Failed to load documents:', e)
        }
      }
    }

    watch(() => route.params, () => {
      loadData()
    }, { immediate: true })

    return {
      route,
      document,
      documents,
      tweet,
      currentUrl,
      backUrl,
      showRevisionSelector,
      showTweetSelector,
      showLinkEditor,
      getRevisionContent,
      getRevisionArticles,
      getRelatedTweetDocument,
      getRelatedTweetContent,
      isPublicComment,
      copyUrl,
      saveRevisionLinks,
      saveRelatedTweets,
      saveTweetLink,
      highlightChanges,
      highlightContent,
      formatDisplayName,
      formatText
    }
  }
}
</script>

<style scoped>
.tweet-page {
  min-height: 100vh;
  background-color: #f7f9fa;
  padding: 20px;
}

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

.tweet-profile-header h1 {
  margin: 0;
  font-size: 24px;
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
.add-revision-link-btn,
.add-related-btn,
.add-link-btn {
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

.add-related-btn {
  background-color: #794bc4;
}

.add-link-btn {
  background-color: #794bc4;
}

.add-link-btn:hover {
  background-color: #6b44b0;
}

.related-tweets,
.tweet-links,
.revision-links {
  margin-top: 20px;
  border-top: 1px solid #e1e8ed;
  padding-top: 20px;
}

.related-tweet-item {
  background-color: #f8f9fa;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  margin-bottom: 15px;
  padding: 15px;
}

.related-tweet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.document-name {
  font-weight: bold;
  color: #14171a;
}

.tweet-index {
  color: #657786;
}

.tweet-text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}

.related-question,
.related-answer {
  margin-bottom: 10px;
}

.related-answer {
  margin-bottom: 0;
}

.related-question strong,
.related-answer strong {
  display: block;
  margin-bottom: 5px;
  color: #14171a;
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

.error-message {
  text-align: center;
  padding: 40px;
  color: #e0245e;
  font-weight: bold;
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

/* QAコンテンツのスタイル */
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

@media (max-width: 768px) {
  .tweet-page {
    padding: 10px;
  }

  .tweet-profile-header {
    padding: 15px;
  }

  .tweet-profile-header h1 {
    font-size: 20px;
    margin: 0 30px;
  }

  .tweet {
    padding: 15px;
  }

  .comparison-container {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .tweet-actions {
    flex-wrap: wrap;
  }

  .copy-url-btn,
  .add-revision-link-btn,
  .add-related-btn,
  .add-link-btn {
    flex: 1;
    justify-content: center;
  }

  .question,
  .answer {
    padding: 15px;
  }
}
</style>