<template>
  <div class="editor-page">
    <header class="page-header">
      <router-link to="/" class="back-link">
        <i class="fas fa-arrow-left"></i>
        <span>戻る</span>
      </router-link>
      <h1>{{ isEditing ? 'パブリックコメントの編集' : 'パブリックコメントの追加' }}</h1>
    </header>

    <main class="page-content">
      <form @submit.prevent="savePublicComment" class="editor-form">
        <div class="form-group">
          <label>文書名</label>
          <div class="input-group">
            <input 
              type="text" 
              v-model="displayName" 
              class="form-control" 
              placeholder="例: 暗号資産関連法令に関するパブリックコメント"
              required
            />
            <button type="button" class="format-button" @click="formatText('displayName')">
              <i class="fas fa-magic"></i>
              フォーマット
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>原文URL</label>
          <input 
            type="url" 
            v-model="url" 
            class="form-control" 
            placeholder="https://..."
          />
        </div>

        <div class="questions-section">
          <div class="section-header">
            <h2>質問と回答</h2>
            <button type="button" class="add-button" @click="addQuestion">
              <i class="fas fa-plus"></i>
              質問を追加
            </button>
          </div>

          <div v-if="questions.length === 0" class="no-items">
            質問が追加されていません
          </div>

          <div v-else v-for="(question, index) in questions" :key="question.id" class="question-item">
            <div class="question-header">
              <h3>質問 {{ index + 1 }}</h3>
              <button type="button" class="remove-button" @click="removeQuestion(index)">
                <i class="fas fa-trash"></i>
              </button>
            </div>

            <div class="question-content">
              <div class="form-group">
                <label>質問内容</label>
                <div class="input-group">
                  <textarea 
                    v-model="question.question" 
                    class="form-control" 
                    rows="4"
                    required
                  ></textarea>
                  <button type="button" class="format-button" @click="formatQuestionText(index, 'question')">
                    <i class="fas fa-magic"></i>
                    フォーマット
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>回答内容</label>
                <div class="input-group">
                  <textarea 
                    v-model="question.answer" 
                    class="form-control" 
                    rows="4"
                    required
                  ></textarea>
                  <button type="button" class="format-button" @click="formatQuestionText(index, 'answer')">
                    <i class="fas fa-magic"></i>
                    フォーマット
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="pre-action-buttons">
          <button type="button" class="add-question-button" @click="addQuestion">
            <i class="fas fa-plus"></i>
            質問を追加
          </button>
        </div>

        <div class="form-actions">
          <router-link to="/" class="cancel-button">キャンセル</router-link>
          <button type="submit" class="save-button" :disabled="!isValid">保存</button>
        </div>
      </form>
    </main>

    <ScrollToTop />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'
import ScrollToTop from './ScrollToTop.vue'

const STORAGE_KEY = 'legal-documents-data'

export default {
  name: 'PublicCommentEditor',
  components: {
    ScrollToTop
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const displayName = ref('')
    const url = ref('')
    const questions = ref([])
    const documentId = ref('')

    const isEditing = computed(() => route.query.edit)

    const isValid = computed(() => {
      return displayName.value &&
             questions.value.length > 0 &&
             questions.value.every(q => q.question && q.answer)
    })

    const formatText = (field) => {
      if (field === 'displayName') {
        displayName.value = displayName.value.replace(/\n/g, '')
      }
    }

    const formatQuestionText = (index, field) => {
      if (questions.value[index]) {
        questions.value[index][field] = questions.value[index][field].replace(/\n/g, '')
      }
    }

    const addQuestion = () => {
      questions.value.push({
        id: uuidv4(),
        index: questions.value.length + 1,
        question: '',
        answer: ''
      })
    }

    const removeQuestion = (index) => {
      questions.value.splice(index, 1)
      // インデックスを更新
      questions.value.forEach((q, i) => {
        q.index = i + 1
      })
    }

    const loadDocument = () => {
      if (!isEditing.value) return

      const id = route.query.edit
      const storedData = localStorage.getItem(STORAGE_KEY)
      if (storedData) {
        try {
          const documents = JSON.parse(storedData)
          const document = documents[id]
          if (document && document.public_comment) {
            documentId.value = id
            displayName.value = document.displayName
            url.value = document.url || ''
            questions.value = document.questions.map(q => ({
              ...q,
              id: q.id || uuidv4()
            }))
          }
        } catch (e) {
          console.error('Failed to load document:', e)
        }
      }
    }

    const savePublicComment = () => {
      const id = documentId.value || uuidv4()
      const newDocument = {
        accountId: id,
        displayName: displayName.value,
        url: url.value || null,
        public_comment: true,
        questions: questions.value
      }

      try {
        const storedData = localStorage.getItem(STORAGE_KEY)
        const documents = storedData ? JSON.parse(storedData) : {}
        documents[id] = newDocument
        localStorage.setItem(STORAGE_KEY, JSON.stringify(documents))
        router.push('/')
      } catch (e) {
        console.error('Failed to save public comment:', e)
        alert('パブリックコメントの保存に失敗しました')
      }
    }

    onMounted(() => {
      loadDocument()
    })

    return {
      displayName,
      url,
      questions,
      isValid,
      isEditing,
      formatText,
      formatQuestionText,
      addQuestion,
      removeQuestion,
      savePublicComment
    }
  }
}
</script>

<style scoped>
.editor-page {
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
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.editor-form {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #14171a;
}

.input-group {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  font-size: 16px;
  background-color: #ffffff;
}

.form-control:focus {
  outline: none;
  border-color: #1da1f2;
  box-shadow: 0 0 0 2px rgba(29, 161, 242, 0.1);
}

textarea.form-control {
  resize: vertical;
  min-height: 100px;
}

.format-button {
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #e8f5fd;
  color: #1da1f2;
  border: none;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.format-button:hover {
  background-color: #d8effd;
}

.format-button i {
  font-size: 12px;
}

.questions-section {
  margin-top: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  font-size: 20px;
  color: #14171a;
}

.add-button {
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

.add-button:hover {
  background-color: #1991db;
}

.no-items {
  text-align: center;
  padding: 40px;
  background-color: #f8f9fa;
  border-radius: 8px;
  color: #657786;
  font-style: italic;
}

.question-item {
  background: #f8f9fa;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
}

.question-header {
  padding: 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #e1e8ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.question-header h3 {
  margin: 0;
  font-size: 18px;
  color: #14171a;
}

.remove-button {
  background: none;
  border: none;
  color: #e0245e;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.remove-button:hover {
  background-color: rgba(224, 36, 94, 0.1);
}

.question-content {
  padding: 16px;
}

.pre-action-buttons {
  margin: 32px 0;
  display: flex;
  justify-content: center;
}

.add-question-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background-color: #1da1f2;
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  box-shadow: 0 2px 4px rgba(29, 161, 242, 0.2);
}

.add-question-button:hover {
  background-color: #1991db;
  box-shadow: 0 4px 8px rgba(29, 161, 242, 0.3);
}

.form-actions {
  margin-top: 40px;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

.save-button,
.cancel-button {
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  .page-header {
    padding: 16px;
  }

  .page-content {
    padding: 20px;
  }

  .editor-form {
    padding: 16px;
  }

  .article-header {
    flex-direction: column;
    gap: 12px;
  }

  .article-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 12px;
  }

  .save-button,
  .cancel-button {
    width: 100%;
  }

  .add-question-button {
    width: 100%;
    justify-content: center;
  }
}
</style>