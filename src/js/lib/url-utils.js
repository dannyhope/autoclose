export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function parseUrlParts(urlStr) {
  const raw = String(urlStr || '');
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === 'file:') {
      const filePath = decodeURIComponent(parsed.pathname || '');
      return { hostname: 'This computer', displayPath: filePath || raw };
    }
    if (!parsed.hostname) {
      const scheme = parsed.protocol.replace(/:$/, '') || 'page';
      return { hostname: scheme, displayPath: (parsed.pathname + parsed.search) || '/' };
    }
    return {
      hostname: parsed.hostname,
      displayPath: (parsed.pathname + parsed.search) || '/'
    };
  } catch (error) {
    if (raw.startsWith('/')) {
      return { hostname: 'This computer', displayPath: raw };
    }
    const withoutProto = raw.replace(/^https?:\/\//i, '');
    const [hostname, ...rest] = withoutProto.split('/');
    const pathname = rest.length ? `/${rest.join('/')}` : '/';
    return { hostname: hostname || raw, displayPath: pathname };
  }
}

export function matchesUrlPattern(url, pattern) {
  try {
    if (!/^https?:\/\//i.test(pattern)) {
      if (pattern.startsWith('/')) {
        const urlObj = new URL(url);
        return urlObj.pathname + urlObj.search === pattern;
      }
      return url.endsWith(pattern);
    }

    const patternUrl = new URL(pattern);
    const testUrl = new URL(url);

    if (
      patternUrl.protocol !== testUrl.protocol ||
      patternUrl.hostname !== testUrl.hostname ||
      patternUrl.port !== testUrl.port
    ) {
      return false;
    }

    const patternPath = patternUrl.pathname + patternUrl.search;
    const testPath = testUrl.pathname + testUrl.search;

    if (pattern.endsWith('$')) {
      return testPath === patternPath;
    }

    return testPath.startsWith(patternPath);
  } catch (error) {
    console.error('Error matching URL pattern:', error);
    return false;
  }
}

export function normalizeUrlForDupeCheck(url) {
  try {
    const parsed = new URL(String(url || ''));
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.replace(/\/+$/, '');
    const search = parsed.search;
    return hostname + pathname + search;
  } catch (error) {
    return String(url || '')
      .replace(/^https?:\/\//i, '')
      .replace(/\/+$/, '')
      .toLowerCase();
  }
}

export function toPatternFromTabUrl(rawUrl) {
  if (!rawUrl) {
    return '';
  }
  try {
    const parsed = new URL(rawUrl);
    return `${parsed.hostname}${parsed.pathname}${parsed.search}`;
  } catch (error) {
    return rawUrl;
  }
}
