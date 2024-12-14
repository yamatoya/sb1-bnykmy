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
import Lists from './components/Lists.vue'
import ListEditor from './components/ListEditor.vue'
import { saveScrollPosition, scrollToTop, restoreScrollPosition } from './utils/scrollManager'
import './styles/common.css'

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
    },
    {
      path: '/lists',
      component: Lists,
      name: 'lists'
    },
    {
      path: '/lists/new',
      component: ListEditor,
      name: 'list-new'
    },
    {
      path: '/lists/:id/edit',
      component: ListEditor,
      name: 'list-edit'
    }
  ]
})

// ナビゲーションガードの設定
router.beforeEach((to, from, next) => {
  saveScrollPosition(from)
  next()
})

router.afterEach((to, from) => {
  if (to.name === 'tweet') {
    scrollToTop()
  } 
  else if (to.query.back === from.fullPath) {
    restoreScrollPosition(to)
  }
})

const app = createApp(App)
app.use(router)
app.mount('#app')

window.$router = router