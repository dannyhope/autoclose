import { describe, it, expect } from "vitest"
import {
  normalizeBookmarkUrl,
  findBookmarkedTabs,
  findBlankTabs
} from "~/lib/bookmark-utils"
import type { ChromeTab } from "~/lib/tab-actions"

describe("normalizeBookmarkUrl", () => {
  it("strips UTM parameters", () => {
    const url = "https://example.com/page?utm_source=google&utm_medium=cpc&real=param"
    const result = normalizeBookmarkUrl(url)
    expect(result).toContain("real=param")
    expect(result).not.toContain("utm_source")
    expect(result).not.toContain("utm_medium")
  })

  it("handles Google Docs URLs", () => {
    const url = "https://docs.google.com/document/d/abc123/edit"
    expect(normalizeBookmarkUrl(url)).toBe("/document/d/abc123/edit")
  })

  it("handles Amazon product URLs", () => {
    const url = "https://www.amazon.co.uk/dp/B087CX6XFQ/ref=some-ref"
    expect(normalizeBookmarkUrl(url)).toBe("B087CX6XFQ")
  })

  it("handles eBay item URLs", () => {
    const url = "https://www.ebay.co.uk/itm/123456789"
    expect(normalizeBookmarkUrl(url)).toBe("123456789")
  })

  it("handles Notion URLs", () => {
    const url = "https://www.notion.so/My-Page-abc123def456789012345678901234ab"
    expect(normalizeBookmarkUrl(url)).toBe("abc123def456789012345678901234ab")
  })

  it("strips www subdomain", () => {
    const url = "https://www.example.com/page"
    expect(normalizeBookmarkUrl(url)).toBe("example.com/page")
  })
})

describe("findBookmarkedTabs", () => {
  it("finds tabs matching normalized bookmark URLs", () => {
    const tabs: ChromeTab[] = [
      { id: 1, url: "https://www.example.com/page?utm_source=test" },
      { id: 2, url: "https://other.com/page" }
    ]
    const bookmarkUrls = ["example.com/page"]
    const result = findBookmarkedTabs(tabs, bookmarkUrls)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })
})

describe("findBlankTabs", () => {
  it("finds about:blank tabs", () => {
    const tabs: ChromeTab[] = [
      { id: 1, url: "about:blank" },
      { id: 2, url: "https://example.com" }
    ]
    const result = findBlankTabs(tabs)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it("finds chrome://newtab tabs", () => {
    const tabs: ChromeTab[] = [
      { id: 1, url: "chrome://newtab/" },
      { id: 2, url: "https://example.com" }
    ]
    const result = findBlankTabs(tabs)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it("checks pendingUrl as well", () => {
    const tabs: ChromeTab[] = [
      { id: 1, url: "https://example.com", pendingUrl: "about:blank" }
    ]
    const result = findBlankTabs(tabs)
    expect(result).toHaveLength(1)
  })
})
