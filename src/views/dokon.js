// src/views/dokon.js — Student market
import { supabase } from '../lib/supabase.js'
import { buildStudentNav } from './nav.js'
import { toastSuccess, toastError, toastInfo } from '../lib/toast.js'

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }

export async function dokonView(currentProfile) {
  const [{ data: profile }, { data: rewards }, { data: myRequests }] = await Promise.all([
    supabase.from('profiles').select('id,coins').eq('id', currentProfile.id).single(),
    supabase.from('rewards').select('*').order('price'),
    supabase.from('purchase_requests').select('reward_id,status').eq('student_id', currentProfile.id)
  ])

  const coins = profile?.coins ?? currentProfile.coins ?? 0
  const pendingIds  = new Set((myRequests??[]).filter(r=>r.status==='pending').map(r=>r.reward_id))
  const approvedIds = new Set((myRequests??[]).filter(r=>r.status==='approved').map(r=>r.reward_id))

  const rewardsHTML = (rewards??[]).length === 0
    ? '<div class="rwd-empty"><div style="font-size:3rem">🛍</div><div>Do\'kon bo\'sh</div><div style="font-size:.82rem;color:var(--text-3);margin-top:4px">O\'qituvchi tez orada mukofotlar qo\'shadi</div></div>'
    : (rewards??[]).map(r => {
        const can      = coins >= r.price
        const pending  = pendingIds.has(r.id)
        const approved = approvedIds.has(r.id)

        let btnHTML
        if (approved) {
          btnHTML = '<button class="shop-btn shop-btn-done" disabled>✓ Tasdiqlangan</button>'
        } else if (pending) {
          btnHTML = '<button class="shop-btn shop-btn-pending" disabled>⏳ Kutilmoqda</button>'
        } else if (!can) {
          btnHTML = '<button class="shop-btn shop-btn-locked" disabled>🔒 ' + r.price + ' 🪙 kerak</button>'
        } else {
          btnHTML = '<button class="shop-btn shop-btn-buy buy-btn"' +
            ' data-rid="' + r.id + '" data-name="' + esc(r.name) + '" data-price="' + r.price + '">' +
            'Sotib olish</button>'
        }

        return '<div class="shop-card' + (can && !pending && !approved ? ' can-afford' : '') + '">' +
          '<div class="shop-card-top">' +
            '<div class="shop-emoji">' + esc(r.emoji) + '</div>' +
            '<div class="shop-price-badge">' + r.price + ' 🪙</div>' +
          '</div>' +
          '<div class="shop-name">' + esc(r.name) + '</div>' +
          btnHTML +
        '</div>'
      }).join('')

  const myActiveReqs = (myRequests??[]).filter(r=>r.status==='pending').length
  const notifBanner = myActiveReqs > 0
    ? '<div class="shop-notif-banner">⏳ ' + myActiveReqs + ' ta so\'rovingiz o\'qituvchi tasdiqlashini kutmoqda</div>'
    : ''

  return buildStudentNav(currentProfile, '/dokon', coins, true) +
    '<div class="page">' +
      '<div class="shop-header">' +
        '<div>' +
          '<div class="shop-balance-label">Mening coinlarim</div>' +
          '<div class="shop-balance-num coin-number" id="dokonBalance">' + coins + ' 🪙</div>' +
        '</div>' +
        '<div style="font-size:2.5rem">🛍</div>' +
      '</div>' +
      notifBanner +
      '<div class="shop-grid" id="rewardsGrid">' + rewardsHTML + '</div>' +
    '</div>'
}

export function initDokonView() {
  document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const rid   = btn.dataset.rid
      const name  = btn.dataset.name
      const price = parseInt(btn.dataset.price, 10)

      if (!confirm('"' + name + '" ni ' + price + ' 🪙 ga sotib olasizmi?')) return

      btn.disabled = true
      btn.textContent = '...'

      // 1. So'rov yuborish
      const { error } = await supabase.from('purchase_requests').insert({
        student_id: (await supabase.auth.getUser()).data.user?.id,
        reward_id: rid
      })

      if (error) {
        toastError('Xato: ' + error.message)
        btn.disabled = false
        btn.textContent = 'Sotib olish'
        return
      }

      // 2. UI yangilash
      btn.className = 'shop-btn shop-btn-pending'
      btn.textContent = '⏳ Kutilmoqda'
      toastSuccess('"' + name + '" uchun so\'rov yuborildi! O\'qituvchi tasdiqlaydi.')
    })
  })
}
