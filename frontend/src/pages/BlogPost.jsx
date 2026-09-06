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
        <meta property="og:title" content={blog.seoTitle || blog.title} />
        <meta property="og:description" content={blog.seoDescription || blog.excerpt} />
        <meta property="og:url" content={canonicalUrl} />
        
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": "${(blog.seoTitle || blog.title).replace(/"/g, '\\"')}",
              "description": "${(blog.seoDescription || blog.excerpt || '').replace(/"/g, '\\"')}",
              "author": {
                "@type": "Person",
                "name": "${blog.author?.firstName} ${blog.author?.lastName}"
              },
              "datePublished": "${blog.publishedAt || blog.createdAt}"
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
