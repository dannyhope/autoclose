import { describe, it, expect } from "vitest"
import { parseClipboardText } from "~/lib/url-utils"

describe("parseClipboardText", () => {
	it("parses newline-separated URLs", () => {
		const text = "example.com/page1\nexample.com/page2\nexample.com/page3"
		const result = parseClipboardText(text)
		expect(result).toEqual([
			"example.com/page1",
			"example.com/page2",
			"example.com/page3"
		])
	})

	it("trims whitespace from each line", () => {
		const text = "  example.com/page1  \n  example.com/page2  "
		const result = parseClipboardText(text)
		expect(result).toEqual(["example.com/page1", "example.com/page2"])
	})

	it("filters out empty lines", () => {
		const text = "example.com/page1\n\n\nexample.com/page2\n\n"
		const result = parseClipboardText(text)
		expect(result).toEqual(["example.com/page1", "example.com/page2"])
	})

	it("filters out whitespace-only lines", () => {
		const text = "example.com/page1\n   \n\t\nexample.com/page2"
		const result = parseClipboardText(text)
		expect(result).toEqual(["example.com/page1", "example.com/page2"])
	})

	it("handles Windows-style line endings (CRLF)", () => {
		const text = "example.com/page1\r\nexample.com/page2\r\nexample.com/page3"
		const result = parseClipboardText(text)
		expect(result).toEqual([
			"example.com/page1",
			"example.com/page2",
			"example.com/page3"
		])
	})

	it("returns empty array for empty string", () => {
		expect(parseClipboardText("")).toEqual([])
	})

	it("returns empty array for whitespace-only string", () => {
		expect(parseClipboardText("   \n\n   ")).toEqual([])
	})

	it("handles a single URL with no newline", () => {
		const result = parseClipboardText("example.com/page")
		expect(result).toEqual(["example.com/page"])
	})

	it("handles URLs with complex query strings and encoded characters", () => {
		const text = [
			"www.facebook.com/privacy/consent/?flow=ad_free_subscription_uk&params%5Bafs_variant%5D=first_time",
			"www.notion.so/install-integration?response_type=code&client_id=1f8d872b-594c-80a4-b2f4-00370af2b13f",
			"www.google.com/search?q=test&sourceid=chrome&ie=UTF-8"
		].join("\n")

		const result = parseClipboardText(text)
		expect(result).toHaveLength(3)
		expect(result[0]).toContain("facebook.com/privacy/consent")
		expect(result[1]).toContain("notion.so/install-integration")
		expect(result[2]).toContain("google.com/search")
	})

	it("parses a realistic copied URL list from the extension", () => {
		const text = [
			"www.facebook.com/privacy/consent/?flow=ad_free_subscription_uk&params%5Bafs_variant%5D=first_time&params%5Bgcl_experience_id%5D=16bd5e81-ec0f-4de4-a711-e3411dba7ee3&source=ad_free_subscription_uk_blocking_pft_only_flow",
			"www.instagram.com/consent/?flow=ad_free_subscription_uk&params_json=%7B%22afs_variant%22%3A%22first_time%22%7D",
			"grok.com/?referrer=x",
			"www.notion.so/uxbri/UX-Brighton-2026-Emerging-Methods-28d26cb627c08045a93bf8e5d6ff208b",
			"uxbri.org/2026/",
			"www.youtube.com/@uxbri/community",
			"extensions/",
			"www.amazon.co.uk/s?k=soil+ph+testing+kit",
			"www.linkedin.com/company/ux-brighton/?viewAsMember=true",
			"x.com/notifications",
			"www.youtube.com/",
			"www.netflix.com/browse",
			"github.com/dannyhope",
			"mail.google.com/mail/u/0/",
			"www.google.com/search?q=test1&sourceid=chrome&ie=UTF-8",
			"www.google.co.uk/search?q=test2"
		].join("\n")

		const result = parseClipboardText(text)
		expect(result).toHaveLength(16)
		expect(result).toContain("extensions/")
		expect(result).toContain("grok.com/?referrer=x")
		expect(result).toContain("www.netflix.com/browse")
	})
})
