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
      
      <div v-for="article in revision.articles" :key="article.id" class="article-container">
        <div class="article-status" :class="article.status">{{ article.status }}</div>
        <div class="comparison-container">
          <div class="comparison-column before">
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

    // URL パラメータが変更されたときに選択を更新
    watch(() => route.query.revision, (newRevision) => {
      selectedRevision.value = newRevision || ''
    })

    const onRevisionChange = () => {
      // 選択が変更されたときに URL を更新
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
        return document.value.revisions
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

    const highlightChanges = (before, after) => {
      if (!before) return after // 新設の場合は下線なしで表示

      // HTMLタグを一時的にプレースホルダーに置き換え
      const tags = []
      const processedBefore = before.replace(/<[^>]+>/g, match => {
        tags.push(match)
        return `___TAG${tags.length - 1}___`
      })
      const processedAfter = after.replace(/<[^>]+>/g, match => {
        const index = tags.indexOf(match)
        if (index === -1) {
          tags.push(match)
        }
        return `___TAG${tags.indexOf(match)}___`
      })

      // 差分を計算
      const diff = diffChars(processedBefore, processedAfter)
      
      // 差分をマークアップ
      let result = ''
      diff.forEach(part => {
        if (!part.added && !part.removed) {
          result += part.value
        } else if (part.added) {
          result += `<span class="diff-added">${part.value}</span>`
        }
      })

      // HTMLタグを復元
      return result.replace(/___TAG(\d+)___/g, (_, i) => tags[i])
    }

    return {
      document,
      selectedRevision,
      filteredRevisions,
      formatDate,
      highlightChanges,
      onRevisionChange
    }
  }
}
</script>

<style>
/* スタイルは変更なし */
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
}
</style>