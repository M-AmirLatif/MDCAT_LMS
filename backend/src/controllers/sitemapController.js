const Blog = require('../models/Blog')

exports.generateSitemap = async (req, res) => {
  try {
    const baseUrl = 'https://www.acemdcat.com'
    
    // Static routes
    const staticRoutes = [
      '',
      '/mdcat-tips',
      '/login',
      '/register',
    ]

    // Fetch dynamic blog posts
    const blogs = await Blog.find({ isPublished: true }).select('slug updatedAt publishedAt')

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    // Add static routes
    staticRoutes.forEach(route => {
      xml += '  <url>\n'
      xml += `    <loc>${baseUrl}${route}</loc>\n`
      xml += '    <changefreq>daily</changefreq>\n'
      xml += '    <priority>0.8</priority>\n'
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
