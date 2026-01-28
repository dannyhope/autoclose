import { describe, it, expect } from "vitest"
import { findMatchingTabs, getDuplicateTabIds } from "~/lib/tab-actions"
import type { ChromeTab } from "~/lib/tab-actions"

describe("findMatchingTabs", () => {
  const mockTabs: ChromeTab[] = [
    { id: 1, url: "https://example.com/path1" },
    { id: 2, url: "https://example.com/path2" },
    { id: 3, url: "https://other.com/page" },
    { id: 4, url: "https://example.com/path1/subpath" }
  ]

  it("returns tabs matching suffix pattern", () => {
    const result = findMatchingTabs(mockTabs, ["example.com/path1"])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it("returns tabs matching full URL prefix pattern", () => {
    const result = findMatchingTabs(mockTabs, ["https://example.com/path1"])
    expect(result).toHaveLength(2)
    expect(result.map((t) => t.id)).toEqual([1, 4])
  })

  it("returns empty array for no patterns", () => {
    expect(findMatchingTabs(mockTabs, [])).toEqual([])
  })

  it("returns empty array for no tabs", () => {
    expect(findMatchingTabs([], ["example.com"])).toEqual([])
  })

  it("filters out tabs without id or url", () => {
    const tabsWithInvalid: ChromeTab[] = [
      { id: 1, url: "https://example.com" },
      { url: "https://example.com" }, // no id
      { id: 2 } // no url
    ]
    const result = findMatchingTabs(tabsWithInvalid, ["example.com"])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })
})

describe("getDuplicateTabIds", () => {
  it("identifies duplicate tabs by normalized URL", () => {
    const tabs: ChromeTab[] = [
      { id: 1, url: "https://example.com/path" },
      { id: 2, url: "https://example.com/path" }, // duplicate
      { id: 3, url: "https://other.com/page" },
      { id: 4, url: "https://EXAMPLE.COM/path/" } // duplicate (normalized)
    ]
    const result = getDuplicateTabIds(tabs)
    expect(result).toEqual([2, 4])
  })

  it("returns empty array for no duplicates", () => {
    const tabs: ChromeTab[] = [
      { id: 1, url: "https://example.com/path1" },
      { id: 2, url: "https://example.com/path2" }
    ]
    expect(getDuplicateTabIds(tabs)).toEqual([])
  })

  it("handles empty input", () => {
    expect(getDuplicateTabIds([])).toEqual([])
  })
})
