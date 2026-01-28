/**
 * Escapes HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export interface UrlParts {
  hostname: string
  displayPath: string
}

/**
 * Parses a URL into hostname and display path components
 */
export function parseUrlParts(urlStr: string): UrlParts {
  try {
    const parsed = new URL(urlStr)
    return {
      hostname: parsed.hostname,
      displayPath: parsed.pathname + parsed.search || "/"
    }
  } catch {
    const withoutProto = String(urlStr).replace(/^https?:\/\//, "")
    const [hostname, ...rest] = withoutProto.split("/")
    const pathname = rest.length ? `/${rest.join("/")}` : "/"
    return { hostname: hostname || urlStr, displayPath: pathname }
  }
}

/**
 * Checks if a URL matches a given pattern
 * 
 * Pattern types:
 * - Full URL (https://example.com/path) - matches protocol, host, port, and path prefix
 * - Path only (/path) - matches just the path+query
 * - Suffix (example.com/path) - matches URL ending
 * - Exact match with $ - pattern ending in $ requires exact path match
 */
export function matchesUrlPattern(url: string, pattern: string): boolean {
  try {
    if (!/^https?:\/\//i.test(pattern)) {
      if (pattern.startsWith("/")) {
        const urlObj = new URL(url)
        return urlObj.pathname + urlObj.search === pattern
      }
      return url.endsWith(pattern)
    }

    const patternUrl = new URL(pattern)
    const testUrl = new URL(url)

    if (
      patternUrl.protocol !== testUrl.protocol ||
      patternUrl.hostname !== testUrl.hostname ||
      patternUrl.port !== testUrl.port
    ) {
      return false
    }

    let patternPath = patternUrl.pathname + patternUrl.search
    const testPath = testUrl.pathname + testUrl.search

    if (pattern.endsWith("$")) {
      // Strip the $ from pattern path for exact comparison
      patternPath = patternPath.replace(/\$$/, "")
      return testPath === patternPath
    }

    return testPath.startsWith(patternPath)
  } catch {
    console.error("Error matching URL pattern:", { url, pattern })
    return false
  }
}

/**
 * Normalizes a URL for duplicate detection
 * Strips protocol and trailing slashes, lowercases hostname
 */
export function normalizeUrlForDupeCheck(url: string): string {
  try {
    const parsed = new URL(String(url || ""))
    const hostname = parsed.hostname.toLowerCase()
    const pathname = parsed.pathname.replace(/\/+$/, "")
    const search = parsed.search
    return hostname + pathname + search
  } catch {
    return String(url || "")
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "")
      .toLowerCase()
  }
}

/**
 * Converts a tab URL to a pattern for the safe URLs list
 * Returns hostname + path + search, without protocol
 */
export function toPatternFromTabUrl(rawUrl: string | undefined): string {
  if (!rawUrl) {
    return ""
  }
  try {
    const parsed = new URL(rawUrl)
    return `${parsed.hostname}${parsed.pathname}${parsed.search}`
  } catch {
    return rawUrl
  }
}
