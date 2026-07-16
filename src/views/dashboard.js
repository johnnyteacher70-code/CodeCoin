// src/views/dashboard.js — Teacher dashboard (bosh sahifa)
import { supabase } from '../lib/supabase.js'
import { navigate } from '../lib/router.js'
import { buildTeacherNav } from './nav.js'

export async function dashboardView(currentProfile) {
  if (currentProfile?.role !== 'teacher') { navigate('/mening'); return '' }

  // Statistika
  const [{ data: students }, { data: txToday }, { data: txWeek }, { data: gm }, { data: purchReqs }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, coins').eq('role', 'student').order('coins', { ascending: false }),
    supabase.from('transactions').select('amount').gte('created_at', new Date().toISOString().slice(0,10)),
    supabase.from('transactions').select('amount').gte('created_at', new Date(Date.now() - 7*24*60*60*1000).toISOString()),
    supabase.from('group_members').select('student_id'),
    supabase.from('purchase_requests').select('id,status,created_at,student:student_id(full_name),reward:reward_id(name,emoji,price)').eq('status','pending').order('created_at', { ascending: false })
  ])
  const inGroupIds = new Set((gm??[]).map(m=>m.student_id))
  const newStudents = (students??[]).filter(s=>!inGroupIds.has(s.id))

  const totalStudents = students?.length ?? 0
  const todayCoins = (txToday ?? []).filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0)
  const weekCoins  = (txWeek ?? []).filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0)

  const topStudents = (students ?? []).slice(0, 5)
  const today = new Date().toLocaleDateString('uz-UZ', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  const topHTML = topStudents.map((s, i) => {
    const avClass = i === 0 ? 'av-1' : i === 1 ? 'av-2' : i === 2 ? 'av-3' : ''
    const initials = s.full_name.split(' ').map(w => w[0]??'').join('').toUpperCase().slice(0,2)
    return `
      <div class="rank-row">
        <div class="rank-num">#${i+1}</div>
        <div class="rank-avatar ${avClass}">${initials}</div>
        <div class="rank-info">
          <div class="rank-name">${escHtml(s.full_name)}</div>
        </div>
        <div class="rank-coins">${s.coins} 🪙</div>
      </div>
    `
  }).join('')

  return `
    ${buildTeacherNav(currentProfile, '/dashboard')}
    <div class="teacher-main">
      <div style="margin-bottom:24px">
        <h1 style="font-size:1.6rem;font-weight:800;color:var(--text);letter-spacing:-0.02em">
          Xayrli kun, ${escHtml(currentProfile.full_name.split(' ')[0])}!
        </h1>
        <div style="color:var(--text-2);font-size:0.88rem;margin-top:4px;text-transform:capitalize">${today}</div>
      </div>

      <!-- Statistika kartalar -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-head">
            <span class="stat-card-label">Jami O'quvchilar</span>
            <div class="stat-card-icon stat-icon-blue">👤</div>
          </div>
          <div class="stat-card-num">${totalStudents}</div>
          <div class="stat-card-change up">Faol o'quvchilar</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-head">
            <span class="stat-card-label">Bugun berilgan coin</span>
            <div class="stat-card-icon stat-icon-gold">🪙</div>
          </div>
          <div class="stat-card-num">${todayCoins}</div>
          <div class="stat-card-change up">Bugungi operatsiyalar</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-head">
            <span class="stat-card-label">Shu hafta berilgan</span>
            <div class="stat-card-icon stat-icon-green">📈</div>
          </div>
          <div class="stat-card-num">${weekCoins.toLocaleString()}</div>
          <div class="stat-card-change up">+18% o'tgan haftaga</div>
        </div>
      </div>

      <!-- Eng faol o'quvchilar -->
      <div class="card">
        <div class="card-title">
          Eng faol o'quvchilar
          <a class="card-link" href="#" data-route="/reyting">Barchasi →</a>
        </div>
        <div class="rank-list">
          ${topHTML || '<p class="text-muted text-center">Hali o\'quvchilar yo\'q.</p>'}
        </div>
      </div>

      ${newStudents.length > 0 ? `
      <div class="card" style="margin-top:20px;border:2px solid var(--primary);border-opacity:0.3">
        <div class="card-title" style="display:flex;align-items:center;gap:8px">
          <span style="background:var(--primary);color:#fff;font-size:.72rem;font-weight:700;padding:2px 8px;border-radius:20px">${newStudents.length} YANGI</span>
          Guruhga qo'shilmagan o'quvchilar
          <a class="card-link" href="#" data-route="/guruhlar" style="margin-left:auto">Guruhga qo'shish →</a>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${newStudents.slice(0,5).map(s => {
            const av = s.full_name.split(' ').map(w=>w[0]??'').join('').toUpperCase().slice(0,2)
            return '<div class="rank-row" style="background:var(--surface-2);border-radius:8px;padding:8px 12px">' +
              '<div class="rank-avatar" style="background:var(--primary);width:32px;height:32px;font-size:.72rem">' + av + '</div>' +
              '<div class="rank-info"><div class="rank-name">' + escHtml(s.full_name) + '</div></div>' +
              '<span style="font-size:.75rem;color:var(--primary);font-weight:600;background:rgba(99,102,241,.1);padding:2px 8px;border-radius:12px">Yangi</span>' +
              '</div>'
          }).join('')}
        </div>
      </div>` : ''}
        ${(purchReqs??[]).length > 0 ? (
          '<div class="card" style="margin-top:20px;border:2px solid #6366F133">' +
          '<div class="card-title" style="display:flex;align-items:center;gap:8px">' +
            '<span style="background:#6366F1;color:#fff;font-size:.72rem;font-weight:700;padding:2px 8px;border-radius:20px">' + (purchReqs??[]).length + ' SO\'ROV</span>' +
            'Xarid so\'rovlari' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:8px" id="purchReqList">' +
            (purchReqs??[]).map(r =>
              '<div class="purch-req-row" data-id="' + r.id + '" data-sid="' + (r.student?.id||'') + '" data-price="' + (r.reward?.price||0) + '">' +
                '<div class="purch-req-emoji">' + esc(r.reward?.emoji||'🎁') + '</div>' +
                '<div class="purch-req-info">' +
                  '<div class="purch-req-name">' + escHtml(r.student?.full_name||'—') + '</div>' +
                  '<div class="purch-req-item">' + escHtml(r.reward?.name||'—') + ' · ' + (r.reward?.price||0) + ' 🪙</div>' +
                '</div>' +
                '<div class="purch-req-btns">' +
                  '<button class="purch-approve" data-id="' + r.id + '">✓ Tasdiqlash</button>' +
                  '<button class="purch-reject"  data-id="' + r.id + '">✕ Rad</button>' +
                '</div>' +
              '</div>'
            ).join('') +
          '</div>' +
          '</div>'
        ) : ''}
    </div>
  `
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
