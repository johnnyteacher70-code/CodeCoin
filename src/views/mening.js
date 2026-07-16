// src/views/mening.js — Student bosh sahifasi
import { supabase } from '../lib/supabase.js'
import { getLevel, getLevelProgress } from '../lib/levels.js'
import { buildStudentNav } from './nav.js'

export async function meningView(currentProfile) {
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentProfile.id).single()
  const p = profile ?? currentProfile
  const coins = p.coins ?? 0
  const level = getLevel(coins)
  const { percent, nextLevel, coinsLeft } = getLevelProgress(coins)

  const [{ data: txsRaw }, { data: myGroupData }] = await Promise.all([
    supabase.from('transactions').select('*, creator:created_by(full_name)')
      .eq('student_id', p.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('group_members').select('group_id, groups(name)').eq('student_id', p.id).maybeSingle()
  ])
  const txs = txsRaw
  const myGroupName = myGroupData?.groups?.name ?? null

  // Reytingdagi o'rni
  const { data: allStudents } = await supabase.from('profiles').select('id, full_name, coins').eq('role', 'student').order('coins', { ascending: false })
  const myRank = (allStudents ?? []).findIndex(s => s.id === p.id) + 1
  const totalStudents = allStudents?.length ?? 0

  const initials = p.full_name.split(' ').map(w => w[0]??'').join('').toUpperCase().slice(0,2)

  // Haftalik coin
  const { data: weekTx } = await supabase.from('transactions')
    .select('amount').eq('student_id', p.id)
    .gte('created_at', new Date(Date.now() - 7*24*60*60*1000).toISOString())
  const weekCoins = (weekTx ?? []).filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0)

  // Oylik coin
  const { data: monthTx } = await supabase.from('transactions')
    .select('amount').eq('student_id', p.id)
    .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
  const monthCoins = (monthTx ?? []).filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0)

  const txHTML = (txs && txs.length > 0) ? txs.slice(0, 6).map(tx => {
    const isPlus = tx.amount > 0
    const date = new Date(tx.created_at).toLocaleString('uz-UZ', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
    return `
      <div class="tx-item">
        <div class="tx-icon ${isPlus ? 'plus' : 'minus'}">${isPlus ? '↑' : '↓'}</div>
        <div class="tx-body">
          <div class="tx-reason">${escHtml(tx.reason || '—')}</div>
          <div class="tx-date">${date}</div>
        </div>
        <div class="tx-amount ${isPlus ? 'plus' : 'minus'}">${isPlus ? '+' : ''}${tx.amount}</div>
      </div>
    `
  }).join('') : `
    <div class="empty-state" style="padding:32px 16px">
      <div class="empty-state-icon">🪙</div>
      <div class="empty-state-title">Hali tranzaksiyalar yo'q</div>
      <div class="empty-state-sub">O'qituvchi coin berganida bu yerda ko'rinadi.</div>
    </div>`

  // Mini reyting (guruh)
  const miniRank = (allStudents ?? []).slice(0, 4).map((s, i) => {
    const isCurrent = s.id === p.id
    const av = s.full_name.split(' ').map(w=>w[0]??'').join('').toUpperCase().slice(0,2)
    const avClass = i===0?'av-1':i===1?'av-2':i===2?'av-3':''
    return `
      <div class="rank-row${isCurrent ? ' my-row' : ''}">
        <div class="rank-num">#${i+1}</div>
        <div class="rank-avatar ${avClass}" style="width:36px;height:36px;font-size:0.8rem">${av}</div>
        <div class="rank-info"><div class="rank-name" style="font-size:0.85rem">${escHtml(s.full_name)}</div></div>
        <div class="rank-coins" style="font-size:0.88rem">${s.coins}</div>
      </div>
    `
  }).join('')

  return `
    ${buildStudentNav(p, '/mening', coins, !!myGroupName)}
    <div class="page" style="max-width:800px">

      ${!myGroupName ? `
      <div class="pending-banner">
        <div class="pending-banner-icon">⏳</div>
        <div class="pending-banner-body">
          <div class="pending-banner-title">Guruhga qo'shilish kutilmoqda</div>
          <div class="pending-banner-sub">Siz tez orada o'qituvchi tomonidan guruhga qo'shilasiz. Biroz kuting.</div>
        </div>
      </div>` : `
      <div class="group-banner">
        <span>👥</span>
        <span>Guruhingiz: <strong>${myGroupName}</strong></span>
      </div>`}

      <!-- Hero card -->
      <div class="student-hero">
        <div class="student-hero-top">
          <div class="student-hero-avatar">${initials}</div>
          <div>
            <div class="student-hero-name">${escHtml(p.full_name)}</div>
            <div class="student-hero-sub">${level.emoji} ${level.name} daraja</div>
          </div>
          <div class="student-hero-right" style="display:flex;align-items:center;gap:0">
            <div style="text-align:center;padding:0 16px">
              <div class="student-hero-coins coin-number" id="myCoinsNum">${coins}</div>
              <div class="student-hero-coins-label">Jami coin</div>
            </div>
            <div class="hero-divider"></div>
            <div style="text-align:center;padding:0 16px">
              <div class="student-hero-rank">#${myRank}</div>
              <div class="student-hero-rank-label">O'rnim</div>
            </div>
          </div>
        </div>
        <div class="student-hero-level">${level.name} daraja · ${coins} / ${nextLevel ? nextLevel.min : coins} coin</div>
        <div class="student-hero-progress-wrap">
          <div class="student-hero-progress-bar" style="width:${percent}%"></div>
        </div>
        <div class="student-hero-progress-label">
          <span>${coins} coin</span>
          <span>${nextLevel ? `${nextLevel.name}: ${nextLevel.min}` : 'Eng yuqori!'}</span>
        </div>
      </div>

      <!-- Mini statistika -->
      <div class="mini-stats">
        <div class="mini-stat">
          <div class="mini-stat-icon stat-icon-green" style="background:var(--green-light)">📈</div>
          <div class="mini-stat-value">+${weekCoins}</div>
          <div class="mini-stat-label">Shu hafta</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-icon stat-icon-blue" style="background:var(--blue-light)">📅</div>
          <div class="mini-stat-value">+${monthCoins}</div>
          <div class="mini-stat-label">Shu oy</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-icon stat-icon-gold" style="background:var(--gold-light)">🏆</div>
          <div class="mini-stat-value">#${myRank}</div>
          <div class="mini-stat-label">Umumiy rank</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-icon" style="background:var(--red-light)">⭐</div>
          <div class="mini-stat-value">${level.name}</div>
          <div class="mini-stat-label">Daraja</div>
        </div>
      </div>

      <!-- Ikki ustun: tarix + mini reyting -->
      <div style="display:grid;grid-template-columns:1fr;gap:16px">
        <div class="card">
          <div class="card-title">Coin tarixi</div>
          <div class="tx-list">${txHTML}</div>
        </div>
        ${myGroupName ? (
          '<div class="card">' +
          '<div class="card-title">Guruh reytingi' +
          '<a class="card-link" href="#" data-route="/reyting">Barchasi →</a>' +
          '</div>' +
          '<div class="rank-list">' + miniRank + '</div>' +
          '</div>'
        ) : ''}
      </div>
    </div>
  `
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
