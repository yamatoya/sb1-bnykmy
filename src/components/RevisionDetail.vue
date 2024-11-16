<template>
  <div class="revision-page">
    <header class="page-header">
      <router-link :to="backLink" class="back-link">
        <i class="fas fa-arrow-left"></i>
        <span>戻る</span>
      </router-link>
      <h1>{{ pageTitle }}</h1>
    </header>

    <main class="page-content">
      <div v-if="currentRevision" class="revision-content">
        <div class="revision-header">
          <div class="revision-title">{{ currentRevision.title }}</div>
          <div class="revision-date">{{ formatDate(currentRevision.date) }}</div>
        </div>

        <div v-if="currentRevision.description" class="revision-description">
          {{ currentRevision.description }}
        </div>

        <div v-if="currentRevision.sourceUrl" class="revision-source">
          <a :href="currentRevision.sourceUrl" target="_blank" rel="noopener noreferrer">
            <i class="fas fa-external-link-alt"></i>
            参考リンク
          </a>
        </div>

        <div v-if="publicComments.length > 0" class="public-comments">
          <h2>関連するパブリックコメント</h2>
          <div class="public-comments-list">
            <router-link
              v-for="comment in publicComments"
              :key="comment.id"
              :to="`/document/${comment.id}`"
              class="public-comment-link"
            >
              {{ formatDisplayName(comment.displayName) }}
            </router-link>
          </div>
        </div>

        <div class="articles-list">
          <div v-for="article in currentRevision.articles" :key="article.id" class="article-container">
            <div class="article-status" :class="article.status">{{ article.status }}</div>
            <div class="comparison-container">
              <div class="comparison-column before">
                <h4>改正前</h4>
                <div v-if="article.before" class="content">{{ article.before }}</div>
                <div v-else class="no-content">改正前の内容なし</div>
              </div>
              <div class="comparison-column after">
                <h4>改正後</h4>
                <div v-if="article.status === '削除'" class="content deleted">削除</div>
                <div v-else-if="article.after" class="content">{{ article.after }}</div>
                <div v-else class="no-content">改正後の内容なし</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-revision">
        指定された改訂が見つかりません
      </div>
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const STORAGE_KEY = 'legal-documents-data'

export default {
  name: 'RevisionDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const documents = ref(null)

    const documentId = computed(() => route.params.documentId)
    const revisionId = computed(() => route.params.revisionId)
    
    const backLink = computed(() => `/revisions/${documentId.value}`)

    const currentDocument = computed(() => {
      if (!documents.value || !documentId.value) return null
      return documents.value[documentId.value]
    })

    const currentRevision = computed(() => {
      if (!currentDocument.value?.revisions) return null
      return currentDocument.value.revisions.find(r => r.id === revisionId.value)
    })

    const pageTitle = computed(() => {
      if (!currentDocument.value) return '改訂詳細'
      return `${formatDisplayName(currentDocument.value.displayName)} - 改訂詳細`
    })

    const publicComments = computed(() => {
      if (!currentRevision.value?.publicCommentLinks || !documents.value) return []
      return currentRevision.value.publicCommentLinks
        .map(id => documents.value[id])
        .filter(doc => doc && doc.public_comment)
    })

    const formatDisplayName = (name) => {
      return name?.replace(/<br>/gi, '') || ''
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    onMounted(() => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          documents.value = JSON.parse(storedData)
        } catch (e) {
          console.error('Failed to parse stored documents:', e)
        }
      }
    })

    return {
      currentDocument,
      currentRevision,
      backLink,
      pageTitle,
      publicComments,
      formatDisplayName,
      formatDate
    }
  }
}
</script>

<style scoped>
.revision-page {
  min-height: 100vh;
  background-color: #f7f9fa;
}

.page-header {
  background-color: #ffffff;
  padding: 20px;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1da1f2;
  text-decoration: none;
  font-size: 16px;
}

.back-link:hover {
  color: #1991db;
}

h1 {
  margin: 0;
  font-size: 24px;
  color: #14171a;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.revision-content {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  overflow: hidden;
}

.revision-header {
  padding: 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e1e8ed;
}

.revision-title {
  font-size: 20px;
  font-weight: bold;
  color: #14171a;
  margin-bottom: 8px;
}

.revision-date {
  color: #657786;
  font-size: 14px;
}

.revision-description {
  padding: 20px;
  color: #4b5563;
  border-bottom: 1px solid #e1e8ed;
  line-height: 1.6;
}

.revision-source {
  padding: 20px;
  border-bottom: 1px solid #e1e8ed;
}

.revision-source a {
  color: #1da1f2;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.revision-source a:hover {
  text-decoration: underline;
}

.public-comments {
  padding: 20px;
  border-bottom: 1px solid #e1e8ed;
}

.public-comments h2 {
  font-size: 16px;
  margin: 0 0 16px;
  color: #14171a;
}

.public-comments-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.public-comment-link {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background-color: #e8f5fd;
  color: #1da1f2;
  border-radius: 16px;
  text-decoration: none;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.public-comment-link:hover {
  background-color: #d8effd;
}

.articles-list {
  padding: 20px;
}

.article-container {
  margin-bottom: 24px;
}

.article-container:last-child {
  margin-bottom: 0;
}

.article-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
}

.article-status.改正 {
  background-color: #e8f5fd;
  color: #1da1f2;
}

.article-status.新設 {
  background-color: #dcfce7;
  color: #16a34a;
}

.article-status.削除 {
  background-color: #fee2e2;
  color: #ef4444;
}

.comparison-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.comparison-column {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.comparison-column h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #657786;
}

.content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  font-size: 14px;
}

.content.deleted {
  color: #ef4444;
  font-weight: bold;
  font-style: italic;
}

.no-content {
  color: #657786;
  font-style: italic;
  padding: 12px;
  background-color: #ffffff;
  border-radius: 4px;
  font-size: 14px;
}

.no-revision {
  text-align: center;
  padding: 40px;
  background-color: #ffffff;
  border-radius: 8px;
  color: #657786;
  font-style: italic;
}

@media (max-width: 768px) {
  .page-header {
    padding: 16px;
    flex-wrap: wrap;
  }

  h1 {
    font-size: 20px;
    width: 100%;
    order: -1;
    margin-bottom: 12px;
  }

  .page-content {
    padding: 20px 16px;
  }

  .revision-header {
    padding: 16px;
  }

  .revision-description,
  .revision-source,
  .public-comments,
  .articles-list {
    padding: 16px;
  }

  .comparison-container {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .public-comments-list {
    width: 100%;
  }

  .public-comment-link {
    width: 100%;
    justify-content: center;
  }
}
</style>