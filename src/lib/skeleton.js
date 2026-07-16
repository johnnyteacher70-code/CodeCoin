// src/lib/skeleton.js — Skeleton loader HTML generatorlar

export const skeletonLine = (w = '100%') =>
  `<div class="skeleton" style="width:${w};height:14px;border-radius:6px"></div>`

export const skeletonRound = (size = 40) =>
  `<div class="skeleton" style="width:${size}px;height:${size}px;border-radius:50%"></div>`

/** Reyting qatori skeleton */
export function skeletonRankRows(count = 5) {
  return Array.from({ length: count }, () => `
    <div class="rank-row" style="gap:12px">
      ${skeletonRound(40)}
      <div style="flex:1;display:flex;flex-direction:column;gap:8px">
        ${skeletonLine('60%')}
        ${skeletonLine('40%')}
      </div>
      ${skeletonLine('60px')}
    </div>
  `).join('')
}

/** Stat karta skeleton */
export function skeletonStatCards(count = 3) {
  return `<div class="stats-grid">${Array.from({ length: count }, () => `
    <div class="stat-card">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        ${skeletonLine('50%')}
        ${skeletonRound(34)}
      </div>
      ${skeletonLine('40%')}
      <div style="margin-top:8px">${skeletonLine('60%')}</div>
    </div>
  `).join('')}</div>`
}

/** Tranzaksiya skeleton */
export function skeletonTxRows(count = 4) {
  return Array.from({ length: count }, () => `
    <div class="tx-item">
      ${skeletonRound(34)}
      <div style="flex:1;display:flex;flex-direction:column;gap:7px">
        ${skeletonLine('70%')}
        ${skeletonLine('35%')}
      </div>
      ${skeletonLine('50px')}
    </div>
  `).join('')
}
