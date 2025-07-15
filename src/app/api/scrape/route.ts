import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const url = 'https://pcgamer.com/news';
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // Parse the HTML on the server side to extract actual content
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : 'No title found';
    
    // Extract all article tags and their content
    const articleRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi;
    const articles = [];
    let articleMatch;
    
    while ((articleMatch = articleRegex.exec(html)) !== null) {
      const articleHtml = articleMatch[1];
      
      // Find figure tag with data-original attribute
      const figureMatch = articleHtml.match(/<figure[^>]*>[\s\S]*?data-original="([^"]*)"[\s\S]*?<\/figure>/i);
      const imageUrl = figureMatch ? figureMatch[1] : '';
      
      // Find article-name class
      const articleNameMatch = articleHtml.match(/<h3[^>]*class="article-name"[^>]*>([^<]+)<\/h3>/i);
      const articleTitle = articleNameMatch ? articleNameMatch[1].trim() : '';
      
      if (articleTitle && imageUrl) {
        // Find the href by looking for the a tag that contains this article
        // Search backwards from the article position to find the most recent a tag
        const articleStart = articleMatch.index;
        const beforeArticle = html.substring(0, articleStart);
        const aTags = beforeArticle.match(/<a[^>]*href="([^"]*)"[^>]*>/g);
        const articleUrl = aTags && aTags.length > 0 ? 
          (aTags[aTags.length - 1].match(/href="([^"]*)"/) || [])[1] || '' : '';
        
        if (articleUrl) {
          articles.push({
            title: articleTitle,
            image: imageUrl,
            url: articleUrl
          });
        }
      }
    }

    // Render the complete HTML on the server side
    const renderedHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gaming News Feed</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
            background-color: #004D4D;
            color: #E0E0E0;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
        }
        .status {
            text-align: center;
            margin-bottom: 20px;
            font-size: 16px;
        }
        .news-section {
            background-color: rgba(0,0,0,0.3);
            padding: 20px;
            border-radius: 10px;
        }
        .news-section h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #40E0D0;
        }
        .page-title {
            font-size: 18px;
            margin-bottom: 15px;
            color: #40E0D0;
        }
        .articles-list {
            list-style: none;
            padding: 0;
        }
        .articles-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .article-item {
            background-color: rgba(0,0,0,0.2);
            border-radius: 8px;
            overflow: hidden;
            transition: transform 0.2s;
            cursor: pointer;
        }
        .article-item:hover {
            transform: translateY(-2px);
        }
        .article-image {
            width: 100%;
            height: 140px;
            object-fit: cover;
            display: block;
        }
        .article-title {
            padding: 15px;
            font-size: 14px;
            line-height: 1.4;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Gaming News Feed</h1>
        </div>
        
        <div class="status">
            Successfully scraped ${html.length} characters from ${url}
        </div>
        
        <div class="news-section">
            <h2>Latest News from PC Gamer</h2>
            <div class="page-title">Page Title: ${title}</div>
            <h4 style="font-size: 16px; margin-bottom: 20px; color: #40E0D0;">Recent Articles:</h4>
            <div class="articles-list">
                ${articles.map(article => `
                    <a href="${article.url}" target="_blank" class="article-item" style="text-decoration: none; color: inherit;">
                        <img src="${article.image}" alt="${article.title}" class="article-image" onerror="this.style.display='none'">
                        <div class="article-title">${article.title}</div>
                    </a>
                `).join('')}
            </div>
        </div>
    </div>
</body>
</html>`;

    return new NextResponse(renderedHTML, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Scraping error:', error);
    
    const errorHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gaming News Feed - Error</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
            background-color: #004D4D;
            color: #E0E0E0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .error-container {
            text-align: center;
        }
        .error-container h1 {
            font-size: 32px;
            margin-bottom: 20px;
        }
        .error-message {
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>Gaming News Feed</h1>
        <div class="error-message">
            Failed to scrape data: ${error instanceof Error ? error.message : 'Unknown error occurred'}
        </div>
    </div>
</body>
</html>`;

    return new NextResponse(errorHTML, {
      status: 500,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
} 