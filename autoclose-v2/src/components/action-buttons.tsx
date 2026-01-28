import { useState, useEffect } from "react"
// Use chrome.runtime.sendMessage for simpler typing
async function sendMessage(name: string, body?: unknown) {
  return chrome.runtime.sendMessage({ name, body })
}
import { Button } from "~/components/ui/button"
import { useSafeUrls } from "~/hooks/use-safe-urls"
import { useOptionKey } from "~/hooks/use-option-key"
import { useMatchingTabs } from "~/hooks/use-matching-tabs"
import { toPatternFromTabUrl } from "~/lib/url-utils"

interface ActionButtonsProps {
  onRefresh: () => void
}

export function ActionButtons({ onRefresh }: ActionButtonsProps) {
  const { safeUrls, addUrl, addUrls } = useSafeUrls()
  const isOptionPressed = useOptionKey()
  const { totalCount, refresh: refreshMatching } = useMatchingTabs()
  const [isCurrentInList, setIsCurrentInList] = useState(false)

  // Check if current tab is already in the list
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.url) {
        const pattern = toPatternFromTabUrl(tab.url)
        setIsCurrentInList(safeUrls.includes(pattern))
      }
    })
  }, [safeUrls])

  const handleAddCurrent = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.url) return

    const pattern = toPatternFromTabUrl(tab.url)
    await addUrl(pattern)
    onRefresh()

    if (isOptionPressed && typeof tab.id === "number") {
      await chrome.tabs.remove(tab.id)
    }

    await sendMessage("update-badge")
  }

  const handleAddAll = async () => {
    const tabs = await chrome.tabs.query({ currentWindow: true })
    const patterns = tabs
      .map(tab => toPatternFromTabUrl(tab.url))
      .filter(Boolean)

    await addUrls(patterns)
    onRefresh()

    if (isOptionPressed) {
      await sendMessage("close-tabs")
    }

    await sendMessage("update-badge")
  }

  const handleCloseTabs = async () => {
    await sendMessage("close-tabs")
    await refreshMatching()
    onRefresh()
  }

  const addButtonText = isOptionPressed ? "Add tab & close" : "Add tab to list"
  const addAllButtonText = isOptionPressed ? "Add all & close" : "Add all tabs"
  
  let closeButtonText = "No tabs to close"
  if (totalCount === 1) {
    closeButtonText = "Close 1 tab"
  } else if (totalCount > 1) {
    closeButtonText = "Close " + totalCount + " tabs"
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          onClick={handleAddCurrent}
          disabled={isCurrentInList}
          variant="outline"
          className="flex-1"
        >
          {addButtonText}
        </Button>
        <Button
          onClick={handleAddAll}
          variant="outline"
          className="flex-1"
        >
          {addAllButtonText}
        </Button>
      </div>
      <Button
        onClick={handleCloseTabs}
        disabled={totalCount === 0}
        variant="default"
        className="w-full"
      >
        {closeButtonText}
      </Button>
    </div>
  )
}
