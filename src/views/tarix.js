// src/views/tarix.js
import { supabase } from '../lib/supabase.js'
import { navigate } from '../lib/router.js'
import { buildTeacherNav } from './nav.js'

export async function tarixView(currentProfile) {
  if (currentProfile?.role !== 'teacher') { navigate('/mening'); return '' }

  const { data: txs } = await supabase
    .from('transactions')
    .select('*, student:student_id(full_name), creator:created_by(full_name)')
    .order('created_at', { ascending: false }).limit(200)

  const totalPlus  = (txs??[]).filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0)
  const totalMinus = Math.abs((txs??[]).filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0))

  const rows = (txs??[]).map(tx => {
    const isPlus = tx.amount > 0
    const date = new Date(tx.created_at).toLocaleString('uz-UZ', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
    return `
      <tr>
        <td style="color:var(--text-2);white-space:nowrap">${date}</td>
        <td style="font-weight:600">${escHtml(tx.student?.full_name ?? '—')}</td>
        <td style="font-weight:700;color:${isPlus?'var(--green)':'var(--red)'};font-variant-numeric:tabular-nums">
          ${isPlus?'+':''}${tx.amount} 🪙
        </td>
        <td>${escHtml(tx.reason || '—')}</td>
        <td style="color:var(--text-3)">${escHtml(tx.creator?.full_name ?? 'Tizim')}</td>
      </tr>
    `
  }).join('')

  const emptyRows = `
    <tr>
      <td colspan="5">
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">Hali operatsiyalar yo'q</div>
          <div class="empty-state-sub">Coin berganda bu yerda ko'rinadi.</div>
        </div>
      </td>
    </tr>
  `

  return `
    ${buildTeacherNav(currentProfile, '/tarix')}
    <div class="teacher-main">
      <div class="page-title">Coin Tarixi</div>

      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card">
          <div class="stat-card-head"><span class="stat-card-label">Jami berilgan</span><div class="stat-card-icon stat-icon-green">📈</div></div>
          <div class="stat-card-num" style="color:var(--green)">+${totalPlus.toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-head"><span class="stat-card-label">Jami ayirilgan</span><div class="stat-card-icon stat-icon-red">📉</div></div>
          <div class="stat-card-num" style="color:var(--red)">-${totalMinus.toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-head"><span class="stat-card-label">Jami operatsiyalar</span><div class="stat-card-icon stat-icon-blue">📋</div></div>
          <div class="stat-card-num">${(txs??[]).length}</div>
        </div>
      </div>

      <div class="card" style="padding:0;overflow:hidden">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sana</th><th>O'quvchi</th><th>Miqdor</th><th>Sabab</th><th>Bergan</th>
              </tr>
            </thead>
            <tbody>
              ${rows || emptyRows}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
