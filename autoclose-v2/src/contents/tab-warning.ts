import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["http://*/*", "https://*/*"],
  run_at: "document_idle"
}

let originalTitle = document.title
let warningActive = false

function stripWarningPrefix(title: string): string {
  return String(title || "").replace(/^(🔴\s*){1,2}/, "")
}

function getWarningPrefix(level: number): string {
  if (level === 2) return "🔴🔴 "
  if (level === 1) return "🔴 "
  return ""
}

function applyWarning(level: number) {
  const warningLevel = level === 2 ? 2 : 1
  originalTitle = stripWarningPrefix(document.title)
  document.title = getWarningPrefix(warningLevel) + originalTitle
  warningActive = true
}

function removeWarning() {
  if (!warningActive && !document.title.startsWith("🔴")) return
  const current = document.title
  const cleaned = stripWarningPrefix(current)
  document.title = cleaned || originalTitle
  warningActive = false
}

interface TabWarningMessage {
  action: string
  enabled?: boolean
  level?: number
}

chrome.runtime.onMessage.addListener((request: TabWarningMessage) => {
  if (!request || !request.action) return

  if (request.action === "setTabWarning") {
    const requestedLevel = typeof request.level === "number" 
      ? request.level 
      : (request.enabled ? 1 : 0)
    
    if (requestedLevel >= 1) {
      applyWarning(requestedLevel)
      return
    }
    removeWarning()
  }
})
