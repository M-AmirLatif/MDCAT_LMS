import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import toast from 'react-hot-toast'
import API from '../services/api'
import './Blog.css'

export default function AdminBlog() {
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState(null)
  
  const [formData, setFormData] = useState({
    title: '', slug: '', excerpt: '', content: '',
    seoTitle: '', seoDescription: '', isPublished: false
  })

  const { data: blogs, isLoading } = useQuery({
    queryKey: ['admin-blogs'],
    queryFn: () => API.get('/blog').then(res => res.data)
  })

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingId) return API.put(`/blog/${editingId}`, data)
      return API.post('/blog', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] })
      toast.success('Blog saved successfully!')
      handleCancel()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save blog')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => API.delete(`/blog/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] })
      toast.success('Blog deleted')
    }
  })

  const handleEdit = (blog) => {
    setEditingId(blog.id)
    setFormData({
      title: blog.title, slug: blog.slug, excerpt: blog.excerpt || '',
      content: blog.content, seoTitle: blog.seoTitle || '',
      seoDescription: blog.seoDescription || '', isPublished: blog.isPublished
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({ title: '', slug: '', excerpt: '', content: '', seoTitle: '', seoDescription: '', isPublished: false })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    saveMutation.mutate(formData)
  }

  if (isLoading) return <div className="route-loading">Loading Admin...</div>

  return (
    <div className="platform-page">
      <Helmet><title>Admin Blog - MDCAT LMS</title></Helmet>
      
      <div className="platform-header">
        <h1 className="platform-title">Blog Management</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        <div className="blog-admin-card">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Write Post</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div>
              <label className="blog-admin-label">Post Title</label>
              <input placeholder="Enter title..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className="blog-admin-input" />
            </div>

            <div>
              <label className="blog-admin-label">URL Slug</label>
              <input placeholder="e.g. top-50-biology-mcqs" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} required className="blog-admin-input" />
            </div>

            <div>
              <label className="blog-admin-label">SEO Meta Description / Excerpt</label>
              <textarea placeholder="Short summary for Google..." value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value, seoDescription: e.target.value})} rows="3" className="blog-admin-input" />
            </div>
            
            <div>
              <label className="blog-admin-label">Markdown Content</label>
              <textarea placeholder="Write your article here..." value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required rows="12" className="blog-admin-input" style={{ fontFamily: 'monospace' }} />
            </div>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: '1.25rem', height: '1.25rem' }} checked={formData.isPublished} onChange={e => setFormData({...formData, isPublished: e.target.checked})} />
              <span className="blog-admin-label" style={{ margin: 0 }}>Publish immediately?</span>
            </label>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="blog-admin-btn blog-admin-btn-primary" disabled={saveMutation.isPending} style={{ flex: 1 }}>
                {saveMutation.isPending ? 'Saving...' : (editingId ? 'Update Post' : 'Create Post')}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel} className="blog-admin-btn blog-admin-btn-ghost" style={{ flex: 1 }}>Cancel</button>
              )}
            </div>
          </form>
        </div>

        <div className="blog-admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Live Preview</h2>
          <div className="blog-content" style={{ flex: 1, padding: '2rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-main)', color: 'var(--text-main)', overflowY: 'auto', maxHeight: '800px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
            <h1 style={{ color: 'var(--text-dark)', marginBottom: '2rem' }}>{formData.title || 'Post Title Preview'}</h1>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{formData.content || '*Content will appear here...*'}</ReactMarkdown>
          </div>
        </div>
      </div>

      <div className="blog-admin-card" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>All Posts</h2>
        <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <table className="platform-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Title</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs?.data?.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No posts found.</td>
                </tr>
              )}
              {blogs?.data?.map(blog => (
                <tr key={blog.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: 500 }}>{blog.title}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: blog.isPublished ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)', color: blog.isPublished ? '#22c55e' : '#eab308' }}>
                      {blog.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '1rem' }}>
                    <button onClick={() => handleEdit(blog)} style={{ color: 'var(--primary-color)', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>Edit</button>
                    <button onClick={() => { if(window.confirm('Delete this post forever?')) deleteMutation.mutate(blog.id) }} style={{ color: '#ef4444', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
