<template>
  <div class="page">
    <div class="container">
      <header class="page-header">
        <router-link to="/" class="back-link">
          <i class="fas fa-arrow-left"></i>
        </router-link>
        <h1>リスト一覧</h1>
      </header>

      <div class="lists-container">
        <div v-if="lists.length === 0" class="no-lists">
          リストがありません
        </div>

        <div v-else class="lists">
          <div v-for="list in sortedLists" :key="list.id" class="card">
            <div class="card-header">
              <h2>{{ list.title }}</h2>
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
            <div v-if="list.description" class="list-description">
              {{ list.description }}
            </div>
            <div class="list-meta">
              <span class="tweet-count">{{ list.tweets.length }}件のツイート</span>
              <span class="update-date">{{ formatDate(list.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <footer class="footer">
        <div class="footer-content">
          <router-link to="/lists/new" class="action-button primary-button">
            <i class="fas fa-plus"></i>
            新規リストを作成
          </router-link>
        </div>
      </footer>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { formatDate } from '../utils/formatters'

const LISTS_STORAGE_KEY = 'legal-documents-lists'

export default {
  name: 'Lists',
  setup() {
    const lists = ref([])

    const sortedLists = computed(() => {
      return [...lists.value].sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
      )
    })

    const loadLists = () => {
      const storedLists = localStorage.getItem(LISTS_STORAGE_KEY)
      if (storedLists) {
        try {
          lists.value = JSON.parse(storedLists)
        } catch (e) {
          console.error('Failed to load lists:', e)
          lists.value = []
        }
      }
    }

    const deleteList = (list) => {
      if (confirm('このリストを削除してもよろしいですか？')) {
        lists.value = lists.value.filter(l => l.id !== list.id)
        localStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify(lists.value))
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

.lists-container {
  margin: 20px 0;
}

.no-lists {
  text-align: center;
  padding: 40px;
  background-color: #ffffff;
  border-radius: 12px;
  color: #657786;
  font-style: italic;
}

.lists {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  color: #14171a;
}

.list-actions {
  display: flex;
  gap: 8px;
}

.list-description {
  margin-top: 12px;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.5;
}

.list-meta {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  color: #657786;
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
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .list-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>