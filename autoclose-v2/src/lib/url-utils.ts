import { TRACKING_PARAMS } from "./tracking-params"

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
 *
 * When looseMatching is true, tracking parameters are stripped from both
 * the URL and pattern before comparison.
 */
export function matchesUrlPattern(
  url: string,
  pattern: string,
  looseMatching: boolean = false
): boolean {
  try {
    // Strip tracking params if loose matching is enabled
    let urlToTest = url
    let patternToTest = pattern
    if (looseMatching) {
      urlToTest = stripTrackingParams(url)
      // For suffix patterns without protocol, we need to add one temporarily
      if (!/^https?:\/\//i.test(pattern)) {
        const tempPattern = stripTrackingParams("https://" + pattern)
        patternToTest = tempPattern.replace(/^https:\/\//, "")
      } else {
        patternToTest = stripTrackingParams(pattern)
      }
    }

    if (!/^https?:\/\//i.test(patternToTest)) {
      if (patternToTest.startsWith("/")) {
        const urlObj = new URL(urlToTest)
        return urlObj.pathname + urlObj.search === patternToTest
      }
      return urlToTest.endsWith(patternToTest)
    }

    const patternUrl = new URL(patternToTest)
    const testUrl = new URL(urlToTest)

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
 * Parses text into an array of URLs.
 * Splits on newlines, trims whitespace, and filters empty lines.
 */
export function parseUrlText(text: string): string[] {
	return text
		.split("\n")
		.map(line => line.trim())
		.filter(line => line.length > 0)
}

/**
 * Strips known tracking parameters from a URL
 */
export function stripTrackingParams(url: string): string {
  try {
    const parsed = new URL(url)
    const params = new URLSearchParams(parsed.search)

    for (const param of TRACKING_PARAMS) {
      params.delete(param)
    }

    parsed.search = params.toString()
    return parsed.toString()
  } catch {
    return url
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
