import { Checkbox } from "~/components/ui/checkbox"

async function sendMessage(name: string) {
  return chrome.runtime.sendMessage({ name })
}
import { useAlwaysCloseDupes, useAlwaysCloseBookmarked } from "~/hooks/use-ui-settings"

interface SettingsCheckboxesProps {
  onSettingChange: () => void
}

export function SettingsCheckboxes({ onSettingChange }: SettingsCheckboxesProps) {
  const { enabled: closeDupes, setEnabled: setCloseDupes } = useAlwaysCloseDupes()
  const { enabled: closeBookmarked, setEnabled: setCloseBookmarked } = useAlwaysCloseBookmarked()

  const handleDupesChange = async (checked: boolean) => {
    await setCloseDupes(checked)
    onSettingChange()
    await sendMessage("update-badge")
  }

  const handleBookmarkedChange = async (checked: boolean) => {
    await setCloseBookmarked(checked)
    onSettingChange()
    await sendMessage("update-badge")
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={closeDupes}
          onCheckedChange={handleDupesChange}
        />
        <span>Also close duplicate tabs</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={closeBookmarked}
          onCheckedChange={handleBookmarkedChange}
        />
        <span>Also close bookmarked tabs</span>
      </label>
    </div>
  )
}
