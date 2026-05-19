export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/profile',
    },
    sitemap: 'https://your-future-domain.com/sitemap.xml',
  }
}