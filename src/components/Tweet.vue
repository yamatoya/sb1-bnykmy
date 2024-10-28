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
            <p v-html="qaItem.question"></p>
          </div>
          <div class="answer">
            <h3>回答</h3>
            <p v-html="qaItem.answer"></p>
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
          <h3>パブリックコメント: {{ tweet.public_comment_links[0].text }}</h3>
          <div v-for="link in publicCommentLinks" :key="link.id" class="public-comment-item">
            <div class="qa-content">
              <div class="question">
                <h4>質問</h4>
                <p v-html="link.question"></p>
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
      let content = this.tweet.content
      if (this.tweet.links && this.tweet.links.length > 0) {
        this.tweet.links.forEach(link => {
          const escapedLinkText = link.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const regex = new RegExp(`(${escapedLinkText})`, 'gi')
          content = content.replace(regex, '<span class="highlight">$1</span>')
        })
      }
      return content
    }
  },
  methods: {
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
              return linkedDoc.questions.find(q => q.id === qaId)
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
.qa-content {
  padding: 20px;
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

h1, .document-title {
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
  background-color: #f8f9fa;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  margin-bottom: 15px;
  overflow: hidden;
}

.public-comment-item:last-child {
  margin-bottom: 0;
}
</style>