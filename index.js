const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path'); // لإدارة المسارات

const app = express();
const PORT = 3000;

app.use(cors());

// تقديم الملفات الثابتة
app.use(express.static(path.join(__dirname, 'public')));

// مسارات البحث وتفاصيل الكتب
app.get('/search', async (req, res) => {
  const query = req.query.q;
  const url = `https://www.kotobati.com/search/result?s=${encodeURIComponent(query)}`;

  try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const books = [];

      $('.views-row').each((index, element) => {
          const title = $(element).find('.title a').text().trim();
          const link = $(element).find('.title a').attr('href');
          const author = $(element).find('.author-label a').text().trim();
          
          let imageUrl = $(element).find('div > a > div > img').attr('src');
          if (!imageUrl) {
              imageUrl = $(element).find('div > a > div > img').attr('data-src');
          }

          if (title && link && author) {
              books.push({ 
                  title, 
                  link: `https://www.kotobati.com${link}`, 
                  author,
                  imageUrl: imageUrl ? `https://www.kotobati.com${imageUrl}` : null
              });
          }
      });

      res.json(books);
  } catch (error) {
      res.status(500).json({ error: 'Error fetching data' });
  }
});

app.get('/autocomplete', async (req, res) => {
    const query = req.query.q;
    const url = `https://www.kotobati.com/autocomplete/book?q=${encodeURIComponent(query)}`;
  
    try {
      const { data } = await axios.get(url);
      res.json(data); // الرد بالبيانات كما هي
    } catch (error) {
      res.status(500).json({ error: 'Error fetching autocomplete data' });
    }
  });
  

app.get('/book', async (req, res) => {
    const bookUrl = req.query.url;

    try {
      const { data } = await axios.get(bookUrl);
      const $ = cheerio.load(data);
      
      const details = {
          title: $('.media-body.col-md-10 > h2.img-title').text().trim(),
          author: $('#block-ktobati-content > article > div.article-body > div > div.row.justify-content-center > div > div > div.media.row.uicard > div.media-body.col-md-10 > p:nth-child(2) > a').text().trim(),
          category: $('.media-body.col-md-10 > p.book-p-info:contains("النوعية") > a.link').text().trim(),
          pages: $('.nav.book-table-info.align-items-center > li:contains("الصفحات") > p > span.numero').text().trim(),
          language: $('.nav.book-table-info.align-items-center > li:contains("اللغة") > p').last().text().trim(),
          size: $('.nav.book-table-info.align-items-center > li:contains("الحجم") > p > span.numero').text().trim(),
          fileType: $('.nav.book-table-info.align-items-center > li:contains("نوع الملف") > p').last().text().trim(),
          description: $('#block-ktobati-content > article > div.article-body > div > div.row.justify-content-center > div > div > div.row.detail-box.mb-3.uicard > div > div.tab-content').text().trim(),
          
          imageUrl: $('#block-ktobati-content > article > div.article-body > div > div.row.justify-content-center > div > div > div.media.row.uicard > div.media-left.col-md-4.text-center > div > img').attr('src')
      };

      if (!details.imageUrl) {
          details.imageUrl = $('#block-ktobati-content > article > div.article-body > div > div.row.justify-content-center > div > div > div.media.row.uicard > div.media-left.col-md-4.text-center > div > img').attr('data-src');
      }

      if (details.imageUrl) {
          details.imageUrl = `https://www.kotobati.com${details.imageUrl}`;
      }

      res.json(details);
  } catch (error) {
      res.status(500).json({ error: 'Error fetching book details' });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

app.get('/proxy-image', async (req, res) => {
    const imageUrl = req.query.url;
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      res.set('Content-Type', response.headers['content-type']);
      res.send(response.data);
    } catch (error) {
      res.status(404).send('Image not found');
    }
  });