import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import API from '../services/api'
import './Blog.css'

export default function BlogPost() {
  const { slug } = useParams()
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['blog', slug],
    queryFn: () => API.get(`/blog/${slug}`).then(res => res.data),
    retry: false
  })

  if (isLoading) return <div className="route-loading">Loading article...</div>
  
  if (error || !data?.data) {
    return (
      <div className="blog-container">
        <div className="blog-error">
          <h2>Article Not Found</h2>
          <p>The article you are looking for does not exist or has been removed.</p>
          <Link to="/mdcat-tips">← Back to Blog</Link>
        </div>
      </div>
    )
  }

  const blog = data.data
  const canonicalUrl = `https://www.acemdcat.com/mdcat-tips/${blog.slug}`

  return (
    <main className="blog-container blog-post">
      <Helmet>
        <title>{blog.seoTitle || blog.title}</title>
        <meta name="description" content={blog.seoDescription || blog.excerpt} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph / WhatsApp / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={blog.seoTitle || blog.title} />
        <meta property="og:description" content={blog.seoDescription || blog.excerpt} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="MDCAT LMS" />
        {/* Default image if no blog specific image exists */}
        <meta property="og:image" content="https://www.acemdcat.com/mdcat-lms-home-july-2026.png" />
        
        {/* Twitter / X */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blog.seoTitle || blog.title} />
        <meta name="twitter:description" content={blog.seoDescription || blog.excerpt} />
        <meta name="twitter:image" content="https://www.acemdcat.com/mdcat-lms-home-july-2026.png" />

        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": "${(blog.seoTitle || blog.title).replace(/"/g, '\\"')}",
              "description": "${(blog.seoDescription || blog.excerpt || '').replace(/"/g, '\\"')}",
              "datePublished": "${blog.publishedAt}",
              "dateModified": "${blog.updatedAt || blog.publishedAt}",
              "author": {
                "@type": "Person",
                "name": "${blog.author?.firstName || 'MDCAT'} ${blog.author?.lastName || 'Expert'}"
              },
              "publisher": {
                "@type": "Organization",
                "name": "MDCAT LMS",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://www.acemdcat.com/favicon.svg"
                }
              },
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": "${canonicalUrl}"
              }
            }
          `}
        </script>
      </Helmet>

      <Link to="/mdcat-tips" className="blog-back">← Back to all tips</Link>
      
      <article>
        <header className="blog-post-header">
          <h1>{blog.title}</h1>
          <div className="blog-meta">
            <span>By {blog.author?.firstName} {blog.author?.lastName}</span>
            <span> • {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}</span>
          </div>
        </header>
        <div className="blog-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {blog.content}
          </ReactMarkdown>
        </div>
      </article>
    </main>
  )
}
