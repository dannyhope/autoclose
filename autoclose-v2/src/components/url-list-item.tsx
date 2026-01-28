import { Trash2 } from "lucide-react"
import { parseUrlParts } from "~/lib/url-utils"

interface UrlListItemProps {
  url: string
  isOpen: boolean
  onDelete: () => void
  onClick: () => void
}

export function UrlListItem({ url, isOpen, onDelete, onClick }: UrlListItemProps) {
  const { displayPath } = parseUrlParts(url)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div className="flex items-center gap-2 pl-6 pr-2 py-1.5 hover:bg-accent rounded group">
      <span
        className="flex-1 truncate cursor-pointer text-sm"
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        title={url}
      >
        {displayPath}
      </span>
      <span className="w-4 text-center flex-none">
        {isOpen && <span className="text-xs">🔴</span>}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="flex-none p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-opacity"
        title="Remove this pattern"
      >
        <Trash2 className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  )
}
