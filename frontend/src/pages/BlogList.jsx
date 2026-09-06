import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import API from '../services/api'
import './Blog.css'

export default function BlogList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['blogs'],
    queryFn: () => API.get('/blog').then(res => res.data)
  })

  return (
    <main className="blog-container">
      <Helmet>
        <title>MDCAT Tips & Resources - MDCAT LMS</title>
        <meta name="description" content="Read the latest tips, tricks, and resources for MDCAT 2026 preparation." />
      </Helmet>
      
      <header className="blog-header">
        <h1>MDCAT Tips & Resources</h1>
        <p>Master your prep with guides written by top scorers.</p>
      </header>

      {isLoading ? (
        <div className="route-loading">Loading articles...</div>
      ) : error ? (
        <div className="blog-error">
          <h2>Coming Soon!</h2>
          <p>We are currently setting up the new blog engine. Check back shortly!</p>
        </div>
      ) : (
        <div className="blog-grid">
          {data?.data?.length === 0 ? (
            <p>No articles published yet.</p>
          ) : (
            data?.data?.map(blog => (
              <article key={blog.id} className="blog-card">
                <h2><Link to={`/mdcat-tips/${blog.slug}`}>{blog.title}</Link></h2>
                <div className="blog-meta">
                  <span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}</span>
                  <span> • {blog.author?.firstName} {blog.author?.lastName}</span>
                </div>
                <p>{blog.excerpt}</p>
                <Link to={`/mdcat-tips/${blog.slug}`} className="blog-read-more">Read More →</Link>
              </article>
            ))
          )}
        </div>
      )}
    </main>
  )
}
