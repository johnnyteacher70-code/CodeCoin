// src/lib/router.js — Oddiy hash-based SPA router

const routes = {}
let currentRoute = null

/**
 * Route'ni ro'yxatdan o'tkazadi
 * @param {string} path — masalan: '/reyting'
 * @param {Function} viewFn — async () => HTMLString | HTMLElement
 */
export function register(path, viewFn) {
  routes[path] = viewFn
}

/**
 * Berilgan yo'lga navigatsiya qiladi
 * @param {string} path
 * @param {boolean} pushState — history'ga qo'shish (default: true)
 */
export async function navigate(path, pushState = true) {
  const app = document.getElementById('app')
  if (!app) return

  const handler = routes[path]
  if (!handler) {
    // Noma'lum yo'l — login'ga qaytamiz
    return navigate('/login', pushState)
  }

  if (pushState && currentRoute !== path) {
    history.pushState({ path }, '', `#${path}`)
  }
  currentRoute = path

  // Nav link'larni yangilaymiz
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.route === path)
  })

  // View'ni render qilamiz
  try {
    const content = await handler()
    if (typeof content === 'string') {
      app.innerHTML = content
    } else if (content instanceof HTMLElement) {
      app.innerHTML = ''
      app.appendChild(content)
    }
    // Page transition animation reset
    app.style.animation = 'none'
    void app.offsetWidth
    app.style.animation = ''
  } catch (err) {
    console.error('Router: view render xatosi', err)
    app.innerHTML = `
      <div class="page" style="text-align:center;padding-top:80px">
        <p style="color:var(--color-danger);font-size:1.2rem">
          Sahifa yuklanishda xato yuz berdi. Konsolni tekshiring.
        </p>
      </div>`
  }
}

/**
 * Routerni ishga tushiradi — hash o'zgarishlarini tinglaydi
 */
export function startRouter(defaultPath = '/login') {
  window.addEventListener('popstate', (e) => {
    const path = e.state?.path ?? defaultPath
    navigate(path, false)
  })

  // Sahifa birinchi ochilganda
  const initial = location.hash.replace('#', '') || defaultPath
  navigate(initial, false)
}
