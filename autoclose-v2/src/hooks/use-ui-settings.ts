import { useStorage } from "@plasmohq/storage/hook"
import { Storage } from "@plasmohq/storage"

// Storage keys matching v1 for backward compatibility
const STORAGE_KEYS = {
  LIST_TOGGLE_STATE: "listToggleState",
  ALWAYS_CLOSE_DUPES: "alwaysCloseDupes",
  ALWAYS_CLOSE_BOOKMARKED: "alwaysCloseBookmarked"
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
  }, false)

  return { enabled: enabled ?? false, setEnabled }
}

/**
 * Hook for managing the "always close bookmarked" setting
 */
export function useAlwaysCloseBookmarked() {
  const [enabled, setEnabled] = useStorage<boolean>({
    key: STORAGE_KEYS.ALWAYS_CLOSE_BOOKMARKED,
    instance: storage
  }, false)

  return { enabled: enabled ?? false, setEnabled }
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
