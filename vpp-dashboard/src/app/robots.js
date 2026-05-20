export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/profile',
    },
    sitemap: 'https://deepdispatch12.vercel.app/sitemap.xml',
  }
}