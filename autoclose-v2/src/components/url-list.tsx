import { useState, useEffect, useMemo, useRef } from "react"
import { ChevronDown, Download, Upload, Check } from "lucide-react"
import { ScrollArea } from "~/components/ui/scroll-area"
import { Checkbox } from "~/components/ui/checkbox"

async function sendMessage(name: string) {
  return chrome.runtime.sendMessage({ name })
}
import { Button } from "~/components/ui/button"
import { DomainGroup } from "./domain-group"
import { UrlListItem } from "./url-list-item"
import { useSafeUrls } from "~/hooks/use-safe-urls"
import { useListOpen, useStrictMatching } from "~/hooks/use-ui-settings"
import { parseUrlParts, matchesUrlPattern, parseUrlText } from "~/lib/url-utils"

interface UrlGroup {
  domain: string
  items: Array<{ url: string; isOpen: boolean }>
}

export function UrlList() {
  const { safeUrls, removeUrl, addUrls } = useSafeUrls()
  const { isOpen, toggle } = useListOpen()
  const { enabled: strictMatching, setEnabled: setStrictMatching } = useStrictMatching()
  const [openTabs, setOpenTabs] = useState<string[]>([])
  const [exported, setExported] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch open tabs
  useEffect(() => {
    const fetchTabs = async () => {
      const tabs = await chrome.tabs.query({})
      setOpenTabs(tabs.map(t => t.url).filter((u): u is string => !!u))
    }
    fetchTabs()

    const listener = () => fetchTabs()
    chrome.tabs.onUpdated.addListener(listener)
    chrome.tabs.onRemoved.addListener(listener)
    chrome.tabs.onCreated.addListener(listener)

    return () => {
      chrome.tabs.onUpdated.removeListener(listener)
      chrome.tabs.onRemoved.removeListener(listener)
      chrome.tabs.onCreated.removeListener(listener)
    }
  }, [])

  // Group URLs by domain
  // Pass !strictMatching as looseMatching: strict=false means loose=true
  const groups = useMemo((): UrlGroup[] => {
    const sorted = [...safeUrls].sort((a, b) => a.localeCompare(b))
    const map = new Map<string, UrlGroup>()

    for (const url of sorted) {
      const { hostname } = parseUrlParts(url)
      const key = hostname.toLowerCase()
      const isOpen = openTabs.some(tabUrl => matchesUrlPattern(tabUrl, url, !strictMatching))

      if (!map.has(key)) {
        map.set(key, { domain: hostname, items: [] })
      }
      map.get(key)!.items.push({ url, isOpen })
    }

    return Array.from(map.values()).sort((a, b) => a.domain.localeCompare(b.domain))
  }, [safeUrls, openTabs, strictMatching])

  const handleDelete = async (url: string) => {
    await removeUrl(url)
    await sendMessage("update-badge")
  }

  const handleOpen = async (url: string) => {
    let target = url
    if (!/^https?:\/\//i.test(target)) {
      target = "https://" + target
    }
    await chrome.tabs.create({ url: target })
  }

  const handleExport = () => {
    if (safeUrls.length === 0) return
    const content = safeUrls.join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "autoclose-whitelist.txt"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setExported(true)
    setTimeout(() => setExported(false), 1500)
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      console.log("[import] Reading file:", file.name)
      const text = await file.text()
      console.log("[import] File content length:", text.length, "chars")

      const urls = parseUrlText(text)
      console.log("[import] Parsed", urls.length, "URLs from file")

      if (urls.length > 0) {
        console.log("[import] Current safeUrls count:", safeUrls.length)
        const dupes = urls.filter(u => safeUrls.includes(u))
        const fresh = urls.filter(u => !safeUrls.includes(u))
        console.log("[import] Duplicates (skipped):", dupes.length, "| New:", fresh.length)

        await addUrls(urls)
        await sendMessage("update-badge")
        console.log("[import] Done. safeUrls count now:", safeUrls.length + fresh.length)
      } else {
        console.log("[import] No URLs found in file")
      }
    } catch (error) {
      console.error("[import] Error:", error)
    }

    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleStrictMatchingChange = async (checked: boolean) => {
    await setStrictMatching(checked)
    await sendMessage("update-badge")
  }

  return (
    <div className="flex flex-col">
      <button
        onClick={toggle}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-2"
      >
        <ChevronDown
          className={"w-4 h-4 transition-transform " + (isOpen ? "" : "-rotate-90")}
        />
        <span>White List ({safeUrls.length})</span>
      </button>

      {isOpen && (
        <div className="flex flex-col">
          <label
            className="flex items-center gap-2 cursor-pointer py-2 text-sm"
            title="When enabled, URLs must match exactly including query parameters"
          >
            <Checkbox
              checked={strictMatching}
              onCheckedChange={handleStrictMatchingChange}
            />
            <span>Strict matching (less likely to close tabs with tracking parameters)</span>
          </label>

          <ScrollArea className="h-[320px]">
            <div className="pr-4">
              {groups.map(group => (
                <div key={group.domain}>
                  <DomainGroup domain={group.domain} />
                  {group.items.map(item => (
                    <UrlListItem
                      key={item.url}
                      url={item.url}
                      isOpen={item.isOpen}
                      onDelete={() => handleDelete(item.url)}
                      onClick={() => handleOpen(item.url)}
                    />
                  ))}
                </div>
              ))}
              {groups.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No URLs added yet
                </p>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.json"
              onChange={handleImport}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1"
            >
              <Upload className="w-3 h-3" />
              Import
            </Button>
            {safeUrls.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="gap-1"
              >
                {exported ? (
                  <>
                    <Check className="w-3 h-3" />
                    Exported!
                  </>
                ) : (
                  <>
                    <Download className="w-3 h-3" />
                    Export
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
