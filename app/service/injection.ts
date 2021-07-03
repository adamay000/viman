export enum Inject {
  Queue = 'queue'
}

const values: Record<Inject, unknown | null> = {
  [Inject.Queue]: null
}

export const inject =
  (type: Inject): PropertyDecorator =>
  (target, propertyKey) => {
    Object.defineProperty(target, propertyKey, {
      configurable: false,
      get() {
        return values[type]
      }
    })
  }

export const provide = (type: Inject, value: unknown) => {
  values[type] = value
}
