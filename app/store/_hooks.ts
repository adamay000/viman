import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'

type StoreDefinition<State> = {
  [Key in keyof State]: {
    value: State[Key]
    validate?(value: State[Key]): boolean
  }
}

export const initializeStore = <State extends Record<string, unknown>>(storeDefinition: StoreDefinition<State>) => {
  const store = storeDefinition as StoreDefinition<State> &
    {
      [Key in keyof State]: {
        listeners: Set<Dispatch<SetStateAction<State[Key]>>>
      }
    }
  Object.keys(store).forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    store[key]!.listeners = new Set()
  })

  return <Key extends keyof State>(key: Key): [State[Key], (value: State[Key]) => void] => {
    const [localState, setLocalState] = useState(store[key].value)

    useEffect(() => {
      setLocalState(store[key].value)
      store[key].listeners.add(setLocalState)
      return () => {
        store[key].listeners.delete(setLocalState)
      }
    }, [])

    const setGlobalState = useCallback((value: State[Key]) => {
      const validate = store[key].validate as ((value: State[Key]) => boolean) | void
      if (validate && !validate(value)) {
        console.warn(`Validation error while updating global state '${key}' to '${value}'.`)
        return
      }
      store[key].value = value
      setLocalState(value)
      store[key].listeners.forEach((listener) => listener(value))
    }, [])

    return [localState as State[Key], setGlobalState]
  }
}
