// src/lib/toast.js — Zamonaviy toast notification tizimi

let container = null

function getContainer() {
  if (!container) {
    container = document.createElement('div')
    container.id = 'toast-container'
    document.body.appendChild(container)
  }
  return container
}

/**
 * Toast ko'rsatish
 * @param {string} message
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {number} duration — ms
 */
export function toast(message, type = 'info', duration = 3500) {
  const c = getContainer()
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }

  const el = document.createElement('div')
  el.className = `toast toast-${type}`
  el.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" aria-label="Yopish">✕</button>
  `

  c.appendChild(el)

  // Animate in
  requestAnimationFrame(() => el.classList.add('toast-show'))

  const remove = () => {
    el.classList.remove('toast-show')
    el.classList.add('toast-hide')
    el.addEventListener('transitionend', () => el.remove(), { once: true })
  }

  el.querySelector('.toast-close').addEventListener('click', remove)
  const timer = setTimeout(remove, duration)
  el.addEventListener('mouseenter', () => clearTimeout(timer))
  el.addEventListener('mouseleave', () => setTimeout(remove, 1000))
}

export const toastSuccess = (msg, dur) => toast(msg, 'success', dur)
export const toastError   = (msg, dur) => toast(msg, 'error', dur)
export const toastInfo    = (msg, dur) => toast(msg, 'info', dur)
export const toastWarn    = (msg, dur) => toast(msg, 'warning', dur)
