<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>関連ツイートの追加</h2>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>

      <div class="search-container">
        <div class="search-input-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="ツイートを検索..."
            class="search-input"
          />
          <button 
            v-if="searchQuery" 
            class="clear-button"
            @click="searchQuery = ''"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div v-if="hasSearchResults" class="search-actions">
          <button 
            class="action-button secondary-button"
            @click="selectAllSearchResults"
          >
            <i class="fas fa-check-double"></i>
            検索結果をすべて選択
          </button>
        </div>
      </div>

      <div class="modal-body">
        <div v-for="[docId, doc] in filteredDocumentsEntries" :key="docId">
          <div v-if="docId !== currentDocumentId" class="document-section">
            <div class="document-header">{{ formatDisplayName(doc.displayName) }}</div>
            <div v-if="doc.public_comment">
              <div v-for="question in filteredQuestions(doc.questions)" :key="question.id" class="tweet-item">
                <label class="tweet-checkbox" v-if="question.id !== currentTweetId">
                  <input 
                    type="checkbox" 
                    :value="`${docId}/${question.id}`"
                    v-model="selectedTweets"
                  >
                  <div class="tweet-preview">
                    <div class="tweet-content">
                      <strong>質問 {{ question.index }}:</strong>
                      <div v-html="highlightSearchTerms(question.question)"></div>
                      <strong>回答:</strong>
                      <div v-html="highlightSearchTerms(question.answer)"></div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
            <div v-else>
              <div v-for="tweet in filteredTweets(doc.tweets)" :key="tweet.id" class="tweet-item">
                <label class="tweet-checkbox">
                  <input 
                    type="checkbox" 
                    :value="`${docId}/${tweet.id}`"
                    v-model="selectedTweets"
                  >
                  <div class="tweet-preview">
                    <div class="tweet-content">
                      <strong>{{ tweet.index }}:</strong>
                      <div v-html="highlightSearchTerms(tweet.content)"></div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-button" @click="$emit('close')">キャンセル</button>
        <button class="save-button" @click="save">保存</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { formatDisplayName } from '../utils/formatters'

export default {
  name: 'TweetSelector',
  props: {
    documents: {
      type: Object,
      required: true
    },
    currentDocumentId: {
      type: String,
      required: true
    },
    currentTweetId: {
      type: String,
      required: true
    },
    initialSelections: {
      type: Array,
      default: () => []
    }
  },
  emits: ['save', 'close'],
  setup(props, { emit }) {
    const selectedTweets = ref([...props.initialSelections])
    const searchQuery = ref('')

    const searchTerms = computed(() => {
      return searchQuery.value.toLowerCase().split(' ').filter(term => term.length > 0)
    })

    const matchesSearch = (text) => {
      if (!searchQuery.value) return true
      const lowerText = text.toLowerCase()
      return searchTerms.value.every(term => lowerText.includes(term))
    }

    const filteredDocumentsEntries = computed(() => {
      return Object.entries(props.documents).filter(([docId]) => docId !== props.currentDocumentId)
    })

    const filteredQuestions = (questions) => {
      if (!searchQuery.value) return questions
      return questions.filter(q => 
        matchesSearch(q.question) || matchesSearch(q.answer)
      )
    }

    const filteredTweets = (tweets) => {
      if (!searchQuery.value) return tweets
      return tweets.filter(t => matchesSearch(t.content))
    }

    const getAllSearchResults = () => {
      const results = []
      filteredDocumentsEntries.value.forEach(([docId, doc]) => {
        if (doc.public_comment) {
          filteredQuestions(doc.questions).forEach(q => {
            if (q.id !== props.currentTweetId) {
              results.push(`${docId}/${q.id}`)
            }
          })
        } else {
          filteredTweets(doc.tweets).forEach(t => {
            if (t.id !== props.currentTweetId) {
              results.push(`${docId}/${t.id}`)
            }
          })
        }
      })
      return results
    }

    const hasSearchResults = computed(() => {
      return searchQuery.value && getAllSearchResults().length > 0
    })

    const selectAllSearchResults = () => {
      const results = getAllSearchResults()
      const newSelections = new Set([...selectedTweets.value])
      results.forEach(result => newSelections.add(result))
      selectedTweets.value = Array.from(newSelections)
    }

    const highlightSearchTerms = (text) => {
      if (!searchQuery.value || !text) return text

      let highlightedText = text
      searchTerms.value.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi')
        highlightedText = highlightedText.replace(regex, '<span class="highlight">$1</span>')
      })

      return highlightedText
    }

    const save = () => {
      emit('save', selectedTweets.value)
      emit('close')
    }

    return {
      selectedTweets,
      searchQuery,
      filteredDocumentsEntries,
      filteredQuestions,
      filteredTweets,
      formatDisplayName,
      highlightSearchTerms,
      hasSearchResults,
      selectAllSearchResults,
      save
    }
  }
}
</script>

<style scoped>
@import '../styles/common.css';

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
  display: flex;
  flex-direction: column;
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

.search-container {
  padding: 16px 20px;
  border-bottom: 1px solid #e1e8ed;
  background-color: #ffffff;
  position: sticky;
  top: 64px;
  z-index: 1;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #657786;
}

.search-input {
  width: 100%;
  padding: 8px 36px;
  border: 1px solid #e1e8ed;
  border-radius: 20px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #1da1f2;
  box-shadow: 0 0 0 2px rgba(29, 161, 242, 0.1);
}

.clear-button {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #657786;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.clear-button:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.search-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.document-section {
  margin-bottom: 24px;
}

.document-header {
  margin-bottom: 12px;
  padding: 8px;
  font-weight: bold;
  color: #14171a;
  background: white;
  position: sticky;
  top: 120px;
  z-index: 1;
  border-bottom: 1px solid #e1e8ed;
}

.tweet-item {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  margin-bottom: 12px;
}

.tweet-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  cursor: pointer;
  width: 100%;
}

.tweet-checkbox input {
  margin-top: 4px;
}

.tweet-preview {
  flex-grow: 1;
}

.tweet-content {
  font-size: 14px;
  color: #4b5563;
  white-space: pre-wrap;
}

.tweet-content strong {
  color: #14171a;
  display: block;
  margin-bottom: 4px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e1e8ed;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: white;
  position: sticky;
  bottom: 0;
  z-index: 1;
}

.save-button,
.cancel-button {
  padding: 8px 24px;
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

.save-button:hover {
  background-color: #1991db;
}

.cancel-button {
  background-color: white;
  color: #1da1f2;
  border: 1px solid #1da1f2;
}

.cancel-button:hover {
  background-color: rgba(29, 161, 242, 0.1);
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 95vh;
  }

  .tweet-checkbox {
    padding: 12px;
  }

  .search-container {
    padding: 12px 16px;
  }

  .search-input {
    font-size: 16px;
  }

  .search-actions {
    margin-top: 8px;
  }

  .action-button {
    width: 100%;
  }
}
</style>