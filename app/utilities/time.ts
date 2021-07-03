export function toTime(seconds: number, isShowHour?: boolean): string {
  const hour = Math.floor(seconds / 3600)
  const minute = Math.floor(seconds / 60) % 60
  const second = Math.ceil(seconds % 60)
  return [
    (hour || isShowHour) && `${hour}`.padStart(2, '0'),
    `${minute}`.padStart(2, '0'),
    `${second}`.padStart(2, '0')
  ]
    .filter(Boolean)
    .join(':')
}
