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
        <div v-if="searchQuery" class="search-actions">
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
        <div class="documents-list">
          <div v-for="[docId, doc] in filteredDocumentsEntries" :key="docId" class="document-section">
            <div class="document-header">{{ formatDisplayName(doc.displayName) }}</div>
            <div class="tweets-container">
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
      </div>

      <div class="modal-footer">
        <button class="action-button secondary-button" @click="$emit('close')">キャンセル</button>
        <button class="action-button primary-button" @click="save">保存</button>
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
  border-radius: 12px;
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
  z-index: 3;
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
  top: 69px;
  z-index: 2;
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

.search-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
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

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.documents-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.document-section {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
}

.document-header {
  padding: 12px 16px;
  font-weight: bold;
  color: #14171a;
  background: white;
  border-bottom: 1px solid #e1e8ed;
  position: sticky;
  z-index: 1;
}

.tweets-container {
  position: relative;
  padding-top: 1px;
  margin-top: -1px;
  background: white;
}

.tweet-item {
  position: relative;
  border-bottom: 1px solid #e1e8ed;
  background: white;
}

.tweet-item:last-child {
  border-bottom: none;
}

.tweet-checkbox {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  background: white;
}

.tweet-checkbox:hover {
  background-color: #f8f9fa;
}

.tweet-checkbox input {
  margin-top: 4px;
}

.tweet-preview {
  flex-grow: 1;
  min-width: 0;
}

.tweet-content {
  font-size: 14px;
  color: #4b5563;
  white-space: pre-wrap;
  word-break: break-word;
}

.tweet-content strong {
  display: block;
  margin-bottom: 4px;
  color: #14171a;
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
  z-index: 2;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    height: 95vh;
    max-height: 95vh;
    border-radius: 8px;
  }

  .modal-header {
    padding: 16px;
  }

  .search-container {
    padding: 12px 16px;
    top: 61px;
  }

  .document-header {
    top: 135px;
  }

  .search-input {
    font-size: 16px;
  }

  .modal-body {
    padding: 16px;
  }

  .tweet-checkbox {
    padding: 12px;
  }

  .modal-footer {
    padding: 16px;
  }

  .action-button {
    padding: 8px 12px;
    font-size: 14px;
  }
}
</style>