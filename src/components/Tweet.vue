<template>
  <div v-if="document" class="tweet-container">
    <div class="tweet-profile-header">
      <a @click="goBack" class="tweet-back-link">←</a>
      <h1 v-html="formattedDisplayName"></h1>
    </div>
    <div class="tweet">
      <div v-if="document.public_comment && qaItem">
        <div class="qa-content">
          <div class="question">
            <h3>質問</h3>
            <p v-html="highlightedQuestion"></p>
          </div>
          <div class="answer">
            <h3>回答</h3>
            <p v-html="qaItem.answer"></p>
          </div>
          <div v-if="qaItem.links" class="tweet-links">
            <h3>関連リンク:</h3>
            <tweet-links :links="qaItem.links" :base-url="$route.params.documentId"></tweet-links>
          </div>
        </div>
      </div>
      <div v-else-if="tweet">
        <div class="tweet-header">
          <span class="index">{{ tweet.index }}</span>
          <span class="document-title" v-html="formattedDisplayName"></span>
        </div>
        <p class="tweet-content" v-html="highlightedContent"></p>
        <div class="tweet-actions">
          <button class="copy-url-btn" @click="copyUrl">
            <i class="fas fa-link"></i> URLをコピー
          </button>
        </div>
        <div v-if="tweet.links && tweet.links.length > 0" class="tweet-links">
          <h3>関連リンク:</h3>
          <tweet-links :links="tweet.links" :base-url="$route.params.documentId"></tweet-links>
        </div>
        <div v-if="revisionHistory && revisionHistory.length > 0" class="revision-history">
          <h3>改訂履歴:</h3>
          <div v-for="revision in revisionHistory" :key="revision.id" class="revision-section">
            <h4 class="revision-title">{{ revision.title }}</h4>
            <div v-if="revision.description" class="revision-description">
              <h5>参考情報:</h5>
              <p>{{ revision.description }}</p>
            </div>
            <div v-if="revision.url" class="revision-url">
              <h5>参考リンク:</h5>
              <a :href="revision.url" target="_blank" rel="noopener noreferrer">{{ revision.url }}</a>
            </div>
            <div v-for="article in filteredArticles(revision)" :key="article.id" class="article-container">
              <div class="article-status" :class="article.status">{{ article.status }}</div>
              <div class="comparison-container">
                <div class="comparison-column before">
                  <h5>改正前</h5>
                  <div v-if="article.before" class="content" v-html="article.before"></div>
                  <div v-else class="no-content">改正前の内容なし</div>
                </div>
                <div class="comparison-column after">
                  <h5>改正後</h5>
                  <div v-if="article.after" class="content" v-html="highlightChanges(article.before, article.after)"></div>
                  <div v-else class="no-content">改正後の内容なし</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="publicCommentLinks && publicCommentLinks.length > 0" class="public-comment-links">
          <h3>パブリックコメント:</h3>
          <div v-for="(link, index) in publicCommentLinks" :key="index" class="public-comment-item">
            <div class="public-comment-header">
              <h4>{{ link.text }}</h4>
            </div>
            <div class="qa-content">
              <div class="question">
                <h4>質問</h4>
                <p v-html="highlightQuestionText(link.question)"></p>
              </div>
              <div class="answer">
                <h4>回答</h4>
                <p v-html="link.answer"></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import documentsData from '../documents.json'
import TweetLinks from './TweetLinks.vue'
import { diffChars } from 'diff'

export default {
  name: 'Tweet',
  components: {
    TweetLinks
  },
  data() {
    return {
      document: null,
      tweet: null,
      qaItem: null,
      publicCommentLinks: null,
      revisionHistory: null,
      revisionArticleIds: new Map()
    }
  },
  created() {
    this.loadData()
  },
  watch: {
    '$route': 'loadData'
  },
  computed: {
    formattedDisplayName() {
      return this.document.displayName.replace(/<br>/gi, '\n')
    },
    highlightedContent() {
      if (!this.tweet) return ''
      return this.highlightText(this.tweet.content, this.tweet.links)
    },
    highlightedQuestion() {
      if (!this.qaItem) return ''
      return this.highlightText(this.qaItem.question, this.qaItem.links)
    }
  },
  methods: {
    highlightText(text, links) {
      if (!links || !text) return text
      let result = text
      links.forEach(link => {
        const escapedLinkText = link.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`(${escapedLinkText})`, 'gi')
        result = result.replace(regex, '<span class="highlight">$1</span>')
      })
      return result
    },
    highlightQuestionText(question) {
      if (!this.tweet || !this.tweet.links) return question
      return this.highlightText(question, this.tweet.links)
    },
    loadData() {
      this.document = documentsData[this.$route.params.documentId]
      if (this.document.public_comment) {
        this.qaItem = this.document.questions.find(q => q.id === this.$route.params.tweetId)
      } else {
        this.tweet = this.document.tweets.find(t => t.id === this.$route.params.tweetId)
        if (this.tweet) {
          if (this.tweet.public_comment_links) {
            this.publicCommentLinks = this.tweet.public_comment_links.map(link => {
              const [docId, qaId] = link.url.split('/')
              const linkedDoc = documentsData[docId]
              if (linkedDoc && linkedDoc.public_comment) {
                const question = linkedDoc.questions.find(q => q.id === qaId)
                if (question) {
                  return {
                    ...question,
                    text: link.text,
                    documentId: docId
                  }
                }
              }
              return null
            }).filter(link => link !== null)
          } else {
            this.publicCommentLinks = null
          }

          if (this.tweet.revision) {
            this.revisionHistory = this.tweet.revision.map(revisionPath => {
              const [docId, revisionFolder, revisionId] = revisionPath.split('/')
              const doc = documentsData[docId]
              if (doc && doc.revisions) {
                const revision = doc.revisions.find(rev => rev.id === revisionId)
                if (revision) {
                  const articleId = revisionPath.split('/').pop()
                  this.revisionArticleIds.set(revision.id, articleId)
                  return revision
                }
              }
              return null
            }).filter(rev => rev !== null)
          } else {
            this.revisionHistory = null
          }
        }
      }
    },
    filteredArticles(revision) {
      const articleId = this.revisionArticleIds.get(revision.id)
      if (!articleId) return revision.articles
      return revision.articles.filter(article => article.id === articleId)
    },
    copyUrl() {
      const url = window.location.href
      navigator.clipboard.writeText(url).then(() => {
        alert('URLがコピーされました')
      }, (err) => {
        console.error('URLのコピーに失敗しました', err)
      })
    },
    goBack() {
      if (window.history.length > 2) {
        this.$router.go(-1)
      } else {
        this.$router.push(`/document/${this.$route.params.documentId}`)
      }
    },
    highlightChanges(before, after) {
      if (!before) return after

      const tags = []
      const processedBefore = before.replace(/<[^>]+>/g, match => {
        tags.push(match)
        return `___TAG${tags.length - 1}___`
      })
      const processedAfter = after.replace(/<[^>]+>/g, match => {
        const index = tags.indexOf(match)
        if (index === -1) {
          tags.push(match)
        }
        return `___TAG${tags.indexOf(match)}___`
      })

      const diff = diffChars(processedBefore, processedAfter)
      
      let result = ''
      diff.forEach(part => {
        if (!part.added && !part.removed) {
          result += part.value
        } else if (part.added) {
          result += `<span class="diff-added">${part.value}</span>`
        }
      })

      return result.replace(/___TAG(\d+)___/g, (_, i) => tags[i])
    }
  }
}
</script>

<style scoped>
.tweet-container {
  max-width: 800px;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tweet-profile-header {
  background-color: #1da1f2;
  color: #ffffff;
  padding: 20px;
  position: relative;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tweet-back-link {
  position: absolute;
  left: 20px;
  font-size: 24px;
  text-decoration: none;
  color: #ffffff;
  cursor: pointer;
  z-index: 1;
}

.tweet-profile-header h1 {
  margin: 0;
  padding: 0 40px;
  text-align: center;
  font-size: 1.5em;
  max-width: 80%;
  white-space: pre-line;
  word-break: break-word;
}

.tweet {
  padding: 20px;
}

.qa-content {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.question, .answer {
  margin-bottom: 20px;
}

.question h3, .answer h3,
.question h4, .answer h4 {
  font-size: 1.1em;
  color: #657786;
  margin-bottom: 10px;
}

.question p, .answer p {
  margin: 0;
  line-height: 1.6;
}

.tweet-content {
  font-size: 16px;
  line-height: 1.6;
  white-space: pre-line;
}

.public-comment-links {
  margin-top: 30px;
  border-top: 1px solid #e1e8ed;
  padding-top: 20px;
}

.public-comment-links h3 {
  color: #1da1f2;
  margin-bottom: 15px;
}

.public-comment-item {
  background-color: #ffffff;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  margin-bottom: 15px;
  overflow: hidden;
}

.public-comment-header {
  background-color: #f8f9fa;
  padding: 10px 20px;
  border-bottom: 1px solid #e1e8ed;
}

.public-comment-header h4 {
  margin: 0;
  color: #1da1f2;
}

.public-comment-item:last-child {
  margin-bottom: 0;
}

:deep(.highlight) {
  color: #0f83fd;
  font-weight: bold;
}

.tweet-actions {
  margin: 15px 0;
}

.copy-url-btn {
  background-color: #1da1f2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  transition: background-color 0.2s ease;
}

.copy-url-btn:hover {
  background-color: #1991db;
}

.copy-url-btn i {
  margin-right: 8px;
}

.revision-history {
  margin-top: 30px;
  border-top: 1px solid #e1e8ed;
  padding-top: 20px;
}

.revision-history h3 {
  color: #1da1f2;
  margin-bottom: 15px;
}

.revision-section {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
}

.revision-title {
  padding: 12px 16px;
  background-color: #f7f9fa;
  border-bottom: 1px solid #e1e8ed;
  margin: 0;
  font-size: 1.1em;
  color: #14171a;
}

.revision-description,
.revision-url {
  padding: 12px 16px;
  border-bottom: 1px solid #e1e8ed;
  background-color: #f8f9fa;
}

.revision-description h5,
.revision-url h5 {
  color: #586069;
  font-size: 0.9em;
  margin-bottom: 8px;
}

.revision-description p {
  font-size: 14px;
  line-height: 1.6;
  color: #24292e;
  margin: 0;
}

.revision-url a {
  color: #0366d6;
  text-decoration: none;
  font-size: 14px;
  word-break: break-all;
}

.revision-url a:hover {
  text-decoration: underline;
}

.article-container {
  padding: 16px;
}

.article-status {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-size: 0.9em;
  font-weight: bold;
}

.article-status.改正 {
  background-color: #e6f3ff;
  color: #0366d6;
}

.article-status.新設 {
  background-color: #e6ffed;
  color: #28a745;
}

.comparison-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.comparison-column {
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
}

.comparison-column h5 {
  margin: 0 0 8px 0;
  font-size: 0.9em;
  color: #586069;
}

.content {
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: 14px;
}

.no-content {
  color: #666;
  font-style: italic;
  padding: 8px 0;
  font-size: 14px;
}

:deep(.diff-added) {
  background-color: #e6ffed;
  text-decoration: underline;
  text-decoration-color: #28a745;
  text-decoration-thickness: 2px;
}

@media (max-width: 768px) {
  .tweet-profile-header {
    padding: 40px 20px;
  }

  .tweet-profile-header h1 {
    font-size: 1.2em;
    max-width: 100%;
    padding: 0 30px;
  }

  .tweet {
    padding: 15px;
  }

  .qa-content {
    padding: 15px;
  }

  .comparison-container {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .comparison-column {
    padding: 10px;
  }
}
</style>