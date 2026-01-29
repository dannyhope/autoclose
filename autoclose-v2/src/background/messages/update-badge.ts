import type { PlasmoMessaging } from "@plasmohq/messaging"
import { getTabIdsToClose } from "~/lib/get-tabs-to-close"

export interface UpdateBadgeRequest {}

export interface UpdateBadgeResponse {
  success: boolean
  count: number
}

export async function updateBadge(): Promise<number> {
  const tabIds = await getTabIdsToClose()
  const count = tabIds.size

  if (count === 0) {
    await chrome.action.setBadgeText({ text: "" })
    await chrome.action.setBadgeBackgroundColor({ color: "#8C979C" })
  } else {
    await chrome.action.setBadgeText({ text: count.toString() })
    await chrome.action.setBadgeBackgroundColor({ color: "#ED5600" })
  }

  return count
}

const handler: PlasmoMessaging.MessageHandler<UpdateBadgeRequest, UpdateBadgeResponse> = async (req, res) => {
  try {
    const count = await updateBadge()
    res.send({ success: true, count })
  } catch (error) {
    console.error("Error updating badge:", error)
    res.send({ success: false, count: 0 })
  }
}

export default handler
