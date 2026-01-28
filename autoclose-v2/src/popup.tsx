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
      </div>
    </TooltipProvider>
  )
}

export default Popup
