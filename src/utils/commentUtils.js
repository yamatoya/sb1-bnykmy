import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY = 'legal-documents-data'

export function loadTweetComments(listId, tweetPath) {
  const storedData = localStorage.getItem(STORAGE_KEY)
  if (!storedData) return []

  try {
    const data = JSON.parse(storedData)
    const list = data.lists?.find(l => l.id === listId)
    if (!list) return []

    if (!list.tweetComments) list.tweetComments = {}
    return list.tweetComments[tweetPath] || []
  } catch (e) {
    console.error('Failed to load comments:', e)
    return []
  }
}

export async function saveTweetComments(listId, tweetPath, newComments) {
  const storedData = localStorage.getItem(STORAGE_KEY)
  if (!storedData) return false

  try {
    const data = JSON.parse(storedData)
    const listIndex = data.lists.findIndex(l => l.id === listId)
    if (listIndex === -1) return false

    if (!data.lists[listIndex].tweetComments) {
      data.lists[listIndex].tweetComments = {}
    }
    data.lists[listIndex].tweetComments[tweetPath] = newComments
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (e) {
    console.error('Failed to save comments:', e)
    return false
  }
}

export function createComment(content) {
  return {
    id: uuidv4(),
    content,
    date: new Date().toISOString()
  }
}