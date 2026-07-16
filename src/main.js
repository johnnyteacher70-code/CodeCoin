// src/main.js — TangaLab kirish nuqtasi
import { supabase } from './lib/supabase.js'
import { register, navigate, startRouter } from './lib/router.js'
import { getSessionAndProfile, getProfile } from './auth/auth.js'

import { loginView, initLoginView }   from './views/login.js'
import { dashboardView }              from './views/dashboard.js'
import { reytingView }                from './views/reyting.js'
import { meningView }                 from './views/mening.js'
import { dokonView, initDokonView }   from './views/dokon.js'
import { adminView, initAdminView }   from './views/admin.js'
import { guruhlarView, initGuruhlarView } from './views/guruhlar.js'
import { yangiOquvchiView, initYangiOquvchiView } from './views/yangi-oquvchi.js'
import { tarixView }                  from './views/tarix.js'
import { initNav }                    from './views/nav.js'

let currentProfile = null

async function requireAuth(viewFn, ...args) {
  if (!currentProfile) {
    const result = await getSessionAndProfile()
    if (!result) { navigate('/login'); return '' }
    currentProfile = result.profile
  }
  return viewFn(currentProfile, ...args)
}

// ─── Routes ──────────────────────────────────────────────────
register('/login', async () => {
  const result = await getSessionAndProfile()
  if (result) {
    currentProfile = result.profile
    navigate(result.profile?.role === 'teacher' ? '/dashboard' : '/mening', false)
    return ''
  }
  const html = await loginView()
  setTimeout(() => initLoginView(), 0)
  return html
})

register('/dashboard', async () => {
  const html = await requireAuth(dashboardView)
  setTimeout(() => {
    initNav()
    // Purchase so'rovlarini tasdiqlash/rad etish
    document.querySelectorAll('.purch-approve').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true
        const row = btn.closest('.purch-req-row')
        const rid = btn.dataset.id
        const sid = row?.dataset.sid
        const price = parseInt(row?.dataset.price || '0', 10)
        // 1. Status yangilash
        await supabase.from('purchase_requests').update({ status: 'approved', resolved_at: new Date().toISOString() }).eq('id', rid)
        // 2. Coinni ayirish
        if (sid && price > 0) {
          await supabase.from('transactions').insert({ student_id: sid, amount: -price, reason: 'Market xaridi tasdiqlandi', type: 'purchase', created_by: currentProfile.id })
        }
        row?.remove()
        if (!document.querySelector('.purch-req-row')) document.getElementById('purchReqList')?.closest('.card')?.remove()
      })
    })
    document.querySelectorAll('.purch-reject').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true
        const row = btn.closest('.purch-req-row')
        await supabase.from('purchase_requests').update({ status: 'rejected', resolved_at: new Date().toISOString() }).eq('id', btn.dataset.id)
        row?.remove()
        if (!document.querySelector('.purch-req-row')) document.getElementById('purchReqList')?.closest('.card')?.remove()
      })
    })
  }, 0)
  return html
})

register('/reyting', async () => {
  if (currentProfile?.role === 'student') {
    const { data: gm } = await supabase.from('group_members').select('id').eq('student_id', currentProfile.id).maybeSingle()
    if (!gm) { navigate('/mening'); return '' }
  }
  const html = await requireAuth(reytingView)
  setTimeout(() => initNav(), 0)
  return html
})

register('/mening', async () => {
  const html = await requireAuth(meningView)
  setTimeout(() => initNav(), 0)
  return html
})

register('/dokon', async () => {
  if (currentProfile?.role === 'student') {
    const { data: gm } = await supabase.from('group_members').select('id').eq('student_id', currentProfile.id).maybeSingle()
    if (!gm) { navigate('/mening'); return '' }
  }
  const html = await requireAuth(dokonView)
  setTimeout(() => { initNav(); initDokonView() }, 0)
  return html
})

register('/guruhlar', async () => {
  const html = await requireAuth(guruhlarView)
  setTimeout(() => { initNav(); initGuruhlarView(currentProfile) }, 0)
  return html
})

register('/yangi-oquvchi', async () => {
  const html = await requireAuth(yangiOquvchiView)
  setTimeout(() => { initNav(); initYangiOquvchiView(currentProfile) }, 0)
  return html
})

register('/admin', async () => {
  const html = await requireAuth(adminView)
  setTimeout(() => { initNav(); initAdminView(currentProfile) }, 0)
  return html
})

register('/tarix', async () => {
  const html = await requireAuth(tarixView)
  setTimeout(() => initNav(), 0)
  return html
})

// ─── Realtime: coins o'zgarganda count-up ────────────────────
supabase.channel('profiles-coins')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
    if (currentProfile && payload.new.id === currentProfile.id) {
      animateCountUp(currentProfile.coins, payload.new.coins)
      currentProfile.coins = payload.new.coins
    }
  })
  .subscribe()

function animateCountUp(from, to) {
  const els = document.querySelectorAll('.coin-number, #myCoinsNum, #navCoins, #dokonBalance')
  if (!els.length || from === to) return
  const dur = 600, start = performance.now(), diff = to - from
  const step = now => {
    const p = Math.min((now - start) / dur, 1)
    const val = Math.round(from + diff * (1 - Math.pow(1-p, 3)))
    els.forEach(el => { el.textContent = val; if (p === 1) el.classList.add('coin-flash') })
    if (p < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}



startRouter()
