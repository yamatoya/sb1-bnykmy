<template>
  <div class="page">
    <div class="container">
      <header class="page-header">
        <router-link to="/" class="back-link">
          <i class="fas fa-arrow-left"></i>
        </router-link>
        <h1>リスト一覧</h1>
      </header>

      <div class="lists-header">
        <router-link to="/lists/new" class="action-button primary-button">
          <i class="fas fa-plus"></i>
          新規リストを作成
        </router-link>
      </div>

      <div v-if="lists.length === 0" class="no-lists">
        リストがありません
      </div>

      <div v-else class="lists-grid">
        <div v-for="list in sortedLists" :key="list.id" class="card">
          <div class="card-header">
            <router-link :to="`/lists/${list.id}`" class="list-title">
              {{ list.title }}
            </router-link>
            <div class="list-actions">
              <router-link 
                :to="`/lists/${list.id}/edit`"
                class="action-button secondary-button"
              >
                <i class="fas fa-pencil-alt"></i>
                編集
              </router-link>
              <button 
                class="action-button warning-button"
                @click="deleteList(list)"
              >
                <i class="fas fa-trash"></i>
                削除
              </button>
            </div>
          </div>
          <div class="card-content">
            <div v-if="list.description" class="list-description">
              {{ list.description }}
            </div>
            <div class="list-meta">
              <span class="tweet-count">
                <i class="fas fa-list"></i>
                {{ list.tweets.length }}件のツイート
              </span>
              <span class="update-date">
                {{ formatDate(list.updatedAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { formatDate } from '../utils/formatters'

const STORAGE_KEY = 'legal-documents-data'

export default {
  name: 'Lists',
  setup() {
    const router = useRouter()
    const lists = ref([])

    const sortedLists = computed(() => {
      return [...lists.value].sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
      )
    })

    const loadLists = () => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          const documents = JSON.parse(storedData)
          lists.value = documents.lists || []
        } catch (e) {
          console.error('Failed to load lists:', e)
          lists.value = []
        }
      }
    }

    const deleteList = (list) => {
      if (confirm('このリストを削除してもよろしいですか？')) {
        const storedData = localStorage.getItem(STORAGE_KEY)
        if (storedData) {
          try {
            const documents = JSON.parse(storedData)
            documents.lists = documents.lists.filter(l => l.id !== list.id)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(documents))
            lists.value = documents.lists
          } catch (e) {
            console.error('Failed to delete list:', e)
          }
        }
      }
    }

    onMounted(() => {
      loadLists()
    })

    return {
      lists,
      sortedLists,
      deleteList,
      formatDate
    }
  }
}
</script>

<style scoped>
@import '../styles/common.css';

.lists-header {
  margin: 20px 0;
  display: flex;
  justify-content: flex-end;
}

.no-lists {
  text-align: center;
  padding: 40px;
  background-color: #ffffff;
  border-radius: 12px;
  color: #657786;
  font-style: italic;
  margin: 20px 0;
}

.lists-grid {
  display: grid;
  gap: 20px;
  margin: 20px 0;
}

.list-title {
  font-size: 18px;
  font-weight: bold;
  color: #14171a;
  text-decoration: none;
  transition: color 0.2s ease;
}

.list-title:hover {
  color: #1da1f2;
}

.list-actions {
  display: flex;
  gap: 8px;
}

.list-description {
  color: #4b5563;
  margin-bottom: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.list-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #657786;
  font-size: 14px;
}

.tweet-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

.update-date {
  font-size: 12px;
}

.warning-button {
  background-color: #fee2e2;
  color: #ef4444;
  border: none;
}

.warning-button:hover {
  background-color: #fecaca;
}

@media (max-width: 768px) {
  .lists-header {
    margin: 16px 0;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
  }

  .list-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .list-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>