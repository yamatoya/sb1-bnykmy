<template>
  <div class="page">
    <div class="container">
      <header class="page-header">
        <router-link to="/lists" class="back-link">
          <i class="fas fa-arrow-left"></i>
        </router-link>
        <h1>{{ isEditing ? 'リストの編集' : '新規リストの作成' }}</h1>
      </header>

      <form @submit.prevent="saveList" class="editor-form">
        <div class="form-group">
          <label>リスト名</label>
          <input 
            type="text" 
            v-model="title" 
            class="form-control" 
            placeholder="リスト名を入力"
            required
          />
        </div>

        <div class="form-group">
          <label>説明</label>
          <textarea 
            v-model="description" 
            class="form-control" 
            rows="3" 
            placeholder="リストの説明を入力"
          ></textarea>
        </div>

        <div class="tweets-section">
          <div class="section-header">
            <h2>ツイート</h2>
            <button type="button" class="action-button secondary-button" @click="showTweetSelector = true">
              <i class="fas fa-plus"></i>
              ツイートを追加
            </button>
          </div>

          <div v-if="selectedTweets.length === 0" class="no-items">
            ツイートが追加されていません
          </div>

          <div v-else class="selected-tweets">
            <div v-for="tweet in selectedTweets" :key="tweet.id" class="tweet-item">
              <div class="tweet-header">
                <span class="document-name">{{ getDocumentName(tweet.documentId) }}</span>
                <button type="button" class="remove-button" @click="removeTweet(tweet)">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="tweet-content">{{ getTweetContent(tweet) }}</div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <router-link to="/lists" class="action-button secondary-button">キャンセル</router-link>
          <button type="submit" class="action-button primary-button" :disabled="!isValid">保存</button>
        </div>
      </form>

      <tweet-selector
        v-if="showTweetSelector"
        :documents="documents"
        :initial-selections="selectedTweets.map(t => `${t.documentId}/${t.tweetId}`)"
        @save="saveTweets"
        @close="showTweetSelector = false"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'
import TweetSelector from './TweetSelector.vue'

const STORAGE_KEY = 'legal-documents-data'
const LISTS_STORAGE_KEY = 'legal-documents-lists'

export default {
  name: 'ListEditor',
  components: {
    TweetSelector
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const title = ref('')
    const description = ref('')
    const selectedTweets = ref([])
    const documents = ref(null)
    const showTweetSelector = ref(false)

    const isEditing = computed(() => route.params.id)
    const isValid = computed(() => title.value && selectedTweets.value.length > 0)

    const getDocumentName = (documentId) => {
      return documents.value?.[documentId]?.displayName || ''
    }

    const getTweetContent = (tweet) => {
      const doc = documents.value?.[tweet.documentId]
      if (!doc) return ''

      if (doc.public_comment) {
        const question = doc.questions.find(q => q.id === tweet.tweetId)
        return question ? `${question.question}\n${question.answer}` : ''
      } else {
        const tweetObj = doc.tweets.find(t => t.id === tweet.tweetId)
        return tweetObj?.content || ''
      }
    }

    const saveTweets = (selections) => {
      selectedTweets.value = selections.map(selection => {
        const [documentId, tweetId] = selection.split('/')
        return { documentId, tweetId }
      })
      showTweetSelector.value = false
    }

    const removeTweet = (tweet) => {
      selectedTweets.value = selectedTweets.value.filter(t => 
        t.documentId !== tweet.documentId || t.tweetId !== tweet.tweetId
      )
    }

    const loadList = () => {
      if (!isEditing.value) return

      const storedLists = localStorage.getItem(LISTS_STORAGE_KEY)
      if (storedLists) {
        try {
          const lists = JSON.parse(storedLists)
          const list = lists.find(l => l.id === route.params.id)
          if (list) {
            title.value = list.title
            description.value = list.description || ''
            selectedTweets.value = list.tweets
          }
        } catch (e) {
          console.error('Failed to load list:', e)
        }
      }
    }

    const saveList = () => {
      const list = {
        id: isEditing.value ? route.params.id : uuidv4(),
        title: title.value,
        description: description.value,
        tweets: selectedTweets.value,
        createdAt: isEditing.value ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const storedLists = localStorage.getItem(LISTS_STORAGE_KEY)
      const lists = storedLists ? JSON.parse(storedLists) : []

      if (isEditing.value) {
        const index = lists.findIndex(l => l.id === list.id)
        if (index !== -1) {
          list.createdAt = lists[index].createdAt
          lists[index] = list
        }
      } else {
        lists.push(list)
      }

      localStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify(lists))
      router.push('/lists')
    }

    onMounted(() => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          documents.value = JSON.parse(storedData)
          loadList()
        } catch (e) {
          console.error('Failed to load documents:', e)
        }
      }
    })

    return {
      title,
      description,
      selectedTweets,
      documents,
      showTweetSelector,
      isEditing,
      isValid,
      getDocumentName,
      getTweetContent,
      saveTweets,
      removeTweet,
      saveList
    }
  }
}
</script>

<style scoped>
@import '../styles/common.css';

.editor-form {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #14171a;
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  font-size: 16px;
  background-color: #ffffff;
}

.form-control:focus {
  outline: none;
  border-color: #1da1f2;
  box-shadow: 0 0 0 2px rgba(29, 161, 242, 0.1);
}

textarea.form-control {
  resize: vertical;
  min-height: 100px;
}

.tweets-section {
  margin-top: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  color: #14171a;
}

.no-items {
  text-align: center;
  padding: 40px;
  background-color: #f8f9fa;
  border-radius: 8px;
  color: #657786;
  font-style: italic;
}

.selected-tweets {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tweet-item {
  background-color: #f8f9fa;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  overflow: hidden;
}

.tweet-header {
  padding: 12px;
  background-color: #ffffff;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.document-name {
  font-weight: bold;
  color: #14171a;
}

.remove-button {
  background: none;
  border: none;
  color: #e0245e;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.remove-button:hover {
  background-color: rgba(224, 36, 94, 0.1);
}

.tweet-content {
  padding: 12px;
  white-space: pre-wrap;
  font-size: 14px;
  color: #14171a;
}

.form-actions {
  margin-top: 40px;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

@media (max-width: 768px) {
  .editor-form {
    padding: 16px;
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 12px;
  }
}
</style>