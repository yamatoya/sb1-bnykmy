import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import Index from './components/Index.vue'
import Document from './components/Document.vue'
import Tweet from './components/Tweet.vue'
import Revision from './components/Revision.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Index },
    { path: '/document/:id', component: Document },
    { path: '/document/:documentId/:tweetId', component: Tweet, name: 'tweet' },
    { path: '/document/:id/revisions', component: Revision, name: 'revision' }
  ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')

// グローバルにルーターを公開
window.$router = router

// 404.htmlからのリダイレクトを処理
const redirect = sessionStorage.getItem('redirect');
if (redirect) {
  sessionStorage.removeItem('redirect');
  router.push(redirect);
}