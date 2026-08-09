import { useEffect } from 'react';

export default function SEO({
  title,
  description,
  canonical,
  noindex = false,
  image = 'https://qyzen.online/og-image.png',
}) {
  useEffect(() => {
    const pageUrl =
      canonical || 'https://qyzen.online/';

    document.title = title;

    function setMeta(selector, attribute, value) {
      let tag = document.querySelector(selector);

      if (!tag) {
        tag = document.createElement('meta');
        document.head.appendChild(tag);
      }

      Object.entries(attribute).forEach(
        ([key, attributeValue]) => {
          tag.setAttribute(key, attributeValue);
        }
      );

      tag.setAttribute('content', value);
    }

    // Description
    setMeta(
      'meta[name="description"]',
      { name: 'description' },
      description
    );

    // Robots
    setMeta(
      'meta[name="robots"]',
      { name: 'robots' },
      noindex
        ? 'noindex, nofollow'
        : 'index, follow'
    );

    // Canonical
    let canonicalTag = document.querySelector(
      'link[rel="canonical"]'
    );

    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }

    canonicalTag.setAttribute('href', pageUrl);

    // Open Graph
    setMeta(
      'meta[property="og:type"]',
      { property: 'og:type' },
      'website'
    );

    setMeta(
      'meta[property="og:site_name"]',
      { property: 'og:site_name' },
      'Qyzen Rooms'
    );

    setMeta(
      'meta[property="og:title"]',
      { property: 'og:title' },
      title
    );

    setMeta(
      'meta[property="og:description"]',
      { property: 'og:description' },
      description
    );

    setMeta(
      'meta[property="og:url"]',
      { property: 'og:url' },
      pageUrl
    );

    setMeta(
      'meta[property="og:image"]',
      { property: 'og:image' },
      image
    );

    // Twitter / X
    setMeta(
      'meta[name="twitter:card"]',
      { name: 'twitter:card' },
      'summary_large_image'
    );

    setMeta(
      'meta[name="twitter:title"]',
      { name: 'twitter:title' },
      title
    );

    setMeta(
      'meta[name="twitter:description"]',
      { name: 'twitter:description' },
      description
    );

    setMeta(
      'meta[name="twitter:image"]',
      { name: 'twitter:image' },
      image
    );

    // Structured Data / JSON-LD
    let jsonLd = document.querySelector(
      'script[data-qz-seo="jsonld"]'
    );

    if (!jsonLd) {
      jsonLd = document.createElement('script');
      jsonLd.type = 'application/ld+json';
      jsonLd.setAttribute(
        'data-qz-seo',
        'jsonld'
      );
      document.head.appendChild(jsonLd);
    }

    jsonLd.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Qyzen Rooms',
      url: 'https://qyzen.online/',
      description:
        'Create or join virtual rooms to chat, make video calls and share your screen with friends.',
      applicationCategory:
        'CommunicationApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    });
  }, [
    title,
    description,
    canonical,
    noindex,
    image,
  ]);

  return null;
}
