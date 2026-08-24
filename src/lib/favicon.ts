export function faviconSrc(pageUrl: string) {
  if (!pageUrl) {
    return '';
  }
  if (import.meta.env.DEV) {
    try {
      const parsed = new URL(pageUrl);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=16`;
      }
    } catch {
      return '';
    }
    return '';
  }
  return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(pageUrl)}&size=16`;
}

export function faviconPageUrl(domain: string, sampleUrl: string) {
  const sample = String(sampleUrl || '');
  if (/^[a-zA-Z][a-zA-Z+\-.]*:/.test(sample)) {
    return sample;
  }
  if (sample.startsWith('/')) {
    return `file://${sample}`;
  }
  if (domain && domain !== 'This computer') {
    return `https://${domain}`;
  }
  return sample;
}
