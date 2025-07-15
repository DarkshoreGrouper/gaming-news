export default async function Home() {
  // Direct server-side scraping for static export
  let scrapedData = null;
  let error = null;
  let parsedContent = null;
  
  try {
    const response = await fetch('https://pcgamer.com/news', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    scrapedData = {
      success: true,
      url: 'https://pcgamer.com/news',
      contentLength: html.length,
      html: html
    };

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

    parsedContent = {
      title,
      articles
    };

  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error occurred';
    scrapedData = {
      success: false,
      error: error
    };
  }
  
  return (
    <div 
      className="min-h-screen w-full"
      style={{ backgroundColor: '#004D4D', padding: '20px' }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 style={{ color: '#E0E0E0', fontSize: '32px', fontFamily: 'Inter, sans-serif', textAlign: 'center', marginBottom: '30px' }}>
          Gaming News Feed
        </h1>
        
        {scrapedData.success ? (
          <div>
            <p style={{ color: '#E0E0E0', fontSize: '16px', textAlign: 'center', marginBottom: '20px' }}>
              Successfully scraped {scrapedData.contentLength} characters from {scrapedData.url}
            </p>
            
            {parsedContent && (
              <div style={{ color: '#E0E0E0' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#40E0D0' }}>
                  Latest News from PC Gamer
                </h2>
                
                <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '10px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#40E0D0' }}>
                    Page Title: {parsedContent.title}
                  </h3>
                  
                  <h4 style={{ fontSize: '16px', marginBottom: '20px', color: '#40E0D0' }}>Recent Articles:</h4>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '20px' 
                  }}>
                    {parsedContent.articles.map((article, index) => (
                      <a 
                        key={index}
                        href={article.url} 
                        target="_blank" 
                        style={{ 
                          textDecoration: 'none', 
                          color: 'inherit',
                          backgroundColor: 'rgba(0,0,0,0.2)',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          transition: 'transform 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <img 
                          src={article.image} 
                          alt={article.title} 
                          style={{
                            width: '100%',
                            height: '140px',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                          onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                        <div style={{ padding: '15px', fontSize: '14px', lineHeight: '1.4' }}>
                          {article.title}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: '#E0E0E0', fontSize: '16px', textAlign: 'center' }}>
            Failed to scrape data: {scrapedData.error}
          </p>
        )}
      </div>
    </div>
  );
}
