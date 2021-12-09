export enum Inject {
  Queue = 'queue',
  Processing = 'processing'
}

const values: Record<Inject, unknown | null> = {
  [Inject.Queue]: null,
  [Inject.Processing]: null
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
