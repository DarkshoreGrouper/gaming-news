'use client';

import { useState, useEffect } from 'react';

interface Article {
  title: string;
  image: string;
  url: string;
}

interface ParsedContent {
  title: string;
  articles: Article[];
}

interface ScrapedData {
  success: boolean;
  url: string;
  contentLength: number;
  parsedContent: ParsedContent;
  error?: string;
}

export default function Home() {
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const scrapeData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use a CORS proxy to bypass CORS restrictions
        const corsProxy = 'https://api.allorigins.win/raw?url=';
        const targetUrl = 'https://pcgamer.com/news';
        const response = await fetch(corsProxy + encodeURIComponent(targetUrl));
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        
        // Parse the HTML to extract content
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : 'No title found';
        
        // Extract all article tags and their content
        const articleRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi;
        const articles: Article[] = [];
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

        setScrapedData({
          success: true,
          url: targetUrl,
          contentLength: html.length,
          parsedContent: {
            title,
            articles
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    scrapeData();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div 
      className="min-h-screen w-full"
      style={{ backgroundColor: '#004D4D', padding: '20px' }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 style={{ color: '#E0E0E0', fontSize: '32px', fontFamily: 'Inter, sans-serif', textAlign: 'center', marginBottom: '30px' }}>
          Gaming News Feed
        </h1>
        
        {loading ? (
          <p style={{ color: '#E0E0E0', fontSize: '16px', textAlign: 'center' }}>
            Loading latest news...
          </p>
        ) : error ? (
          <p style={{ color: '#E0E0E0', fontSize: '16px', textAlign: 'center' }}>
            Failed to fetch data: {error}
          </p>
        ) : scrapedData ? (
          <div>
            <p style={{ color: '#E0E0E0', fontSize: '16px', textAlign: 'center', marginBottom: '20px' }}>
              Successfully scraped {scrapedData.contentLength} characters from {scrapedData.url}
            </p>
            
            {scrapedData.parsedContent && (
              <div style={{ color: '#E0E0E0' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#40E0D0' }}>
                  Latest News from PC Gamer
                </h2>
                
                <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '10px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#40E0D0' }}>
                    Page Title: {scrapedData.parsedContent.title}
                  </h3>
                  
                  <h4 style={{ fontSize: '16px', marginBottom: '20px', color: '#40E0D0' }}>Recent Articles:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {scrapedData.parsedContent.articles.map((article: Article, index: number) => (
                      <a 
                        key={index}
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
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
        ) : null}
      </div>
    </div>
  );
}
