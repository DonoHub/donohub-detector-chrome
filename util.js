"use strict";

export function formatDurationHHMMSS(d) {
  const pad = (x) => (x < 10 ? `0${x}` : x)
  const h = Math.floor(d / 3600000)
  const m = Math.floor((d % 3600000) / 60000)
  const s = Math.floor((d % 60000) / 1000)
  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`
  } else {
    return `${m}:${pad(s)}`
  }
}

const minMs = 60 * 1000
const hourMs = (60 * minMs)
const dayMs = (24 * hourMs)
const monthMs = (30 * dayMs)
const yearMs = (12 * monthMs)

export function formatDurationYMDH(d) {
  const y = Math.floor(d / yearMs)
  const m = Math.floor((d % yearMs) / monthMs)
  if (y > 0) {
    return `${y}y${m}m`
  }
  const d2 = Math.floor((d % monthMs) / dayMs)
  if (m > 0) {
    return `${m}m${d2}d`
  }
  const h = Math.floor((d % dayMs) / hourMs)
  if (d2 > 0) {
    return `${d2}d${h}h`
  }
  const min = Math.floor((d % hourMs) / minMs)
  return `${h}h${min}m`
}

export function formatDuration(d) {
  if (d < 0) {
    return "?"
  } else if (d >= hourMs) {
    return formatDurationYMDH(d)
  } else {
    return formatDurationHHMMSS(d)
  }
}
