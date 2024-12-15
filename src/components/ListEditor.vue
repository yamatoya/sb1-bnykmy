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
          <label>タイトル</label>
          <input 
            type="text" 
            v-model="title" 
            class="form-control" 
            placeholder="リストのタイトルを入力"
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

          <draggable-tweet-list
            v-else
            v-model="selectedTweets"
            :documents="documents"
            @remove="removeTweet"
          />
        </div>

        <div class="form-actions">
          <router-link to="/lists" class="action-button secondary-button">キャンセル</router-link>
          <button type="submit" class="action-button primary-button" :disabled="!isValid">保存</button>
        </div>
      </form>
    </div>

    <tweet-selector
      v-if="showTweetSelector"
      :documents="documents"
      :current-document-id="''"
      :current-tweet-id="''"
      :initial-selections="selectedTweets"
      @save="handleTweetsSelected"
      @close="showTweetSelector = false"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'
import TweetSelector from './TweetSelector.vue'
import DraggableTweetList from './DraggableTweetList.vue'

const STORAGE_KEY = 'legal-documents-data'

export default {
  name: 'ListEditor',
  components: {
    TweetSelector,
    DraggableTweetList
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const documents = ref(null)
    const title = ref('')
    const description = ref('')
    const selectedTweets = ref([])
    const showTweetSelector = ref(false)

    const isEditing = computed(() => route.params.id !== undefined)

    const isValid = computed(() => {
      return title.value && selectedTweets.value.length > 0
    })

    const handleTweetsSelected = (tweets) => {
      selectedTweets.value = tweets
      showTweetSelector.value = false
    }

    const removeTweet = (tweetPath) => {
      selectedTweets.value = selectedTweets.value.filter(t => t !== tweetPath)
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

      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          const documents = JSON.parse(storedData)
          if (!documents.lists) {
            documents.lists = []
          }

          if (isEditing.value) {
            const index = documents.lists.findIndex(l => l.id === list.id)
            if (index !== -1) {
              list.createdAt = documents.lists[index].createdAt
              documents.lists[index] = list
            }
          } else {
            documents.lists.push(list)
          }

          localStorage.setItem(STORAGE_KEY, JSON.stringify(documents))
          router.push('/lists')
        } catch (e) {
          console.error('Failed to save list:', e)
        }
      }
    }

    const loadList = () => {
      if (!isEditing.value) return

      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          const documents = JSON.parse(storedData)
          if (documents.lists) {
            const list = documents.lists.find(l => l.id === route.params.id)
            if (list) {
              title.value = list.title
              description.value = list.description || ''
              selectedTweets.value = list.tweets
            }
          }
        } catch (e) {
          console.error('Failed to load list:', e)
        }
      }
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
      documents,
      title,
      description,
      selectedTweets,
      showTweetSelector,
      isEditing,
      isValid,
      handleTweetsSelected,
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
  font-size: 20px;
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

.form-actions {
  margin-top: 40px;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

@media (max-width: 768px) {
  .page-header {
    padding: 16px;
  }

  .page-content {
    padding: 20px;
  }

  .editor-form {
    padding: 16px;
  }

  .section-header {
    flex-direction: column;
    gap: 12px;
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 12px;
  }

  .action-button {
    width: 100%;
  }
}
</style>