<template>
  <div class="tweet-comments">
    <button 
      class="toggle-comments" 
      @click="isExpanded = !isExpanded"
    >
      <i :class="['fas', isExpanded ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
      コメント ({{ comments.length }})
    </button>

    <div v-show="isExpanded" class="comments-content">
      <form @submit.prevent="submitComment" class="comment-form">
        <textarea 
          v-model="newComment" 
          class="comment-input"
          placeholder="コメントを入力..."
          required
        ></textarea>
        <button type="submit" class="submit-button">
          <i class="fas fa-paper-plane"></i>
          投稿
        </button>
      </form>

      <div v-if="comments.length === 0" class="no-comments">
        コメントはまだありません
      </div>
      
      <div v-else class="comments-list">
        <div v-for="comment in sortedComments" :key="comment.id" class="comment-item">
          <div class="comment-header">
            <span class="comment-date">{{ formatDate(comment.date) }}</span>
          </div>
          <div class="comment-content">{{ comment.content }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { formatDate } from '../utils/formatters'

export default {
  name: 'TweetComments',
  props: {
    listId: {
      type: String,
      required: true
    },
    tweetPath: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const newComment = ref('')
    const comments = ref([])
    const isExpanded = ref(false)
    const STORAGE_KEY = 'legal-documents-data'

    const sortedComments = computed(() => {
      return [...comments.value].sort((a, b) => new Date(b.date) - new Date(a.date))
    })

    const loadComments = () => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          const data = JSON.parse(storedData)
          const list = data.lists?.find(l => l.id === props.listId)
          if (list) {
            if (!list.tweetComments) list.tweetComments = {}
            comments.value = list.tweetComments[props.tweetPath] || []
          }
        } catch (e) {
          console.error('Failed to load comments:', e)
        }
      }
    }

    const saveComments = async (newComments) => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          const data = JSON.parse(storedData)
          const listIndex = data.lists.findIndex(l => l.id === props.listId)
          if (listIndex !== -1) {
            if (!data.lists[listIndex].tweetComments) {
              data.lists[listIndex].tweetComments = {}
            }
            data.lists[listIndex].tweetComments[props.tweetPath] = newComments
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
          }
        } catch (e) {
          console.error('Failed to save comments:', e)
        }
      }
    }

    const submitComment = async () => {
      if (!newComment.value.trim()) return

      const comment = {
        id: uuidv4(),
        content: newComment.value,
        date: new Date().toISOString()
      }

      comments.value = [...comments.value, comment]
      await saveComments(comments.value)
      newComment.value = ''
    }

    loadComments()

    return {
      newComment,
      comments,
      isExpanded,
      sortedComments,
      submitComment,
      formatDate
    }
  }
}
</script>

<style scoped>
.tweet-comments {
  margin-top: 12px;
  border-top: 1px solid #e1e8ed;
}

.toggle-comments {
  width: 100%;
  padding: 8px;
  background: none;
  border: none;
  color: #657786;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.toggle-comments:hover {
  background-color: #f8f9fa;
}

.comments-content {
  padding: 16px;
}

.comment-form {
  margin-bottom: 16px;
}

.comment-input {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  resize: vertical;
  margin-bottom: 8px;
  font-size: 14px;
}

.comment-input:focus {
  outline: none;
  border-color: #1da1f2;
  box-shadow: 0 0 0 2px rgba(29, 161, 242, 0.1);
}

.submit-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #1da1f2;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.submit-button:hover {
  background-color: #1991db;
}

.no-comments {
  text-align: center;
  padding: 20px;
  color: #657786;
  font-style: italic;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item {
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.comment-header {
  margin-bottom: 4px;
}

.comment-date {
  color: #657786;
  font-size: 12px;
}

.comment-content {
  font-size: 14px;
  line-height: 1.5;
  color: #14171a;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 768px) {
  .comments-content {
    padding: 12px;
  }

  .comment-input {
    font-size: 16px;
  }
}
</style>
