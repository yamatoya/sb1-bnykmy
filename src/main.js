import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import Index from './components/Index.vue'
import Document from './components/Document.vue'
import Tweet from './components/Tweet.vue'
import RevisionPage from './components/RevisionPage.vue'
import RevisionDetail from './components/RevisionDetail.vue'
import RevisionEditorPage from './components/RevisionEditorPage.vue'
import PublicCommentEditor from './components/PublicCommentEditor.vue'
import { saveScrollPosition, scrollToTop, restoreScrollPosition } from './utils/scrollManager'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Index },
    { path: '/document/:id', component: Document },
    { path: '/document/:documentId/:tweetId', component: Tweet, name: 'tweet' },
    { path: '/revisions/:documentId', component: RevisionPage, name: 'revisions' },
    { 
      path: '/revisions/:documentId/:revisionId', 
      component: RevisionDetail,
      name: 'revision-detail'
    },
    { 
      path: '/revisions/:documentId/new', 
      component: RevisionEditorPage,
      name: 'revision-editor-new',
      props: true
    },
    { 
      path: '/revisions/:documentId/edit/:revisionId', 
      component: RevisionEditorPage,
      name: 'revision-editor-edit',
      props: true
    },
    {
      path: '/public-comment/new',
      component: PublicCommentEditor,
      name: 'public-comment-new'
    }
  ]
})

// ナビゲーションガードの設定
router.beforeEach((to, from, next) => {
  // 現在のスクロール位置を保存
  saveScrollPosition(from)
  next()
})

router.afterEach((to, from) => {
  // Tweetページに遷移する場合は一番上にスクロール
  if (to.name === 'tweet') {
    scrollToTop()
  } 
  // 戻る場合は保存したスクロール位置に戻る
  else if (to.query.back === from.fullPath) {
    restoreScrollPosition(to)
  }
})

const app = createApp(App)
app.use(router)
app.mount('#app')

window.$router = router