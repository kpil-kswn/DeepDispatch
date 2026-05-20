export default function sitemap() {
  return [
    {
      url: "https://deepdispatch12.vercel.app",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://deepdispatch12.vercel.app/predict/solar",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: 'https://deepdispatch12.vercel.app/optimize',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://deepdispatch12.vercel.app/predict/wind',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: "https://deepdispatch12.vercel.app/profile",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];
}
