import { useState, useEffect, useCallback } from "react"

/**
 * Hook to detect when Option/Alt key is pressed
 * Used to modify button behavior (e.g., "Add & Close" vs "Add")
 */
export function useOptionKey() {
  const [isPressed, setIsPressed] = useState(false)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "Alt" && !isPressed) {
      setIsPressed(true)
    }
  }, [isPressed])

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.key === "Alt") {
      setIsPressed(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  return isPressed
}
