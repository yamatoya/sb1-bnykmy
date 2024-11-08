<template>
  <div v-if="document" class="tweet-container">
    <div class="tweet-profile-header">
      <a @click="goBack" class="tweet-back-link">←</a>
      <h1 v-html="formattedDisplayName"></h1>
    </div>
    <div class="tweet">
      <div v-if="document.public_comment && qaItem">
        <div class="qa-content">
          <div class="question">
            <h3>質問</h3>
            <p v-html="highlightedQuestion"></p>
          </div>
          <div class="answer">
            <h3>回答</h3>
            <p v-html="qaItem.answer"></p>
          </div>
          <div v-if="qaItem.links" class="tweet-links">
            <h3>関連リンク:</h3>
            <tweet-links :links="qaItem.links" :base-url="$route.params.documentId"></tweet-links>
          </div>
        </div>
      </div>
      <div v-else-if="tweet">
        <div class="tweet-header">
          <span class="index">{{ tweet.index }}</span>
          <span class="document-title" v-html="formattedDisplayName"></span>
        </div>
        <p class="tweet-content" v-html="highlightedContent"></p>
        <div class="tweet-actions">
          <button class="copy-url-btn" @click="copyUrl">
            <i class="fas fa-link"></i> URLをコピー
          </button>
          <button v-if="!tweet.revision" class="add-revision-btn" @click="addRevisionLink">
            <i class="fas fa-plus"></i> 改訂履歴を追加
          </button>
        </div>
        <div v-if="tweet.links && tweet.links.length > 0" class="tweet-links">
          <h3>関連リンク:</h3>
          <tweet-links :links="tweet.links" :base-url="$route.params.documentId"></tweet-links>
        </div>
        <div v-if="revisionHistory && revisionHistory.length > 0" class="revision-history">
          <h3>改訂履歴:</h3>
          <div v-for="revision in revisionHistory" :key="revision.id" class="revision-section">
            <div class="revision-header">
              <h4 class="revision-title">{{ revision.title }}</h4>
              <button class="remove-revision-link" @click="removeRevisionLink(revision.id)">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div v-if="revision.description" class="revision-description">
              <h5>参考情報:</h5>
              <p>{{ revision.description }}</p>
            </div>
            <div v-if="revision.url" class="revision-url">
              <h5>参考リンク:</h5>
              <a :href="revision.url" target="_blank" rel="noopener noreferrer">{{ revision.url }}</a>
            </div>
            <div v-for="article in getRevisionArticles(revision)" :key="article.id" class="article-container">
              <div class="article-status" :class="article.status">{{ article.status }}</div>
              <div class="comparison-container">
                <div class="comparison-column before">
                  <h5>改正前</h5>
                  <div v-if="article.before" class="content" v-html="article.before"></div>
                  <div v-else class="no-content">改正前の内容なし</div>
                </div>
                <div class="comparison-column after">
                  <h5>改正後</h5>
                  <div v-if="article.after" class="content" v-html="highlightChanges(article.before, article.after)"></div>
                  <div v-else class="no-content">改正後の内容なし</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 改訂履歴選択モーダル -->
  <div v-if="showRevisionSelector" class="modal-overlay" @click="showRevisionSelector = false">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>改訂履歴の選択</h2>
        <button class="close-button" @click="showRevisionSelector = false">&times;</button>
      </div>
      <div class="modal-body">
        <div v-for="doc in documents" :key="doc.accountId" class="revision-document">
          <h3>{{ doc.displayName }}</h3>
          <div v-if="doc.revisions && doc.revisions.length > 0" class="revision-list">
            <div v-for="revision in doc.revisions" :key="revision.id" class="revision-option">
              <div class="revision-option-header">
                <h4>{{ revision.title }}</h4>
                <span class="revision-date">{{ formatDate(revision.date) }}</span>
              </div>
              <div class="article-options">
                <div v-for="article in revision.articles" :key="article.id" class="article-option">
                  <label class="article-checkbox">
                    <input 
                      type="checkbox" 
                      :value="{ docId: doc.accountId, revisionId: revision.id, articleId: article.id }"
                      v-model="selectedRevisionArticles"
                    >
                    <span class="article-preview">
                      {{ getArticlePreview(article) }}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-revisions">
            改訂履歴がありません
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-button" @click="showRevisionSelector = false">キャンセル</button>
        <button class="save-button" @click="saveRevisionLinks" :disabled="selectedRevisionArticles.length === 0">
          選択した改訂を追加
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TweetLinks from './TweetLinks.vue'
import { diffChars } from 'diff'

const STORAGE_KEY = 'legal-documents-data'

export default {
  name: 'Tweet',
  components: {
    TweetLinks
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const document = ref(null)
    const documents = ref(null)
    const tweet = ref(null)
    const qaItem = ref(null)
    const showRevisionSelector = ref(false)
    const selectedRevisionArticles = ref([])

    const loadData = () => {
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          documents.value = JSON.parse(storedData)
          document.value = documents.value[route.params.documentId]
          if (document.value.public_comment) {
            qaItem.value = document.value.questions.find(q => q.id === route.params.tweetId)
          } else {
            tweet.value = document.value.tweets.find(t => t.id === route.params.tweetId)
          }
        } catch (e) {
          console.error('Failed to load documents:', e)
        }
      }
    }

    const formattedDisplayName = computed(() => {
      return document.value?.displayName.replace(/<br>/gi, '\n') || ''
    })

    const highlightedContent = computed(() => {
      if (!tweet.value) return ''
      return highlightText(tweet.value.content, tweet.value.links)
    })

    const highlightedQuestion = computed(() => {
      if (!qaItem.value) return ''
      return highlightText(qaItem.value.question, qaItem.value.links)
    })

    const revisionHistory = computed(() => {
      if (!tweet.value?.revision) return null
      return tweet.value.revision.map(revPath => {
        const [docId, revisionId] = revPath.split('/')
        const doc = documents.value[docId]
        if (doc?.revisions) {
          return doc.revisions.find(rev => rev.id === revisionId)
        }
        return null
      }).filter(rev => rev !== null)
    })

    const highlightText = (text, links) => {
      if (!links || !text) return text
      let result = text
      links.forEach(link => {
        const escapedLinkText = link.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`(${escapedLinkText})`, 'gi')
        result = result.replace(regex, '<span class="highlight">$1</span>')
      })
      return result
    }

    const getRevisionArticles = (revision) => {
      if (!tweet.value?.revision) return []
      const revPath = tweet.value.revision.find(path => path.includes(revision.id))
      if (!revPath) return []
      const articleId = revPath.split('/').pop()
      return revision.articles.filter(article => article.id === articleId)
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    const getArticlePreview = (article) => {
      const content = article.after || article.before
      return content.length > 50 ? content.substring(0, 50) + '...' : content
    }

    const addRevisionLink = () => {
      showRevisionSelector.value = true
      selectedRevisionArticles.value = []
    }

    const saveRevisionLinks = () => {
      const updatedDocuments = { ...documents.value }
      const updatedTweet = { ...tweet.value }
      
      if (!updatedTweet.revision) {
        updatedTweet.revision = []
      }

      selectedRevisionArticles.value.forEach(({ docId, revisionId, articleId }) => {
        const revisionPath = `${docId}/${revisionId}/${articleId}`
        if (!updatedTweet.revision.includes(revisionPath)) {
          updatedTweet.revision.push(revisionPath)
        }
      })

      const tweetIndex = updatedDocuments[route.params.documentId].tweets
        .findIndex(t => t.id === tweet.value.id)
      
      updatedDocuments[route.params.documentId].tweets[tweetIndex] = updatedTweet

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDocuments))
        documents.value = updatedDocuments
        tweet.value = updatedTweet
        showRevisionSelector.value = false
      } catch (e) {
        console.error('Failed to save revision links:', e)
        alert('改訂履歴の追加に失敗しました')
      }
    }

    const removeRevisionLink = (revisionId) => {
      if (confirm('この改訂履歴のリンクを削除してもよろしいですか？')) {
        const updatedDocuments = { ...documents.value }
        const updatedTweet = { ...tweet.value }
        
        updatedTweet.revision = updatedTweet.revision.filter(path => !path.includes(revisionId))
        
        const tweetIndex = updatedDocuments[route.params.documentId].tweets
          .findIndex(t => t.id === tweet.value.id)
        
        updatedDocuments[route.params.documentId].tweets[tweetIndex] = updatedTweet

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDocuments))
          documents.value = updatedDocuments
          tweet.value = updatedTweet
        } catch (e) {
          console.error('Failed to remove revision link:', e)
          alert('改訂履歴の削除に失敗しました')
        }
      }
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

    const copyUrl = () => {
      const url = window.location.href
      navigator.clipboard.writeText(url).then(() => {
        alert('URLがコピーされました')
      }, (err) => {
        console.error('URLのコピーに失敗しました', err)
      })
    }

    const goBack = () => {
      if (window.history.length > 2) {
        router.go(-1)
      } else {
        router.push(`/document/${route.params.documentId}`)
      }
    }

    loadData()

    return {
      document,
      documents,
      tweet,
      qaItem,
      formattedDisplayName,
      highlightedContent,
      highlightedQuestion,
      revisionHistory,
      showRevisionSelector,
      selectedRevisionArticles,
      formatDate,
      getArticlePreview,
      getRevisionArticles,
      addRevisionLink,
      saveRevisionLinks,
      removeRevisionLink,
      highlightChanges,
      copyUrl,
      goBack
    }
  }
}
</script>

<style scoped>
/* 既存のスタイルはそのまま保持 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5em;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #657786;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e1e8ed;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background-color: white;
  position: sticky;
  bottom: 0;
}

.revision-document {
  margin-bottom: 30px;
}

.revision-document h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #14171a;
}

.revision-option {
  background: #f8f9fa;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
}

.revision-option-header {
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.revision-option-header h4 {
  margin: 0;
  font-size: 16px;
  color: #14171a;
}

.revision-date {
  font-size: 14px;
  color: #657786;
}

.article-options {
  padding: 12px 16px;
}

.article-option {
  margin-bottom: 8px;
}

.article-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
}

.article-preview {
  font-size: 14px;
  color: #14171a;
  line-height: 1.4;
}

.no-revisions {
  padding: 20px;
  text-align: center;
  color: #657786;
  font-style: italic;
  background: #f8f9fa;
  border-radius: 8px;
}

.save-button,
.cancel-button {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-button {
  background-color: #1da1f2;
  color: white;
  border: none;
}

.save-button:hover:not(:disabled) {
  background-color: #1991db;
}

.save-button:disabled {
  background-color: #a5d0f5;
  cursor: not-allowed;
}

.cancel-button {
  background-color: white;
  color: #1da1f2;
  border: 1px solid #1da1f2;
}

.cancel-button:hover {
  background-color: rgba(29, 161, 242, 0.1);
}

.add-revision-btn {
  background-color: #e8f5fd;
  color: #1da1f2;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  margin-left: 8px;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: background-color 0.2s ease;
}

.add-revision-btn:hover {
  background-color: #d8effd;
}

.remove-revision-link {
  background: none;
  border: none;
  color: #e0245e;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.remove-revision-link:hover {
  background-color: rgba(224, 36, 94, 0.1);
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    height: 95vh;
    border-radius: 0;
  }

  .modal-body {
    padding: 16px;
  }

  .modal-footer {
    padding: 16px;
    flex-direction: column-reverse;
  }

  .save-button,
  .cancel-button {
    width: 100%;
  }

  .revision-option-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>