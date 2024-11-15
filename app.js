const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const port = 3000;

app.use(express.static('public'));

// CORS設定
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

let documentsData = JSON.parse(fs.readFileSync('documents.json', 'utf8'));

// デバッグ用のログ
app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  next();
});

// 再帰的にリンクを取得する関数
function getLinksRecursively(documentId, tweetId, visitedLinks = new Set()) {
  const document = documentsData[documentId];
  if (!document) return null;

  const tweet = document.tweets.find(t => t.id === tweetId);
  if (!tweet) return null;

  const linkKey = `${documentId}/${tweetId}`;
  if (visitedLinks.has(linkKey)) return null;

  visitedLinks.add(linkKey);

  const result = {
    ...tweet,
    document: {
      displayName: document.displayName,
      accountId: document.accountId
    }
  };

  if (tweet.links && tweet.links.length > 0) {
    result.links = tweet.links.map(link => {
      const [linkedDocumentId, linkedTweetId] = link.url.split('/');
      const linkedContent = getLinksRecursively(linkedDocumentId, linkedTweetId, new Set(visitedLinks));
      return {
        ...link,
        content: linkedContent
      };
    });
  }

  return result;
}

// API エンドポイント
app.get('/api/documents', (req, res) => {
  res.json(documentsData);
});

app.get('/api/document/:documentId', (req, res) => {
  const documentId = req.params.documentId;
  const document = documentsData[documentId];

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  res.json(document);
});

app.get('/api/document/:documentId/:tweetId', (req, res) => {
  const documentId = req.params.documentId;
  const tweetId = req.params.tweetId;
  const document = documentsData[documentId];

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const tweetWithLinks = getLinksRecursively(documentId, tweetId);

  if (!tweetWithLinks) {
    return res.status(404).json({ error: 'Tweet not found' });
  }

  res.json(tweetWithLinks);
});

// SPA用のフォールバックルート
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});