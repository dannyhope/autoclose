import { useStorage } from "@plasmohq/storage/hook"
import { Storage } from "@plasmohq/storage"

// Storage keys matching v1 for backward compatibility
const STORAGE_KEYS = {
  LIST_TOGGLE_STATE: "listToggleState",
  ALWAYS_CLOSE_DUPES: "alwaysCloseDupes",
  ALWAYS_CLOSE_BOOKMARKED: "alwaysCloseBookmarked",
  LOOSE_MATCHING: "looseMatching",
  CLOSE_WHITELIST_ITEMS: "closeWhitelistItems"
} as const

const storage = new Storage({ area: "sync" })

/**
 * Hook for managing the list open/closed state
 */
export function useListOpen() {
  const [isOpen, setIsOpen] = useStorage<boolean>({
    key: STORAGE_KEYS.LIST_TOGGLE_STATE,
    instance: storage
  }, false)

  const toggle = async () => {
    await setIsOpen(!isOpen)
  }

  return { isOpen: isOpen ?? false, setIsOpen, toggle }
}

/**
 * Hook for managing the "always close duplicates" setting
 */
export function useAlwaysCloseDupes() {
  const [enabled, setEnabled] = useStorage<boolean>({
    key: STORAGE_KEYS.ALWAYS_CLOSE_DUPES,
    instance: storage
  }, true)

  return { enabled: enabled ?? true, setEnabled }
}

/**
 * Hook for managing the "always close bookmarked" setting
 */
export function useAlwaysCloseBookmarked() {
  const [enabled, setEnabled] = useStorage<boolean>({
    key: STORAGE_KEYS.ALWAYS_CLOSE_BOOKMARKED,
    instance: storage
  }, true)

  return { enabled: enabled ?? true, setEnabled }
}

/**
 * Hook for managing the "loose matching" setting (strip tracking params)
 */
export function useLooseMatching() {
  const [enabled, setEnabled] = useStorage<boolean>({
    key: STORAGE_KEYS.LOOSE_MATCHING,
    instance: storage
  }, true) // default: true

  return { enabled: enabled ?? true, setEnabled }
}

/**
 * Hook for managing the "strict matching" setting
 * Inverts the loose matching semantics while keeping backward compatibility
 * When strict=false (default), tracking params are stripped (same as loose=true)
 * When strict=true, URLs must match exactly (same as loose=false)
 */
export function useStrictMatching() {
  const [looseMatching, setLooseMatching] = useStorage<boolean>({
    key: STORAGE_KEYS.LOOSE_MATCHING,
    instance: storage
  }, true) // Keep default as true for looseMatching

  return {
    enabled: !(looseMatching ?? true), // Invert: loose=true → strict=false
    setEnabled: async (strict: boolean) => setLooseMatching(!strict)
  }
}

/**
 * Hook for managing the "close whitelist items" setting
 * When enabled (default), tabs matching whitelist URLs are closed
 * When disabled, only duplicates and bookmarked pages are considered
 */
export function useCloseWhitelistItems() {
  const [enabled, setEnabled] = useStorage<boolean>({
    key: STORAGE_KEYS.CLOSE_WHITELIST_ITEMS,
    instance: storage
  }, true) // default: true - close items that match the whitelist

  return { enabled: enabled ?? true, setEnabled }
}

/**
 * Non-hook storage access for background scripts
 */
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const value = await storage.get<T>(key)
  return value ?? defaultValue
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await storage.set(key, value)
}

export { STORAGE_KEYS }
