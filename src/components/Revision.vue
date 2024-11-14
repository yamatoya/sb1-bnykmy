<template>
  <div v-if="document">
    <div class="profile-header">
      <router-link :to="`/document/${$route.params.id}`" class="back-link">←</router-link>
      <h1>{{ document.displayName }}</h1>
    </div>

    <div class="revision-controls">
      <select v-model="selectedRevision" class="revision-select" @change="onRevisionChange">
        <option value="">全ての改訂を表示</option>
        <option v-for="rev in document.revisions" :key="rev.id" :value="rev.id">
          {{ rev.title }}
        </option>
      </select>
    </div>

    <div v-for="revision in filteredRevisions" :key="revision.id" class="revision-section">
      <h2 class="revision-title">{{ revision.title }} ({{ formatDate(revision.date) }})</h2>
      
      <div v-if="revision.description" class="revision-description">
        <p>{{ revision.description }}</p>
        <a v-if="revision.sourceUrl" :href="revision.sourceUrl" target="_blank" rel="noopener noreferrer" class="source-link">
          <i class="fas fa-external-link-alt"></i> ソースを表示
        </a>
      </div>

      <div v-if="revision.publicCommentLinks && revision.publicCommentLinks.length > 0" class="public-comments">
        <h3>関連するパブリックコメント</h3>
        <div v-for="commentId in revision.publicCommentLinks" :key="commentId" class="comment-item">
          <div v-if="getPublicComment(commentId)" class="comment-content">
            <div class="comment-header">
              <span class="comment-index">{{ getPublicComment(commentId).index }}</span>
              <router-link 
                :to="`/document/${$route.params.id}/${commentId}?type=public_comment&back=${$route.fullPath}`"
                class="view-link"
              >
                詳細を表示
              </router-link>
            </div>
            <div class="comment-text">
              <div class="question">
                <strong>質問:</strong> {{ getPublicComment(commentId).question }}
              </div>
              <div class="answer">
                <strong>回答:</strong> {{ getPublicComment(commentId).answer }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-for="article in revision.articles" :key="article.id" class="article-container">
        <div class="article-status" :class="article.status">{{ article.status }}</div>
        <div class="comparison-container">
          <div class="comparison-column before" v-if="article.status !== '新設'">
            <h3>改正前</h3>
            <div v-if="article.before" class="content" v-html="article.before"></div>
            <div v-else class="no-content">改正前の内容なし</div>
          </div>
          <div class="comparison-column after" v-if="article.status !== '削除'">
            <h3>改正後</h3>
            <div v-if="article.after" class="content" v-html="highlightChanges(article.before, article.after)"></div>
            <div v-else class="no-content">改正後の内容なし</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { diffChars } from 'diff'

const STORAGE_KEY = 'legal-documents-data'

export default {
  name: 'Revision',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const document = ref(null)
    const selectedRevision = ref('')

    const loadDocument = () => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          const documents = JSON.parse(storedData)
          document.value = documents[route.params.id]
        } catch (e) {
          console.error('Failed to parse stored documents:', e)
        }
      }
    }

    onMounted(() => {
      loadDocument()
      selectedRevision.value = route.query.revision || ''
    })

    watch(() => route.query.revision, (newRevision) => {
      selectedRevision.value = newRevision || ''
    })

    const onRevisionChange = () => {
      router.replace({
        query: {
          ...route.query,
          revision: selectedRevision.value || undefined
        }
      })
    }

    const filteredRevisions = computed(() => {
      if (!document.value?.revisions) return []
      if (!selectedRevision.value) {
        return [...document.value.revisions].sort((a, b) => new Date(b.date) - new Date(a.date))
      }
      return document.value.revisions.filter(rev => rev.id === selectedRevision.value)
    })

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    const getPublicComment = (commentId) => {
      if (!document.value?.questions) return null
      return document.value.questions.find(q => q.id === commentId)
    }

    const highlightChanges = (before, after) => {
      if (!before) return after

      const diff = diffChars(before, after)
      let result = ''
      
      diff.forEach(part => {
        if (part.added) {
          result += `<span class="diff-added">${part.value}</span>`
        } else if (!part.removed) {
          result += part.value
        }
      })
      
      return result
    }

    return {
      document,
      selectedRevision,
      filteredRevisions,
      formatDate,
      highlightChanges,
      onRevisionChange,
      getPublicComment
    }
  }
}
</script>

<style scoped>
.profile-header {
  background-color: #f0f0f0;
  padding: 20px;
  margin-bottom: 20px;
  position: relative;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-link {
  position: absolute;
  left: 20px;
  font-size: 24px;
  text-decoration: none;
  color: #1da1f2;
  z-index: 1;
}

h1 {
  margin: 0;
  padding: 0 40px;
  text-align: center;
  font-size: 1.5em;
  max-width: 80%;
  word-break: break-word;
}

.revision-controls {
  margin: 20px;
  text-align: center;
}

.revision-select {
  padding: 8px 16px;
  font-size: 16px;
  border: 1px solid #e1e8ed;
  border-radius: 4px;
  background-color: white;
  min-width: 200px;
}

.revision-section {
  margin: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.revision-title {
  padding: 15px 20px;
  background-color: #f7f9fa;
  border-bottom: 1px solid #e1e8ed;
  margin: 0;
  font-size: 1.2em;
}

.revision-description {
  padding: 15px 20px;
  border-bottom: 1px solid #e1e8ed;
  background-color: #f8f9fa;
}

.source-link {
  display: inline-block;
  margin-top: 10px;
  color: #1da1f2;
  text-decoration: none;
}

.source-link:hover {
  text-decoration: underline;
}

.public-comments {
  margin: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e1e8ed;
}

.public-comments h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #14171a;
}

.comment-item {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
}

.comment-item:last-child {
  margin-bottom: 0;
}

.comment-content {
  padding: 16px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.comment-index {
  display: inline-block;
  padding: 4px 8px;
  background-color: #e8f5fd;
  color: #1da1f2;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.view-link {
  color: #1da1f2;
  text-decoration: none;
  font-size: 14px;
}

.view-link:hover {
  text-decoration: underline;
}

.comment-text {
  font-size: 14px;
  line-height: 1.5;
}

.question,
.answer {
  margin-bottom: 8px;
}

.question:last-child,
.answer:last-child {
  margin-bottom: 0;
}

.question strong,
.answer strong {
  color: #657786;
}

.article-container {
  padding: 20px;
  border-bottom: 1px solid #e1e8ed;
}

.article-container:last-child {
  border-bottom: none;
}

.article-status {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-size: 0.9em;
  font-weight: bold;
}

.article-status.改正 {
  background-color: #e6f3ff;
  color: #0366d6;
}

.article-status.新設 {
  background-color: #e6ffed;
  color: #28a745;
}

.article-status.削除 {
  background-color: #ffeef0;
  color: #d73a49;
}

.comparison-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.comparison-column {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
}

.comparison-column h3 {
  margin: 0 0 10px 0;
  font-size: 1em;
  color: #586069;
}

.content {
  white-space: pre-wrap;
  line-height: 1.6;
}

.no-content {
  color: #666;
  font-style: italic;
  padding: 10px 0;
}

.diff-added {
  background-color: #e6ffed;
  text-decoration: underline;
  text-decoration-color: #28a745;
  text-decoration-thickness: 2px;
}

@media (max-width: 768px) {
  .profile-header {
    padding: 40px 20px;
  }

  h1 {
    font-size: 1.2em;
    max-width: 100%;
    padding: 0 30px;
  }

  .comparison-container {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .revision-section {
    margin: 10px;
  }

  .article-container {
    padding: 15px;
  }

  .revision-select {
    width: 100%;
    max-width: 300px;
  }

  .public-comments {
    margin: 15px;
    padding: 15px;
  }

  .comment-content {
    padding: 12px;
  }

  .comment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>