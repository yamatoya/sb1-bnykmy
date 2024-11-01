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
        <h3>参考情報:</h3>
        <p>{{ revision.description }}</p>
      </div>

      <div v-if="revision.url" class="revision-url">
        <h3>参考リンク:</h3>
        <a :href="revision.url" target="_blank" rel="noopener noreferrer">{{ revision.url }}</a>
      </div>
      
      <div v-for="article in revision.articles" :key="article.id" class="article-container">
        <div class="article-status" :class="article.status">{{ article.status }}</div>
        <div class="comparison-container">
          <div class="comparison-column before">
            <h3>改正前</h3>
            <div v-if="article.before" class="content" v-html="article.before"></div>
            <div v-else class="no-content">改正前の内容なし</div>
          </div>
          <div class="comparison-column after">
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
import documentsData from '../documents.json'
import { diffChars } from 'diff'

export default {
  name: 'Revision',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const document = ref(null)
    const selectedRevision = ref('')

    onMounted(() => {
      document.value = documentsData[route.params.id]
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
      if (!document.value) return []
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
      if (!before) return after

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

      const diff = diffChars(processedBefore, processedAfter)
      
      let result = ''
      diff.forEach(part => {
        if (!part.added && !part.removed) {
          result += part.value
        } else if (part.added) {
          result += `<span class="diff-added">${part.value}</span>`
        }
      })

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

.revision-description,
.revision-url {
  padding: 15px 20px;
  border-bottom: 1px solid #e1e8ed;
  background-color: #f8f9fa;
}

.revision-description h3,
.revision-url h3 {
  color: #586069;
  font-size: 1em;
  margin-bottom: 8px;
}

.revision-description p {
  margin: 0;
  line-height: 1.6;
  color: #24292e;
}

.revision-url a {
  color: #0366d6;
  text-decoration: none;
  word-break: break-all;
}

.revision-url a:hover {
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

  .revision-description,
  .revision-url {
    padding: 12px 15px;
  }
}
</style>