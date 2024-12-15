```vue
<template>
  <div class="page">
    <div class="container">
      <header class="page-header">
        <router-link to="/lists" class="back-link">
          <i class="fas fa-arrow-left"></i>
        </router-link>
        <h1>{{ list?.title }}</h1>
      </header>

      <div v-if="list" class="list-content">
        <div v-if="list.description" class="list-description">
          {{ list.description }}
        </div>

        <div class="list-meta">
          <span class="tweet-count">
            <i class="fas fa-list"></i>
            {{ list.tweets.length }}件のツイート
          </span>
          <span class="update-date">
            最終更新: {{ formatDate(list.updatedAt) }}
          </span>
        </div>

        <div class="tweets-list">
          <router-link
            v-for="tweetPath in list.tweets"
            :key="tweetPath"
            :to="getTweetLink(tweetPath)"
            class="card tweet-link"
          >
            <div class="card-header">
              <span class="document-name">{{ getDocumentName(tweetPath) }}</span>
              <span class="tweet-index">{{ getTweetIndex(tweetPath) }}</span>
            </div>
            <div class="card-content">
              <div class="tweet-content" v-html="formatTweetContent(tweetPath)"></div>
            </div>
          </router-link>
        </div>
      </div>
      <div v-else class="error-message">
        リストが見つかりません
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { formatDate, formatDisplayName } from '../utils/formatters'

const STORAGE_KEY = 'legal-documents-data'

export default {
  name: 'ListDetail',
  setup() {
    const route = useRoute()
    const documents = ref(null)
    const list = ref(null)

    const getDocumentName = (tweetPath) => {
      const [documentId] = tweetPath.split('/')
      return formatDisplayName(documents.value?.[documentId]?.displayName)
    }

    const getTweetIndex = (tweetPath) => {
      const [documentId, tweetId] = tweetPath.split('/')
      const doc = documents.value?.[documentId]
      if (!doc) return ''

      if (doc.public_comment) {
        const question = doc.questions.find(q => q.id === tweetId)
        return question ? `質問 ${question.index}` : ''
      }
      const tweet = doc.tweets.find(t => t.id === tweetId)
      return tweet ? tweet.index : ''
    }

    const formatTweetContent = (tweetPath) => {
      const [documentId, tweetId] = tweetPath.split('/')
      const doc = documents.value?.[documentId]
      if (!doc) return ''

      if (doc.public_comment) {
        const question = doc.questions.find(q => q.id === tweetId)
        if (!question) return ''
        return `
          <div class="qa-content">
            <div class="question">
              <strong>質問:</strong>
              <div>${question.question}</div>
            </div>
            <div class="answer">
              <strong>回答:</strong>
              <div>${question.answer}</div>
            </div>
          </div>
        `
      }

      const tweet = doc.tweets.find(t => t.id === tweetId)
      return tweet ? tweet.content : ''
    }

    const getTweetLink = (tweetPath) => {
      const [documentId, tweetId] = tweetPath.split('/')
      return {
        name: 'tweet',
        params: { documentId, tweetId },
        query: { back: route.fullPath }
      }
    }

    const loadData = () => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          const data = JSON.parse(storedData)
          documents.value = data
          list.value = data.lists?.find(l => l.id === route.params.id)
        } catch (e) {
          console.error('Failed to load data:', e)
        }
      }
    }

    onMounted(() => {
      loadData()
    })

    return {
      list,
      getDocumentName,
      getTweetIndex,
      formatTweetContent,
      getTweetLink,
      formatDate
    }
  }
}
</script>

<style scoped>
@import '../styles/common.css';

.list-content {
  margin: 20px 0;
}

.list-description {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  white-space: pre-wrap;
  word-break: break-word;
  color: #4b5563;
  border: 1px solid #e1e8ed;
}

.list-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px 16px;
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e1e8ed;
}

.tweet-count {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1da1f2;
  font-weight: bold;
}

.update-date {
  color: #657786;
  font-size: 14px;
}

.tweets-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tweet-link {
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tweet-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.document-name {
  font-weight: bold;
  color: #14171a;
}

.tweet-index {
  color: #657786;
  font-size: 14px;
}

.tweet-content {
  white-space: pre-wrap;
  word-break: break-word;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.5;
}

.qa-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question,
.answer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.question strong,
.answer strong {
  color: #14171a;
}

.error-message {
  text-align: center;
  padding: 40px;
  background-color: #ffffff;
  border-radius: 12px;
  color: #e0245e;
  font-weight: bold;
  margin: 20px 0;
}

@media (max-width: 768px) {
  .list-meta {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
```