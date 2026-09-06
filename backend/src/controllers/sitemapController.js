const Blog = require('../models/Blog')

exports.generateSitemap = async (req, res) => {
  try {
    const baseUrl = 'https://www.acemdcat.com'
    
    // Static routes merged from old sitemap.xml
    const staticRoutes = [
      { path: '/', priority: '1.0', freq: 'daily' },
      { path: '/start-free-mdcat-2026', priority: '0.9', freq: 'weekly' },
      { path: '/free-mdcat-preparation', priority: '0.9', freq: 'weekly' },
      { path: '/mdcat-tips', priority: '0.9', freq: 'daily' },
      { path: '/mdcat-biology-mcqs', priority: '0.8', freq: 'weekly' },
      { path: '/mdcat-chemistry-mcqs', priority: '0.8', freq: 'weekly' },
      { path: '/mdcat-physics-mcqs', priority: '0.8', freq: 'weekly' },
      { path: '/mdcat-english-mcqs', priority: '0.8', freq: 'weekly' },
      { path: '/about', priority: '0.5', freq: 'monthly' },
      { path: '/contact', priority: '0.5', freq: 'monthly' },
      { path: '/privacy-policy', priority: '0.3', freq: 'monthly' },
      { path: '/terms', priority: '0.3', freq: 'monthly' },
      { path: '/login', priority: '0.3', freq: 'monthly' },
      { path: '/register', priority: '0.3', freq: 'monthly' },
    ]

    // Fetch dynamic blog posts
    const blogs = await Blog.find({ isPublished: true }).select('slug updatedAt publishedAt')

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    // Add static routes
    staticRoutes.forEach(route => {
      xml += '  <url>\n'
      xml += `    <loc>${baseUrl}${route.path}</loc>\n`
      xml += `    <changefreq>${route.freq}</changefreq>\n`
      xml += `    <priority>${route.priority}</priority>\n`
      xml += '  </url>\n'
    })

    // Add dynamic blog routes
    blogs.forEach(blog => {
      xml += '  <url>\n'
      xml += `    <loc>${baseUrl}/mdcat-tips/${blog.slug}</loc>\n`
      const date = blog.updatedAt || blog.publishedAt || new Date()
      xml += `    <lastmod>${new Date(date).toISOString().split('T')[0]}</lastmod>\n`
      xml += '    <changefreq>weekly</changefreq>\n'
      xml += '    <priority>0.9</priority>\n'
      xml += '  </url>\n'
    })

    xml += '</urlset>'

    res.header('Content-Type', 'application/xml')
    res.send(xml)
  } catch (error) {
    console.error('Sitemap generation error:', error)
    res.status(500).send('Error generating sitemap')
  }
}
