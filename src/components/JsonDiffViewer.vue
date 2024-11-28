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
                <div class="diff-side bundled" :class="{ 'has-diff': isDifferent(diff.bundled, diff.local) }">
                  <pre v-if="diff.bundled !== null" v-html="highlightValue(diff.bundled, diff.local)"></pre>
                  <div v-else class="no-content">データなし</div>
                </div>
                <div class="diff-side local" :class="{ 'has-diff': isDifferent(diff.local, diff.bundled) }">
                  <pre v-if="diff.local !== null" v-html="highlightValue(diff.local, diff.bundled)"></pre>
                  <div v-else class="no-content">データなし</div>
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
import { diffWords } from 'diff'

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
        this.bundledJson = bundledData
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

        if (!this.areEqual(bundledValue, localValue)) {
          if (typeof bundledValue === 'object' && bundledValue !== null &&
              typeof localValue === 'object' && localValue !== null) {
            differences.push(...this.findDifferences(bundledValue, localValue, currentPath))
          } else {
            differences.push({
              path: currentPath,
              bundled: bundledValue,
              local: localValue
            })
          }
        }
      }

      return differences
    },
    formatValue(value) {
      if (value === undefined) return 'undefined'
      if (value === null) return 'null'
      if (typeof value === 'string') return `"${value}"`
      return JSON.stringify(value, null, 2)
    },
    isDifferent(value1, value2) {
      return !this.areEqual(value1, value2)
    },
    highlightValue(value1, value2) {
      const str1 = this.formatValue(value1)
      const str2 = this.formatValue(value2)
      
      if (typeof value1 !== typeof value2) {
        return `<span class="diff-all">${this.escapeHtml(str1)}</span>`
      }

      if (typeof value1 === 'object' || typeof value2 === 'object') {
        return this.escapeHtml(str1)
      }

      const diff = diffWords(str2, str1)
      return diff.map(part => {
        if (part.added) {
          return `<span class="diff-added">${this.escapeHtml(part.value)}</span>`
        } else if (part.removed) {
          return `<span class="diff-removed">${this.escapeHtml(part.value)}</span>`
        }
        return this.escapeHtml(part.value)
      }).join('')
    },
    escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
    },
    areEqual(a, b) {
      if (a === b) return true
      if (a === null || b === null) return a === b
      if (typeof a !== typeof b) return false
      if (typeof a === 'object') {
        const aKeys = Object.keys(a)
        const bKeys = Object.keys(b)
        if (aKeys.length !== bKeys.length) return false
        return aKeys.every(key => this.areEqual(a[key], b[key]))
      }
      return false
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
  transition: background-color 0.2s ease;
}

.diff-side.has-diff {
  background-color: #fff8f8;
}

.diff-side pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.4;
}

.diff-added {
  background-color: #e6ffed;
  border-radius: 2px;
}

.diff-removed {
  background-color: #ffeef0;
  border-radius: 2px;
}

.diff-all {
  background-color: #fff3cd;
  border-radius: 2px;
}

.no-content {
  color: #657786;
  font-style: italic;
  padding: 10px;
}

.no-diff {
  text-align: center;
  padding: 40px;
  color: #657786;
  font-size: 1.2em;
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

  .diff-side {
    max-height: 300px;
    overflow-y: auto;
  }
}
</style>