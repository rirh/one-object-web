import { useState } from "react"
import { atom, useAtom } from "jotai"

export function useLocalAtom<T>(initial: T | (() => T)) {
  const [state] = useState(() =>
    atom(typeof initial === "function" ? (initial as () => T)() : initial),
  )
  return useAtom(state)
}
