// src/views/nav.js
import { signOut } from '../auth/auth.js'
import { navigate } from '../lib/router.js'

/** Teacher: sidebar + topbar */
export function buildTeacherNav(profile, activeRoute) {
  const initials = profile.full_name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)
  const items = [
    { route: '/dashboard',     icon: '⊞',   label: 'Dashboard'       },
    { route: '/guruhlar',      icon: '👥',   label: 'Guruhlar'        },
    { route: '/yangi-oquvchi', icon: '➕',   label: "Yangi o'quvchi"  },
    { route: '/admin',         icon: '🪙',   label: 'Coin berish'     },
    { route: '/tarix',         icon: '📜',   label: 'Coin Tarixi'     },
  ]
  const navItems = items.map(i =>
    '<button class="sidebar-nav-item' + (activeRoute === i.route ? ' active' : '') + '" data-route="' + i.route + '">' +
    '<span class="nav-icon">' + i.icon + '</span>' + i.label +
    '</button>'
  ).join('')

  return '' +
    '<aside class="sidebar">' +
    '<div class="sidebar-brand">' +
    '<div class="sidebar-brand-icon">TC</div>' +
    '<span class="sidebar-brand-name">TeacherCoin</span>' +
    '</div>' +
    '<nav class="sidebar-nav">' + navItems + '</nav>' +
    '<div class="sidebar-footer">' +
    '<button class="sidebar-nav-item" id="logoutBtn"><span class="nav-icon">EX</span>Chiqish</button>' +
    '</div>' +
    '</aside>' +
    '<div class="teacher-topbar">' +
    '<div class="topbar-search">' +
    '<span style="color:var(--text-3)">🔍</span>' +
    '<input type="text" placeholder="O\'quvchi qidirish..." id="searchInput" />' +
    '</div>' +
    '<div class="topbar-right gap-3">' +
    '<div style="display:flex;align-items:center;gap:8px">' +
    '<div class="topbar-avatar">' + initials + '</div>' +
    '<div>' +
    '<div class="topbar-name">' + escHtml(profile.full_name) + '</div>' +
    '<div class="topbar-role">O\'qituvchi</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<nav class="bottom-nav">' +
    items.map(i =>
      '<button class="nav-item' + (activeRoute === i.route ? ' active' : '') + '" data-route="' + i.route + '">' +
      '<span class="nav-icon">' + i.icon + '</span>' + i.label.split(' ')[0] +
      '</button>'
    ).join('') +
    '<button class="nav-item" id="logoutBtnMobile"><span class="nav-icon">EX</span>Chiqish</button>' +
    '</nav>'
}

/** Student: top nav */
export function buildStudentNav(profile, activeRoute, coins, hasGroup) {
  if (coins === undefined || coins === null) coins = 0
  if (hasGroup === undefined || hasGroup === null) hasGroup = true

  const allItems = [
    { route: '/mening',  label: 'Bosh sahifa', icon: 'BS' },
    { route: '/dokon',   label: 'Market',       icon: 'MK' },
    { route: '/reyting', label: 'Reyting',      icon: 'RT' },
  ]
  const tip = "Guruhga qo'shilganingizdan so'ng ochiladi"
  const initials = profile.full_name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)

  const navItems = allItems.map(function(i) {
    var locked = !hasGroup && i.route !== '/mening'
    if (locked) {
      return '<span class="student-topnav-item nav-locked" data-tip="' + tip + '">' + i.label + ' 🔒</span>'
    }
    return '<a class="student-topnav-item' + (activeRoute === i.route ? ' active' : '') + '" href="#' + i.route + '" data-route="' + i.route + '">' + i.label + '</a>'
  }).join('')

  const mobileItems = allItems.map(function(i) {
    var locked = !hasGroup && i.route !== '/mening'
    if (locked) {
      return '<span class="nav-item nav-locked" data-tip="' + tip + '">' +
        '<span class="nav-icon">' + i.icon + '</span>' + i.label.split(' ')[0] + ' 🔒</span>'
    }
    return '<a class="nav-item' + (activeRoute === i.route ? ' active' : '') + '" href="#' + i.route + '" data-route="' + i.route + '">' +
      '<span class="nav-icon">' + i.icon + '</span>' + i.label.split(' ')[0] + '</a>'
  }).join('')

  return '' +
    '<header class="student-topbar">' +
    '<div class="student-topbar-brand">' +
    '<div class="sidebar-brand-icon" style="width:32px;height:32px;font-size:0.75rem">TC</div>' +
    'TeacherCoin' +
    '</div>' +
    '<nav class="student-topbar-nav">' + navItems + '</nav>' +
    '<div class="flex items-center gap-3">' +
    '<div class="coin-badge">' +
    '<div class="coin-badge-icon">C</div>' +
    '<span class="coin-number" id="navCoins">' + coins + '</span>' +
    '</div>' +
    '<button class="btn btn-ghost btn-sm" id="logoutBtn" style="color:var(--red);border-color:var(--red)">Chiqish</button>' +
    '</div>' +
    '</header>' +
    '<nav class="bottom-nav">' + mobileItems + '</nav>'
}

export function initNav() {
  const logout = async () => { await signOut(); navigate('/login') }
  document.getElementById('logoutBtn') && document.getElementById('logoutBtn').addEventListener('click', logout)
  document.getElementById('logoutBtnMobile') && document.getElementById('logoutBtnMobile').addEventListener('click', logout)

  document.querySelectorAll('[data-route]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.preventDefault()
      navigate(el.dataset.route)
    })
  })
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
