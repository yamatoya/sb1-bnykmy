<template>
  <div class="page">
    <div class="container">
      <header class="page-header">
        <router-link to="/lists" class="back-link">
          <i class="fas fa-arrow-left"></i>
        </router-link>
        <h1>{{ list?.title || 'リスト詳細' }}</h1>
      </header>

      <div v-if="list" class="list-detail">
        <div v-if="list.description" class="list-description">
          {{ list.description }}
        </div>

        <div class="list-meta">
          <span class="meta-item">
            <i class="fas fa-comment"></i>
            {{ list.tweets.length }}件のツイート
          </span>
          <span class="meta-item">
            <i class="fas fa-clock"></i>
            最終更新: {{ formatDate(list.updatedAt) }}
          </span>
        </div>

        <div class="tweets-list">
          <div v-for="tweet in tweets" :key="`${tweet.documentId}-${tweet.tweetId}`" class="card">
            <div class="card-header">
              <span class="document-name">{{ getDocumentName(tweet.documentId) }}</span>
            </div>
            <div class="card-content">
              <template v-if="isPublicComment(tweet.documentId)">
                <div class="qa-content">
                  <div class="question">
                    <div class="qa-label">
                      <i class="fas fa-question-circle"></i>
                      質問
                    </div>
                    <p class="tweet-content">{{ tweet.content.question }}</p>
                  </div>
                  <div class="answer">
                    <div class="qa-label">
                      <i class="fas fa-comment-dots"></i>
                      回答
                    </div>
                    <p class="tweet-content">{{ tweet.content.answer }}</p>
                  </div>
                </div>
              </template>
              <template v-else>
                <p class="tweet-content">{{ tweet.content }}</p>
              </template>
              <div class="tweet-actions">
                <router-link 
                  :to="`/document/${tweet.documentId}/${tweet.tweetId}`"
                  class="action-button secondary-button"
                >
                  <i class="fas fa-external-link-alt"></i>
                  元のツイートを表示
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="error-message">
        指定されたリストが見つかりません。
      </div>

      <footer class="footer">
        <div class="footer-content">
          <router-link 
            v-if="list"
            :to="`/lists/${list.id}/edit`" 
            class="action-button primary-button"
          >
            <i class="fas fa-pencil-alt"></i>
            リストを編集
          </router-link>
        </div>
      </footer>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { formatDate } from '../utils/formatters'

const LISTS_STORAGE_KEY = 'legal-documents-lists'
const STORAGE_KEY = 'legal-documents-data'

export default {
  name: 'ListDetail',
  setup() {
    const route = useRoute()
    const list = ref(null)
    const documents = ref(null)

    const tweets = computed(() => {
      if (!list.value || !documents.value) return []

      return list.value.tweets.map(tweet => {
        const doc = documents.value[tweet.documentId]
        if (!doc) return null

        if (doc.public_comment) {
          const question = doc.questions.find(q => q.id === tweet.tweetId)
          if (!question) return null
          return {
            documentId: tweet.documentId,
            tweetId: tweet.tweetId,
            content: {
              question: question.question,
              answer: question.answer
            }
          }
        } else {
          const tweetObj = doc.tweets.find(t => t.id === tweet.tweetId)
          if (!tweetObj) return null
          return {
            documentId: tweet.documentId,
            tweetId: tweet.tweetId,
            content: tweetObj.content
          }
        }
      }).filter(tweet => tweet !== null)
    })

    const getDocumentName = (documentId) => {
      const doc = documents.value?.[documentId]
      return doc ? doc.displayName : ''
    }

    const isPublicComment = (documentId) => {
      const doc = documents.value?.[documentId]
      return doc?.public_comment === true
    }

    const loadData = () => {
      // リストの読み込み
      const storedLists = localStorage.getItem(LISTS_STORAGE_KEY)
      if (storedLists) {
        try {
          const lists = JSON.parse(storedLists)
          list.value = lists.find(l => l.id === route.params.id)
        } catch (e) {
          console.error('Failed to load list:', e)
        }
      }

      // ドキュメントの読み込み
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          documents.value = JSON.parse(storedData)
        } catch (e) {
          console.error('Failed to load documents:', e)
        }
      }
    }

    onMounted(() => {
      loadData()
    })

    return {
      list,
      tweets,
      getDocumentName,
      isPublicComment,
      formatDate
    }
  }
}
</script>

<style scoped>
@import '../styles/common.css';

.list-description {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  color: #4b5563;
  line-height: 1.6;
}

.list-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 0 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #657786;
  font-size: 14px;
}

.tweets-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.document-name {
  font-weight: bold;
  color: #14171a;
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

.tweet-content {
  font-size: 16px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.tweet-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.error-message {
  text-align: center;
  padding: 40px;
  background-color: #ffffff;
  border-radius: 12px;
  color: #e0245e;
  font-weight: bold;
}

.footer {
  background-color: #ffffff;
  border-top: 1px solid #e1e8ed;
  padding: 16px;
  position: sticky;
  bottom: 0;
  z-index: 100;
}

.footer-content {
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .list-meta {
    flex-direction: column;
    gap: 12px;
  }

  .question,
  .answer {
    padding: 15px;
  }

  .tweet-content {
    font-size: 15px;
  }
}
</style>