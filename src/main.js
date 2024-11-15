import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import Index from './components/Index.vue'
import Document from './components/Document.vue'
import Tweet from './components/Tweet.vue'
import RevisionPage from './components/RevisionPage.vue'
import RevisionDetail from './components/RevisionDetail.vue'
import RevisionEditorPage from './components/RevisionEditorPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Index },
    { path: '/document/:id', component: Document },
    { path: '/document/:documentId/:tweetId', component: Tweet, name: 'tweet' },
    { 
      path: '/revisions/:documentId', 
      component: RevisionPage,
      name: 'revisions'
    },
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
    }
  ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')

window.$router = router