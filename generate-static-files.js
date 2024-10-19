const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const documentsData = JSON.parse(fs.readFileSync('documents.json', 'utf8'));

// Ensure the public directory exists
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

// Copy CSS file
fs.copyFileSync('public/styles/main.css', 'public/main.css');

// Generate index.html
const indexTemplate = fs.readFileSync('views/index.ejs', 'utf8');
const indexHtml = ejs.render(indexTemplate, { documents: documentsData });
fs.writeFileSync('public/index.html', indexHtml);

// Generate document pages
for (const [id, document] of Object.entries(documentsData)) {
  const documentTemplate = fs.readFileSync('views/document.ejs', 'utf8');
  const documentHtml = ejs.render(documentTemplate, { document });
  const documentDir = path.join('public', 'document', id);
  if (!fs.existsSync(documentDir)) {
    fs.mkdirSync(documentDir, { recursive: true });
  }
  fs.writeFileSync(path.join(documentDir, 'index.html'), documentHtml);

  // Generate tweet pages
  for (const tweet of document.tweets) {
    const tweetTemplate = fs.readFileSync('views/tweet.ejs', 'utf8');
    const tweetHtml = ejs.render(tweetTemplate, { document, tweet, currentUrl: `/document/${id}/${tweet.id}`, backUrl: `/document/${id}` });
    fs.writeFileSync(path.join(documentDir, `${tweet.id}.html`), tweetHtml);
  }
}

console.log('Static files generated successfully!');