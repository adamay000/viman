import { initializeStore } from '@/store/_hooks'
import { VIDEO_COLUMN_MIN, VIDEO_COLUMN_MAX, VIDEO_AUTOSPEED_MIN, VIDEO_AUTOSPEED_MAX } from '@/constants'

export const useGlobalState = initializeStore<{
  column: number
  autospeed: number
  filter: string
  tagIds: Array<number>
  tagLogic: 'and' | 'or'
}>({
  column: {
    value: 4,
    validate: (value) => value >= VIDEO_COLUMN_MIN && value <= VIDEO_COLUMN_MAX
  },
  autospeed: {
    value: 500,
    validate: (value) => value >= VIDEO_AUTOSPEED_MIN && value <= VIDEO_AUTOSPEED_MAX
  },
  filter: {
    value: ''
  },
  tagIds: {
    value: []
  },
  tagLogic: {
    value: 'and',
    validate: (value) => value === 'and' || value === 'or'
  }
})
