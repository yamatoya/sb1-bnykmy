<template>
  <div v-if="document">
    <div class="profile-header">
      <router-link to="/" class="back-link">←</router-link>
      <h1>{{ document.displayName }}</h1>
      <div v-if="document.url" class="document-url">
        <a :href="document.url" target="_blank" rel="noopener noreferrer">原文を表示</a>
      </div>
    </div>
    
    <!-- Public Comment Q&A Format -->
    <div v-if="document.public_comment" class="qa-container">
      <div v-for="question in document.questions" :key="question.id" 
           class="qa-block" @click="goToQA(question.id)">
        <div class="qa-header">
          <span class="index">{{ question.index }}</span>
        </div>
        <div class="qa-content">
          <div class="question">
            <h3>質問</h3>
            <p v-html="question.question"></p>
          </div>
          <div class="answer">
            <h3>回答</h3>
            <p v-html="question.answer"></p>
          </div>
        </div>
      </div>
    </div>

    <!-- Regular Tweet Format -->
    <div v-else class="tweets">
      <div v-for="tweet in document.tweets" :key="tweet.id" 
           class="tweet" @click="goToTweet(tweet.id)">
        <div class="tweet-header">
          <span class="index">{{ tweet.index }}</span>
        </div>
        <p class="tweet-content" v-html="highlightContent(tweet)"></p>
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
      document: null
    }
  },
  created() {
    this.document = documentsData[this.$route.params.id]
  },
  methods: {
    goToTweet(tweetId) {
      this.$router.push(`/document/${this.$route.params.id}/${tweetId}`)
    },
    goToQA(qaId) {
      this.$router.push(`/document/${this.$route.params.id}/${qaId}`)
    },
    highlightContent(tweet) {
      let content = tweet.content
      if (tweet.links && tweet.links.length > 0) {
        tweet.links.forEach(link => {
          const escapedLinkText = link.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const regex = new RegExp(`(${escapedLinkText})`, 'gi')
          content = content.replace(regex, '<span class="highlight">$1</span>')
        })
      }
      return content
    }
  }
}
</script>

<style scoped>
.document-url {
  margin-top: 10px;
}

.document-url a {
  color: #ffffff;
  text-decoration: underline;
}

.qa-container {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.qa-block {
  padding: 20px;
  border-bottom: 1px solid #e1e8ed;
  cursor: pointer;
  transition: background-color 0.2s;
}

.qa-block:last-child {
  border-bottom: none;
}

.qa-block:hover {
  background-color: #f8f9fa;
}

.qa-header {
  margin-bottom: 15px;
}

.qa-content {
  margin-left: 10px;
}

.question, .answer {
  margin-bottom: 15px;
}

.question h3, .answer h3 {
  font-size: 0.9em;
  color: #657786;
  margin-bottom: 5px;
}

.question p, .answer p {
  margin: 0;
  line-height: 1.5;
}
</style>