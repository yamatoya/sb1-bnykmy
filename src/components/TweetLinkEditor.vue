<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>関連リンクの追加</h2>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>リンクテキスト</label>
          <input 
            type="text" 
            v-model="linkText" 
            class="form-control" 
            placeholder="表示するテキスト"
            required
          />
        </div>

        <div class="form-group">
          <label>リンク先</label>
          <select v-model="selectedDocument" class="form-control">
            <option value="">文書を選択してください</option>
            <option v-for="[docId, doc] in documentsEntries" :key="docId" :value="docId">
              {{ formatDisplayName(doc.displayName) }}
            </option>
          </select>
        </div>

        <div v-if="selectedDocument" class="form-group">
          <label>ツイート</label>
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
          </div>

          <div class="tweets-list">
            <div v-if="selectedDoc?.public_comment">
              <div v-for="question in filteredQuestions" :key="question.id" class="tweet-item">
                <label class="tweet-radio">
                  <input 
                    type="radio" 
                    :value="question.id"
                    v-model="selectedTweet"
                    name="tweet"
                  >
                  <div class="tweet-preview">
                    <div class="tweet-header">
                      <span class="tweet-index">質問 {{ question.index }}</span>
                    </div>
                    <div class="tweet-content">
                      <div class="question" v-html="highlightSearchTerms(question.question)"></div>
                      <div class="answer" v-html="highlightSearchTerms(question.answer)"></div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
            <div v-else>
              <div v-for="tweet in filteredTweets" :key="tweet.id" class="tweet-item">
                <label class="tweet-radio">
                  <input 
                    type="radio" 
                    :value="tweet.id"
                    v-model="selectedTweet"
                    name="tweet"
                  >
                  <div class="tweet-preview">
                    <div class="tweet-header">
                      <span class="tweet-index">{{ tweet.index }}</span>
                    </div>
                    <div class="tweet-content" v-html="highlightSearchTerms(tweet.content)"></div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-button" @click="$emit('close')">キャンセル</button>
        <button class="save-button" @click="save" :disabled="!isValid">保存</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { formatDisplayName } from '../utils/formatters'

export default {
  name: 'TweetLinkEditor',
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
    }
  },
  emits: ['save', 'close'],
  setup(props, { emit }) {
    const linkText = ref('')
    const selectedDocument = ref('')
    const selectedTweet = ref('')
    const searchQuery = ref('')

    const documentsEntries = computed(() => {
      return Object.entries(props.documents).filter(([docId]) => {
        if (docId === props.currentDocumentId) return false
        return true
      })
    })

    const selectedDoc = computed(() => {
      if (!selectedDocument.value) return null
      return props.documents[selectedDocument.value]
    })

    const searchTerms = computed(() => {
      return searchQuery.value.toLowerCase().split(' ').filter(term => term.length > 0)
    })

    const matchesSearch = (text) => {
      if (!searchQuery.value) return true
      const lowerText = text.toLowerCase()
      return searchTerms.value.every(term => lowerText.includes(term))
    }

    const filteredQuestions = computed(() => {
      if (!selectedDoc.value?.questions) return []
      return selectedDoc.value.questions.filter(q => 
        matchesSearch(q.question) || matchesSearch(q.answer)
      )
    })

    const filteredTweets = computed(() => {
      if (!selectedDoc.value?.tweets) return []
      return selectedDoc.value.tweets.filter(t => 
        matchesSearch(t.content)
      )
    })

    const highlightSearchTerms = (text) => {
      if (!searchQuery.value || !text) return text

      let highlightedText = text
      searchTerms.value.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi')
        highlightedText = highlightedText.replace(regex, '<span class="highlight">$1</span>')
      })

      return highlightedText
    }

    const isValid = computed(() => {
      return linkText.value && selectedDocument.value && selectedTweet.value
    })

    const save = () => {
      const link = {
        text: linkText.value,
        url: `${selectedDocument.value}/${selectedTweet.value}`
      }
      emit('save', link)
      emit('close')
    }

    return {
      linkText,
      selectedDocument,
      selectedTweet,
      searchQuery,
      documentsEntries,
      selectedDoc,
      filteredQuestions,
      filteredTweets,
      highlightSearchTerms,
      isValid,
      formatDisplayName,
      save
    }
  }
}
</script>

<style scoped>
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
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #14171a;
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  font-size: 16px;
}

.form-control:focus {
  outline: none;
  border-color: #1da1f2;
  box-shadow: 0 0 0 2px rgba(29, 161, 242, 0.1);
}

.tweets-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
}

.tweet-item {
  border-bottom: 1px solid #e1e8ed;
}

.tweet-item:last-child {
  border-bottom: none;
}

.tweet-radio {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  cursor: pointer;
  width: 100%;
}

.tweet-radio:hover {
  background-color: #f8f9fa;
}

.tweet-preview {
  flex-grow: 1;
}

.tweet-header {
  margin-bottom: 8px;
}

.tweet-index {
  font-weight: bold;
  color: #14171a;
}

.tweet-content {
  font-size: 14px;
  color: #4b5563;
  white-space: pre-wrap;
  word-break: break-word;
}

.question,
.answer {
  margin-bottom: 8px;
}

.answer {
  margin-bottom: 0;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e1e8ed;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    height: 95vh;
    max-height: 95vh;
    border-radius: 8px;
  }

  .form-control {
    font-size: 16px;
  }

  .tweet-radio {
    padding: 12px;
  }
}

.search-container {
  margin-bottom: 12px;
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

.highlight {
  background-color: #fff3cd;
  padding: 2px;
  border-radius: 2px;
}

@media (max-width: 768px) {
  .search-input {
    font-size: 16px;
  }
}
</style>