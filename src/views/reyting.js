// src/views/reyting.js
import { supabase } from '../lib/supabase.js'
import { getLevel, getLevelProgress } from '../lib/levels.js'
import { buildTeacherNav, buildStudentNav } from './nav.js'
export async function reytingView(currentProfile) {
  const isTeacher = currentProfile?.role === 'teacher'

  const nav = isTeacher
    ? buildTeacherNav(currentProfile, '/reyting')
    : buildStudentNav(currentProfile, '/reyting', currentProfile.coins)

  // Fetch data
  const { data: profiles } = await supabase
    .from('profiles').select('id, full_name, coins, role')
    .order('coins', { ascending: false })

  const students = (profiles ?? []).filter(p => p.role === 'student')
  const top3 = students.slice(0, 3)

  function podiumItem(s, rank) {
    if (!s) return `<div class="podium-item p${rank}"></div>`
    const initials = s.full_name.split(' ').map(w=>w[0]??'').join('').toUpperCase().slice(0,2)
    const avClass = rank === 1 ? 'av-1' : rank === 2 ? 'av-2' : 'av-3'
    return `
      <div class="podium-item p${rank}">
        <div class="rank-avatar ${avClass}" style="width:${rank===1?64:rank===2?52:48}px;height:${rank===1?64:rank===2?52:48}px;font-size:${rank===1?'1.3rem':rank===2?'1.1rem':'1rem'}">
          ${rank === 1 ? '<span class="podium-crown">👑</span>' : ''}${initials}
        </div>
        <div class="podium-name">${escHtml(s.full_name)}</div>
        <div class="podium-coins">${s.coins} 🪙</div>
        <div class="podium-stand">${rank===2?'🥈':rank===3?'🥉':''}</div>
      </div>
    `
  }

  const rowsHTML = students.map((s, i) => {
    const rank = i + 1
    const level = getLevel(s.coins)
    const { percent, nextLevel, coinsLeft } = getLevelProgress(s.coins)
    const isMe = currentProfile?.id === s.id
    const initials = s.full_name.split(' ').map(w=>w[0]??'').join('').toUpperCase().slice(0,2)
    const avClass = rank===1?'av-1':rank===2?'av-2':rank===3?'av-3':''
    const rankDisp = rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':rank

    return `
      <div class="rank-row${isMe?' my-row':''}${rank===1?' top-1':''}">
        <div class="rank-num">${rankDisp}</div>
        <div class="rank-avatar ${avClass}">${initials}</div>
        <div class="rank-info">
          <div class="rank-name">${escHtml(s.full_name)}${isMe ? ' <span style="color:var(--blue);font-size:0.72em">(siz)</span>' : ''}</div>
          <div class="flex items-center gap-2" style="margin-top:4px">
            <span class="badge ${level.badge}">${level.emoji} ${level.name}</span>
            <div class="progress-wrap" style="max-width:100px"><div class="progress-bar" style="width:${percent}%"></div></div>
            <span style="font-size:0.72rem;color:var(--text-3)">${nextLevel ? `${coinsLeft} qoldi` : 'MAX'}</span>
          </div>
        </div>
        <div class="rank-coins coin-number">${s.coins}</div>
      </div>
    `
  }).join('')

  const content = students.length === 0
    ? `<div class="${isTeacher ? 'teacher-main' : 'page'}" style="max-width:760px">
        <div class="page-title">🏆 Reyting</div>
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">🎓</div>
            <div class="empty-state-title">Hali o'quvchilar yo'q</div>
            <div class="empty-state-sub">Admin paneldan o'quvchilar qo'shing.</div>
          </div>
        </div>
      </div>`
    : `<div class="${isTeacher ? 'teacher-main' : 'page'}" style="max-width:760px">
        <div class="page-title">🏆 Reyting</div>
        <div class="card mb-5">
          <div class="podium">${podiumItem(top3[1]??null,2)}${podiumItem(top3[0]??null,1)}${podiumItem(top3[2]??null,3)}</div>
        </div>
        <div class="card"><div class="rank-list">${rowsHTML}</div></div>
      </div>`

  return nav + content
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
