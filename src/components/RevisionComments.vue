<template>
  <div class="comments-section">
    <h3>コメント</h3>
    
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
          <span class="comment-author">{{ comment.author }}</span>
          <span class="comment-date">{{ formatDate(comment.date) }}</span>
        </div>
        <div class="comment-content" v-html="formatComment(comment.content)"></div>
        <div v-if="comment.urlPreviews" class="url-previews">
          <div v-for="preview in comment.urlPreviews" :key="preview.url" class="url-preview-card">
            <a :href="preview.url" target="_blank" rel="noopener noreferrer">
              <div class="preview-content">
                <h4 class="preview-title">{{ preview.title }}</h4>
                <span class="preview-url">{{ formatUrl(preview.url) }}</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { formatDate } from '../utils/formatters'

const URL_REGEX = /(https?:\/\/[^\s]+)/g

export default {
  name: 'RevisionComments',
  props: {
    documentId: {
      type: String,
      required: true
    },
    revisionId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const newComment = ref('')
    const comments = ref([])
    const STORAGE_KEY = 'legal-documents-data'

    const sortedComments = computed(() => {
      return [...comments.value].sort((a, b) => new Date(b.date) - new Date(a.date))
    })

    const loadComments = () => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          const documents = JSON.parse(storedData)
          const document = documents[props.documentId]
          if (document?.revisions) {
            const revision = document.revisions.find(r => r.id === props.revisionId)
            if (revision) {
              comments.value = revision.comments || []
            }
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
          const documents = JSON.parse(storedData)
          const document = documents[props.documentId]
          const revision = document.revisions.find(r => r.id === props.revisionId)
          revision.comments = newComments
          localStorage.setItem(STORAGE_KEY, JSON.stringify(documents))
        } catch (e) {
          console.error('Failed to save comments:', e)
        }
      }
    }

    const extractUrls = (text) => {
      return text.match(URL_REGEX) || []
    }

    const fetchUrlTitle = async (url) => {
      try {
        const response = await fetch(url)
        const html = await response.text()
        const match = html.match(/<title>(.*?)<\/title>/)
        return match ? match[1] : url
      } catch (e) {
        console.error('Failed to fetch URL title:', e)
        return url
      }
    }

    const submitComment = async () => {
      if (!newComment.value.trim()) return

      const urls = extractUrls(newComment.value)
      const urlPreviews = []

      if (urls.length > 0) {
        for (const url of urls) {
          const title = await fetchUrlTitle(url)
          urlPreviews.push({ url, title })
        }
      }

      const comment = {
        id: uuidv4(),
        author: 'pooh',
        content: newComment.value,
        date: new Date().toISOString(),
        urlPreviews: urlPreviews.length > 0 ? urlPreviews : null
      }

      comments.value = [...comments.value, comment]
      await saveComments(comments.value)
      newComment.value = ''
    }

    const formatComment = (content) => {
      return content.replace(URL_REGEX, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`)
    }

    const formatUrl = (url) => {
      return url.length > 50 ? url.substring(0, 50) + '...' : url
    }

    loadComments()

    return {
      newComment,
      comments,
      sortedComments,
      submitComment,
      formatDate,
      formatComment,
      formatUrl
    }
  }
}
</script>

<style scoped>
.comments-section {
  margin-top: 20px;
  padding: 20px;
  background-color: #ffffff;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
}

.comments-section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #14171a;
}

.comment-form {
  margin-bottom: 20px;
}

.comment-input {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  resize: vertical;
  margin-bottom: 12px;
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
  padding: 40px;
  color: #657786;
  font-style: italic;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: bold;
  color: #14171a;
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

.comment-content :deep(a) {
  color: #1da1f2;
  text-decoration: none;
}

.comment-content :deep(a:hover) {
  text-decoration: underline;
}

.url-previews {
  margin-top: 12px;
}

.url-preview-card {
  margin-top: 8px;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  overflow: hidden;
  background-color: #ffffff;
}

.url-preview-card a {
  text-decoration: none;
  color: inherit;
  display: block;
  padding: 12px;
}

.url-preview-card:hover {
  background-color: #f3f4f6;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-title {
  margin: 0;
  font-size: 14px;
  color: #14171a;
}

.preview-url {
  font-size: 12px;
  color: #657786;
}

@media (max-width: 768px) {
  .comments-section {
    padding: 16px;
  }

  .comment-input {
    font-size: 16px;
  }
}
</style>