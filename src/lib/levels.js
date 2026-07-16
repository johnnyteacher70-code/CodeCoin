// src/lib/levels.js — Daraja tizimi
// Tangalar asosida daraja, rang va progress hisoblanadi

export const LEVELS = [
  { name: 'Bronza',  min: 0,    max: 99,   badge: 'badge-bronze',   emoji: '🥉', cssClass: 'bronze'  },
  { name: 'Kumush',  min: 100,  max: 299,  badge: 'badge-silver',   emoji: '🥈', cssClass: 'silver'  },
  { name: 'Oltin',   min: 300,  max: 699,  badge: 'badge-gold',     emoji: '🥇', cssClass: 'gold'    },
  { name: 'Platina', min: 700,  max: Infinity, badge: 'badge-platinum', emoji: '💎', cssClass: 'platinum' },
]

/**
 * Tangalar soniga qarab darajani qaytaradi
 * @param {number} coins
 * @returns {{ name, min, max, badge, emoji, cssClass }}
 */
export function getLevel(coins) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (coins >= LEVELS[i].min) return LEVELS[i]
  }
  return LEVELS[0]
}

/**
 * Keyingi darajagacha qolgan foizni (0–100) hisoblaydi
 * @param {number} coins
 * @returns {{ percent: number, nextLevel: object|null, coinsLeft: number }}
 */
export function getLevelProgress(coins) {
  const current = getLevel(coins)
  const currentIndex = LEVELS.indexOf(current)
  const nextLevel = LEVELS[currentIndex + 1] ?? null

  if (!nextLevel) {
    // Eng yuqori daraja — to'la progress
    return { percent: 100, nextLevel: null, coinsLeft: 0 }
  }

  const range = nextLevel.min - current.min
  const earned = coins - current.min
  const percent = Math.min(100, Math.floor((earned / range) * 100))
  const coinsLeft = nextLevel.min - coins

  return { percent, nextLevel, coinsLeft }
}

/**
 * Daraja nishoni HTML (badge) qaytaradi
 * @param {number} coins
 * @returns {string}
 */
export function levelBadgeHTML(coins) {
  const level = getLevel(coins)
  return `<span class="badge ${level.badge}">${level.emoji} ${level.name}</span>`
}
