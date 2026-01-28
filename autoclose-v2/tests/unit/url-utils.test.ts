import { describe, it, expect } from "vitest"
import {
  escapeHtml,
  parseUrlParts,
  matchesUrlPattern,
  normalizeUrlForDupeCheck,
  toPatternFromTabUrl
} from "~/lib/url-utils"

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"
    )
  })

  it("escapes ampersands", () => {
    expect(escapeHtml("foo & bar")).toBe("foo &amp; bar")
  })

  it("escapes quotes", () => {
    expect(escapeHtml('"test"')).toBe("&quot;test&quot;")
  })
})

describe("parseUrlParts", () => {
  it("parses a valid URL", () => {
    const result = parseUrlParts("https://example.com/path/to/page?query=1")
    expect(result.hostname).toBe("example.com")
    expect(result.displayPath).toBe("/path/to/page?query=1")
  })

  it("handles URLs without path", () => {
    const result = parseUrlParts("https://example.com")
    expect(result.hostname).toBe("example.com")
    expect(result.displayPath).toBe("/")
  })

  it("handles invalid URLs gracefully", () => {
    const result = parseUrlParts("not-a-url")
    expect(result.hostname).toBe("not-a-url")
    expect(result.displayPath).toBe("/")
  })
})

describe("matchesUrlPattern", () => {
  it("matches full URL prefix", () => {
    expect(
      matchesUrlPattern(
        "https://example.com/path/subpath",
        "https://example.com/path"
      )
    ).toBe(true)
  })

  it("does not match different protocols", () => {
    expect(
      matchesUrlPattern(
        "http://example.com/path",
        "https://example.com/path"
      )
    ).toBe(false)
  })

  it("matches path-only patterns", () => {
    expect(
      matchesUrlPattern("https://example.com/exact/path", "/exact/path")
    ).toBe(true)
  })

  it("matches suffix patterns", () => {
    expect(
      matchesUrlPattern("https://example.com/path", "example.com/path")
    ).toBe(true)
  })

  it("respects exact match with $ suffix", () => {
    expect(
      matchesUrlPattern("https://example.com/path", "https://example.com/path$")
    ).toBe(true)
    expect(
      matchesUrlPattern(
        "https://example.com/path/extra",
        "https://example.com/path$"
      )
    ).toBe(false)
  })
})

describe("normalizeUrlForDupeCheck", () => {
  it("lowercases hostname", () => {
    expect(normalizeUrlForDupeCheck("https://EXAMPLE.COM/path")).toBe(
      "example.com/path"
    )
  })

  it("strips trailing slashes", () => {
    expect(normalizeUrlForDupeCheck("https://example.com/path/")).toBe(
      "example.com/path"
    )
  })

  it("preserves query strings", () => {
    expect(normalizeUrlForDupeCheck("https://example.com/path?q=1")).toBe(
      "example.com/path?q=1"
    )
  })
})

describe("toPatternFromTabUrl", () => {
  it("converts a tab URL to a pattern", () => {
    expect(toPatternFromTabUrl("https://example.com/path?query=1")).toBe(
      "example.com/path?query=1"
    )
  })

  it("returns empty string for undefined", () => {
    expect(toPatternFromTabUrl(undefined)).toBe("")
  })

  it("returns original for invalid URLs", () => {
    expect(toPatternFromTabUrl("not-a-url")).toBe("not-a-url")
  })
})
