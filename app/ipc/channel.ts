import { ItemStatus } from '@/service/models/Item'
import { HistoryObject } from '@/service/console'

export type RequestId = number

type SendEnvelope<T extends Record<string, void | Record<string, unknown>>> = T

type RequestEnvelope<
  T extends Record<
    string,
    {
      request: void | Record<string, unknown>
      response: Record<string, unknown>
    }
  >
> = T

export type RendererToMainChannel = SendEnvelope<{
  files: {
    paths: ReadonlyArray<string>
  }
  foreground: {
    isFixed: boolean
  }
  newWindow: void
}>

export type MainToRendererChannel = SendEnvelope<{
  console: {
    type: keyof Console & ('log' | 'warn' | 'error' | 'debug' | 'info')
    messages: Array<string>
    timestamp: number
  }
  status: {
    message: string
    details: string
  }
}>

export type RequestChannel = RequestEnvelope<{
  consoleHistory: {
    request: {
      timestamp: number
    }
    response: {
      history: Array<HistoryObject>
    }
  }
  items: {
    request: void
    response: {
      items: Array<{
        name: string
        path: string
        status: ItemStatus
        error: string
        externalTable: string | null
      }>
    }
  }
  videos: {
    request: void
    response: {
      videos: Array<{
        id: number
        path: string
        size: number
        duration: number
        thumbnailTimestamps: Array<number>
      }>
    }
  }
  videosByTag: {
    request: {
      tagIds: Array<number>
      logic: 'and' | 'or'
    }
    response: {
      tags: Array<{
        tagId: number
        tagName: string
      }>
      videos: Array<{
        id: number
        path: string
        size: number
        duration: number
        thumbnailTimestamps: Array<number>
      }>
    }
  }
  getAllTags: {
    request: void
    response: {
      tags: Array<{
        tagId: number
        tagName: string
        count: number
      }>
    }
  }
  getTags: {
    request: {
      itemId: number
    }
    response: {
      tags: Array<{
        tagId: number
        tagName: string
      }>
    }
  }
  addTag: {
    request: {
      itemId: number
      tagName: string
    }
    response: {
      tags: Array<{
        tagId: number
        tagName: string
      }>
      suggestions: Array<{
        tagId: number
        tagName: string
      }>
    }
  }
  removeTag: {
    request: {
      itemId: number
      tagId: number
    }
    response: {
      tags: Array<{
        tagId: number
        tagName: string
      }>
    }
  }
  tagSuggestions: {
    request: {
      itemId: number
      tagName: string
      limit?: number
    }
    response: {
      relatedTags: Array<{
        tagId: number
        tagName: string
        count: number
      }>
      mostUsedTags: Array<{
        tagId: number
        tagName: string
        count: number
      }>
    }
  }
}>
