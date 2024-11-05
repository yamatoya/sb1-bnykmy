<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ initialRevision ? '改訂履歴の編集' : '改訂履歴の追加' }}</h2>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>対象文書</label>
          <select v-model="documentId" class="form-control" :disabled="!!initialRevision">
            <option value="">文書を選択してください</option>
            <option v-for="(doc, id) in documents" :key="id" :value="id">
              {{ doc.displayName }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>改訂タイトル</label>
          <input type="text" v-model="title" class="form-control" placeholder="例: 令和5年改正" />
        </div>

        <div class="form-group">
          <label>改訂日</label>
          <input type="date" v-model="date" class="form-control" />
        </div>

        <div class="form-group">
          <label>改訂説明</label>
          <textarea v-model="description" class="form-control" rows="3" placeholder="改訂の概要を入力してください"></textarea>
        </div>

        <div class="form-group">
          <label>改訂ソースURL</label>
          <input type="url" v-model="sourceUrl" class="form-control" placeholder="https://..." />
        </div>

        <div class="articles-section">
          <h3>条文の編集</h3>
          <button class="add-article-button" @click="addArticle">
            <i class="fas fa-plus"></i> 条文を追加
          </button>

          <div v-for="(article, index) in articles" :key="article.id" class="article-item">
            <div class="article-header">
              <h4>条文 {{ index + 1 }}</h4>
              <button class="remove-article-button" @click="removeArticle(index)">
                <i class="fas fa-trash"></i>
              </button>
            </div>

            <div class="article-content">
              <div class="form-group">
                <label>状態</label>
                <select v-model="article.status" class="form-control">
                  <option value="改正">改正</option>
                  <option value="新設">新設</option>
                  <option value="削除">削除</option>
                </select>
              </div>

              <div class="form-group" v-if="article.status !== '新設'">
                <label>改正前</label>
                <textarea v-model="article.before" class="form-control" rows="4"></textarea>
              </div>

              <div class="form-group" v-if="article.status !== '削除'">
                <label>改正後</label>
                <textarea v-model="article.after" class="form-control" rows="4"></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-button" @click="$emit('close')">キャンセル</button>
        <button class="save-button" @click="saveRevision" :disabled="!isValid">保存</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { v4 as uuidv4 } from 'uuid'

export default {
  name: 'RevisionEditor',
  props: {
    documents: {
      type: Object,
      required: true
    },
    initialRevision: {
      type: Object,
      default: null
    },
    selectedDocument: {
      type: String,
      default: ''
    }
  },
  setup(props, { emit }) {
    const documentId = ref(props.selectedDocument)
    const title = ref('')
    const date = ref('')
    const description = ref('')
    const sourceUrl = ref('')
    const articles = ref([])

    onMounted(() => {
      if (props.initialRevision) {
        // 既存の改訂データを読み込む
        documentId.value = props.selectedDocument
        title.value = props.initialRevision.title
        date.value = props.initialRevision.date
        description.value = props.initialRevision.description || ''
        sourceUrl.value = props.initialRevision.sourceUrl || ''
        articles.value = props.initialRevision.articles.map(article => ({
          ...article,
          id: article.id || uuidv4()
        }))
      }
    })

    const isValid = computed(() => {
      return documentId.value &&
             title.value &&
             date.value &&
             articles.value.length > 0 &&
             articles.value.every(article => {
               if (article.status === '新設') return !!article.after
               if (article.status === '削除') return !!article.before
               return article.before && article.after
             })
    })

    const addArticle = () => {
      articles.value.push({
        id: uuidv4(),
        status: '改正',
        before: '',
        after: ''
      })
    }

    const removeArticle = (index) => {
      articles.value.splice(index, 1)
    }

    const saveRevision = () => {
      const revision = {
        id: props.initialRevision?.id || uuidv4(),
        title: title.value,
        date: date.value,
        description: description.value,
        sourceUrl: sourceUrl.value,
        articles: articles.value
      }

      emit('save', revision)
    }

    return {
      documentId,
      title,
      date,
      description,
      sourceUrl,
      articles,
      isValid,
      addArticle,
      removeArticle,
      saveRevision
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
  padding: 8px 12px;
  border: 1px solid #e1e8ed;
  border-radius: 4px;
  font-size: 16px;
}

.form-control:focus {
  outline: none;
  border-color: #1da1f2;
  box-shadow: 0 0 0 2px rgba(29, 161, 242, 0.1);
}

.articles-section {
  margin-top: 30px;
}

.articles-section h3 {
  margin-bottom: 16px;
}

.add-article-button {
  background-color: #1da1f2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 20px;
}

.article-item {
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  margin-bottom: 20px;
  padding: 16px;
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.article-header h4 {
  margin: 0;
}

.remove-article-button {
  background: none;
  border: none;
  color: #e0245e;
  cursor: pointer;
}

.save-button {
  background-color: #1da1f2;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
}

.save-button:disabled {
  background-color: #a5d0f5;
  cursor: not-allowed;
}

.cancel-button {
  background-color: #fff;
  color: #1da1f2;
  border: 1px solid #1da1f2;
  padding: 8px 24px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 95vh;
  }
}
</style>