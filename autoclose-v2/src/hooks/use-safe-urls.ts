import { useStorage } from "@plasmohq/storage/hook"
import { Storage } from "@plasmohq/storage"

const STORAGE_KEY = "safeUrls"

/**
 * Hook for managing the safe URLs list
 * Uses chrome.storage.sync for cross-device sync
 */
export function useSafeUrls() {
  const [safeUrls, setSafeUrls] = useStorage<string[]>({
    key: STORAGE_KEY,
    instance: new Storage({ area: "sync" })
  }, [])

  const addUrl = async (url: string) => {
    if (!url || safeUrls.includes(url)) return
    await setSafeUrls([url, ...safeUrls])
  }

  const addUrls = async (urls: string[]) => {
    const uniqueNew = urls.filter(url => url && !safeUrls.includes(url))
    if (uniqueNew.length === 0) return
    await setSafeUrls([...uniqueNew, ...safeUrls])
  }

  const removeUrl = async (url: string) => {
    await setSafeUrls(safeUrls.filter(u => u !== url))
  }

  const clearAll = async () => {
    await setSafeUrls([])
  }

  return {
    safeUrls: safeUrls ?? [],
    addUrl,
    addUrls,
    removeUrl,
    clearAll
  }
}

/**
 * Non-hook storage access for background scripts
 */
const storage = new Storage({ area: "sync" })

export async function getSafeUrls(): Promise<string[]> {
  const urls = await storage.get<string[]>(STORAGE_KEY)
  return urls ?? []
}

export async function setSafeUrls(urls: string[]): Promise<void> {
  await storage.set(STORAGE_KEY, urls)
}
