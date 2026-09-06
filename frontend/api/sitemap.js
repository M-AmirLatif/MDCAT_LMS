export default async function handler(req, res) {
  try {
    const response = await fetch('https://api.acemdcat.com/api/public/sitemap');
    const xml = await response.text();
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate');
    res.status(200).send(xml);
  } catch (error) {
    res.status(500).send('Error fetching sitemap');
  }
}
