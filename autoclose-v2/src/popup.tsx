import { useState, useCallback } from "react"
import { TooltipProvider } from "~/components/ui/tooltip"
import { ActionButtons } from "~/components/action-buttons"
import { SettingsCheckboxes } from "~/components/settings-checkboxes"
import { UrlList } from "~/components/url-list"

import "~/style.css"

function Popup() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  return (
    <TooltipProvider>
      <div className="w-[480px] p-4 flex flex-col gap-4" key={refreshKey}>
        <ActionButtons onRefresh={handleRefresh} />
        <SettingsCheckboxes onSettingChange={handleRefresh} />
        <UrlList />
        <footer className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
          <a
            href="https://dannyhope.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            A Danny Hope product
          </a>
          <a
            href="https://github.com/dannyhope/autoclose/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            Feedback
          </a>
        </footer>
      </div>
    </TooltipProvider>
  )
}

export default Popup
