<template>
  <div class="draggable-tweets">
    <div
      v-for="(tweetPath, index) in modelValue"
      :key="tweetPath"
      class="tweet-item"
      :class="{ 'is-dragging': draggedIndex === index }"
      draggable="true"
      @dragstart="startDrag($event, index)"
      @dragend="endDrag"
      @dragover.prevent
      @dragenter.prevent="onDragEnter(index)"
    >
      <div class="tweet-preview">
        <div class="tweet-header">
          <div class="tweet-info">
            <span class="document-name">{{ getDocumentName(tweetPath) }}</span>
            <span class="tweet-index">{{ getTweetIndex(tweetPath) }}</span>
          </div>
          <button type="button" class="remove-button" @click="$emit('remove', tweetPath)">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="tweet-content">
          {{ getTweetContent(tweetPath) }}
        </div>
      </div>
      <div class="drag-handle">
        <i class="fas fa-grip-vertical"></i>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { formatDisplayName } from '../utils/formatters'

export default {
  name: 'DraggableTweetList',
  props: {
    modelValue: {
      type: Array,
      required: true
    },
    documents: {
      type: Object,
      required: true
    }
  },
  emits: ['update:modelValue', 'remove'],
  setup(props, { emit }) {
    const draggedIndex = ref(null)
    
    const getDocumentName = (tweetPath) => {
      const [documentId] = tweetPath.split('/')
      return formatDisplayName(props.documents[documentId]?.displayName)
    }

    const getTweetIndex = (tweetPath) => {
      const [documentId, tweetId] = tweetPath.split('/')
      const doc = props.documents[documentId]
      if (!doc) return ''

      if (doc.public_comment) {
        const question = doc.questions.find(q => q.id === tweetId)
        return question ? `質問 ${question.index}` : ''
      }
      const tweet = doc.tweets.find(t => t.id === tweetId)
      return tweet ? tweet.index : ''
    }

    const getTweetContent = (tweetPath) => {
      const [documentId, tweetId] = tweetPath.split('/')
      const doc = props.documents[documentId]
      if (!doc) return ''

      if (doc.public_comment) {
        const question = doc.questions.find(q => q.id === tweetId)
        return question ? `${question.question}\n${question.answer}` : ''
      }
      const tweet = doc.tweets.find(t => t.id === tweetId)
      return tweet ? tweet.content : ''
    }

    const startDrag = (event, index) => {
      draggedIndex.value = index
      event.dataTransfer.effectAllowed = 'move'
    }

    const endDrag = () => {
      draggedIndex.value = null
    }

    const onDragEnter = (index) => {
      if (draggedIndex.value === null || draggedIndex.value === index) return

      const newOrder = [...props.modelValue]
      const [movedItem] = newOrder.splice(draggedIndex.value, 1)
      newOrder.splice(index, 0, movedItem)
      draggedIndex.value = index
      emit('update:modelValue', newOrder)
    }

    return {
      draggedIndex,
      getDocumentName,
      getTweetIndex,
      getTweetContent,
      startDrag,
      endDrag,
      onDragEnter
    }
  }
}
</script>

<style scoped>
.draggable-tweets {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tweet-item {
  display: flex;
  align-items: stretch;
  background: #f8f9fa;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tweet-item.is-dragging {
  opacity: 0.5;
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tweet-preview {
  flex: 1;
  padding: 16px;
  min-width: 0;
}

.tweet-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.tweet-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.document-name {
  font-weight: bold;
  color: #14171a;
}

.tweet-index {
  font-size: 12px;
  color: #657786;
}

.tweet-content {
  font-size: 14px;
  color: #4b5563;
  white-space: pre-wrap;
  word-break: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.remove-button {
  background: none;
  border: none;
  color: #e0245e;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.remove-button:hover {
  background-color: rgba(224, 36, 94, 0.1);
}

.drag-handle {
  display: flex;
  align-items: center;
  padding: 0 12px;
  color: #657786;
  cursor: grab;
  border-left: 1px solid #e1e8ed;
}

.drag-handle:active {
  cursor: grabbing;
}

@media (max-width: 768px) {
  .tweet-item {
    flex-direction: row-reverse;
  }

  .drag-handle {
    border-left: none;
    border-right: 1px solid #e1e8ed;
  }
}
</style>