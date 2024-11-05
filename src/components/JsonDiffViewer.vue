<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>JSON差分表示</h2>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <div v-if="hasDifferences" class="diff-container">
          <div class="diff-header">
            <div class="diff-title">バンドル版</div>
            <div class="diff-title">ローカル版</div>
          </div>
          <div class="diff-content">
            <div v-for="(diff, index) in differences" :key="index" class="diff-section">
              <div class="diff-path">{{ diff.path }}</div>
              <div class="diff-comparison">
                <div class="diff-side bundled">
                  <pre v-html="highlightDifferences(diff.bundled, diff.local, 'bundled')"></pre>
                </div>
                <div class="diff-side local">
                  <pre v-html="highlightDifferences(diff.local, diff.bundled, 'local')"></pre>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-diff">
          差分は見つかりませんでした
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import bundledData from '../documents.json'
import { diffLines } from 'diff'

export default {
  name: 'JsonDiffViewer',
  data() {
    return {
      differences: [],
      hasDifferences: false,
      bundledJson: null,
      localJson: null
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    async loadData() {
      try {
        // バンドルされたJSONを読み込む
        this.bundledJson = bundledData

        // LocalStorageからJSONを読み込む
        const localData = localStorage.getItem('legal-documents-data')
        this.localJson = localData ? JSON.parse(localData) : {}

        this.compareDocuments()
      } catch (e) {
        console.error('Failed to load documents:', e)
        this.differences = []
        this.hasDifferences = false
      }
    },
    compareDocuments() {
      if (!this.bundledJson || !this.localJson) {
        this.hasDifferences = false
        return
      }

      try {
        this.differences = this.findDifferences(this.bundledJson, this.localJson)
        this.hasDifferences = this.differences.length > 0
      } catch (e) {
        console.error('Failed to compare documents:', e)
        this.differences = []
        this.hasDifferences = false
      }
    },
    findDifferences(bundled, local, path = '') {
      const differences = []
      const allKeys = new Set([...Object.keys(bundled), ...Object.keys(local)])

      for (const key of allKeys) {
        const currentPath = path ? `${path}.${key}` : key
        const bundledValue = bundled[key]
        const localValue = local[key]

        if (typeof bundledValue === 'object' && bundledValue !== null &&
            typeof localValue === 'object' && localValue !== null) {
          // 再帰的に比較
          const nestedDiffs = this.findDifferences(bundledValue, localValue, currentPath)
          differences.push(...nestedDiffs)
        } else if (!this.areEqual(bundledValue, localValue)) {
          // コンテキスト付きで差分を取得
          differences.push({
            path: currentPath,
            bundled: this.formatValue(bundledValue),
            local: this.formatValue(localValue)
          })
        }
      }

      return differences
    },
    formatValue(value) {
      return JSON.stringify(value, null, 2)
    },
    areEqual(a, b) {
      if (a === b) return true
      if (typeof a !== typeof b) return false
      if (a === null || b === null) return a === b
      if (typeof a === 'object') {
        return JSON.stringify(a) === JSON.stringify(b)
      }
      return a === b
    },
    highlightDifferences(text1, text2, side) {
      if (!text1 || !text2) {
        return this.highlightJson(text1 || '')
      }

      const changes = diffLines(text1, text2)
      let html = ''

      changes.forEach(change => {
        const content = this.highlightJson(change.value)
        if (change.added && side === 'local') {
          html += `<div class="diff-line diff-added">${content}</div>`
        } else if (change.removed && side === 'bundled') {
          html += `<div class="diff-line diff-removed">${content}</div>`
        } else if (!change.added && !change.removed) {
          html += `<div class="diff-line">${content}</div>`
        }
      })

      return html
    },
    highlightJson(json) {
      if (!json) return ''
      return json.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (match) => {
          let cls = 'json-number'
          if (/^"/.test(match)) {
            cls = /:$/.test(match) ? 'json-key' : 'json-string'
          } else if (/true|false/.test(match)) {
            cls = 'json-boolean'
          } else if (/null/.test(match)) {
            cls = 'json-null'
          }
          return `<span class="${cls}">${match}</span>`
        }
      )
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
  width: 95%;
  max-width: 1200px;
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

.diff-container {
  border: 1px solid #e1e8ed;
  border-radius: 8px;
}

.diff-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background-color: #f7f9fa;
  border-bottom: 1px solid #e1e8ed;
  position: sticky;
  top: 69px;
  z-index: 1;
}

.diff-title {
  padding: 12px;
  font-weight: bold;
  text-align: center;
  background: white;
}

.diff-content {
  padding: 20px;
}

.diff-section {
  margin-bottom: 30px;
}

.diff-path {
  font-weight: bold;
  margin-bottom: 10px;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  position: sticky;
  top: 110px;
  z-index: 1;
  background: white;
  border: 1px solid #e1e8ed;
}

.diff-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.diff-side {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  overflow-x: auto;
  font-family: monospace;
}

.diff-side pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.diff-line {
  padding: 2px 4px;
  border-radius: 2px;
}

.diff-added {
  background-color: #e6ffed;
  border-left: 2px solid #28a745;
}

.diff-removed {
  background-color: #ffeef0;
  border-left: 2px solid #d73a49;
}

.no-diff {
  text-align: center;
  padding: 40px;
  color: #657786;
  font-size: 1.2em;
}

:deep(.json-string) {
  color: #22863a;
}

:deep(.json-number) {
  color: #005cc5;
}

:deep(.json-boolean) {
  color: #e36209;
}

:deep(.json-null) {
  color: #d73a49;
}

:deep(.json-key) {
  color: #005cc5;
}

@media (max-width: 768px) {
  .diff-comparison {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .diff-header {
    grid-template-columns: 1fr;
    top: 64px;
  }

  .diff-path {
    top: 105px;
  }

  .modal-content {
    width: 100%;
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
}
</style>