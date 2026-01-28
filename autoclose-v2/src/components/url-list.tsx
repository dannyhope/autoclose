import { useState, useEffect, useMemo } from "react"
import { ChevronDown, Copy, Check } from "lucide-react"
import { ScrollArea } from "~/components/ui/scroll-area"

async function sendMessage(name: string) {
  return chrome.runtime.sendMessage({ name })
}
import { Button } from "~/components/ui/button"
import { DomainGroup } from "./domain-group"
import { UrlListItem } from "./url-list-item"
import { useSafeUrls } from "~/hooks/use-safe-urls"
import { useListOpen } from "~/hooks/use-ui-settings"
import { parseUrlParts, matchesUrlPattern } from "~/lib/url-utils"

interface UrlGroup {
  domain: string
  items: Array<{ url: string; isOpen: boolean }>
}

export function UrlList() {
  const { safeUrls, removeUrl } = useSafeUrls()
  const { isOpen, toggle } = useListOpen()
  const [openTabs, setOpenTabs] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

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
  const groups = useMemo((): UrlGroup[] => {
    const sorted = [...safeUrls].sort((a, b) => a.localeCompare(b))
    const map = new Map<string, UrlGroup>()

    for (const url of sorted) {
      const { hostname } = parseUrlParts(url)
      const key = hostname.toLowerCase()
      const isOpen = openTabs.some(tabUrl => matchesUrlPattern(tabUrl, url))

      if (!map.has(key)) {
        map.set(key, { domain: hostname, items: [] })
      }
      map.get(key)!.items.push({ url, isOpen })
    }

    return Array.from(map.values()).sort((a, b) => a.domain.localeCompare(b.domain))
  }, [safeUrls, openTabs])

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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(safeUrls.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
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
        <span>Safe URLs ({safeUrls.length})</span>
      </button>

      {isOpen && (
        <div className="flex flex-col">
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

          {safeUrls.length > 0 && (
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy list
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
