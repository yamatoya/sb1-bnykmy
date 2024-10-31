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
      publicCommentLinks: null
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
        if (this.tweet && this.tweet.public_comment_links) {
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
      }
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
}
</style>