import { useMemo } from 'react'

let globalComponentId = 0
export function useComponentId(): number
export function useComponentId(toName: (id: number) => string): string
export function useComponentId(toName?: (id: number) => string): number | string {
  return useMemo(() => {
    globalComponentId += 1
    if (toName) {
      return toName(globalComponentId)
    }
    return globalComponentId
  }, [])
}
