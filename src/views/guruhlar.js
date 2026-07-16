// src/views/guruhlar.js
import { supabase } from '../lib/supabase.js'
import { navigate } from '../lib/router.js'
import { buildTeacherNav } from './nav.js'
import { toastSuccess, toastError } from '../lib/toast.js'

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }
function ini(name) { return String(name).split(' ').map(w=>w[0]||'').join('').toUpperCase().slice(0,2) }

const GRADS = [
  'linear-gradient(135deg,#6366F1,#8B5CF6)',
  'linear-gradient(135deg,#F59E0B,#EF4444)',
  'linear-gradient(135deg,#10B981,#3B82F6)',
  'linear-gradient(135deg,#EC4899,#8B5CF6)',
  'linear-gradient(135deg,#F97316,#F59E0B)',
  'linear-gradient(135deg,#3B82F6,#06B6D4)',
]
function grad(id) { let h=0; for(let c of String(id)){h=(h*31+c.charCodeAt(0))%GRADS.length} return GRADS[h] }
function solidColor(id) {
  const colors=['#6366F1','#F59E0B','#10B981','#EC4899','#F97316','#3B82F6']
  let h=0; for(let c of String(id)){h=(h*31+c.charCodeAt(0))%colors.length} return colors[h]
}

export async function guruhlarView(profile) {
  if (profile?.role !== 'teacher') { navigate('/mening'); return '' }

  const [{ data: students },{ data: groups },{ data: gm }] = await Promise.all([
    supabase.from('profiles').select('id,full_name,coins').eq('role','student').order('full_name'),
    supabase.from('groups').select('*').order('name'),
    supabase.from('group_members').select('group_id,student_id')
  ])

  const memberMap={}, sgMap={}
  ;(gm??[]).forEach(m=>{ if(!memberMap[m.group_id])memberMap[m.group_id]=[]; memberMap[m.group_id].push(m.student_id); sgMap[m.student_id]=m.group_id })

  const totalStudents  = (students??[]).length
  const totalGroups    = (groups??[]).length
  const ungroupedCount = (students??[]).filter(s=>!sgMap[s.id]).length
  const totalCoins     = (students??[]).reduce((a,s)=>a+(s.coins||0),0)

  // ── Group cards ──────────────────────────────────────────────────────
  const groupCards = (groups??[]).map((g,idx) => {
    const mIds      = memberMap[g.id] ?? []
    const gStudents = (students??[]).filter(s=>mIds.includes(s.id))
    const ungrp     = (students??[]).filter(s=>!sgMap[s.id])
    const g_color   = solidColor(g.id)
    const g_grad    = grad(g.id)
    const avgCoins  = gStudents.length ? Math.round(gStudents.reduce((a,s)=>a+(s.coins||0),0)/gStudents.length) : 0
    const maxCoins  = Math.max(...(students??[]).map(s=>s.coins||0), 1)
    const fillPct   = Math.min(100, Math.round(avgCoins/maxCoins*100))

    // Member rows (inside expanded panel)
    const memberRows = gStudents.length === 0
      ? '<div class="gc-empty">Hali o\'quvchi qo\'shilmagan</div>'
      : gStudents.map(s =>
          '<div class="gc-member-row">' +
          '<div class="gc-member-av" style="background:'+g_color+'22;color:'+g_color+'">' + ini(s.full_name) + '</div>' +
          '<span class="gc-member-name">' + esc(s.full_name) + '</span>' +
          '<span class="gc-member-coin">' + (s.coins||0) + ' 🪙</span>' +
          '<button class="gc-icon-btn remove-from-group" data-sid="'+s.id+'" data-gid="'+g.id+'" title="Guruhdan chiqarish" style="color:#94A3B8">−</button>' +
          '<button class="gc-icon-btn del-stu" data-id="'+s.id+'" data-name="'+esc(s.full_name)+'" title="O\'chirish" style="color:#EF4444">🗑</button>' +
          '</div>'
        ).join('')

    const addRow = ungrp.length > 0
      ? '<div class="gc-add-row">' +
          '<select class="gc-add-select add-stu-sel" data-gid="'+g.id+'">' +
            '<option value="">O\'quvchi tanlang...</option>' +
            ungrp.map(s=>'<option value="'+s.id+'">'+esc(s.full_name)+'</option>').join('') +
          '</select>' +
          '<button class="gc-add-btn add-to-grp" data-gid="'+g.id+'" style="background:'+g_color+'">+ Qo\'shish</button>' +
        '</div>'
      : '<p class="gc-all-grouped">✓ Barcha o\'quvchilar guruhlarda</p>'

    return '<div class="gc-card" data-gid="'+g.id+'">' +

      // Banner top
      '<div class="gc-banner" style="background:'+g_grad+'">' +
        '<div class="gc-banner-pattern"></div>' +
        '<div class="gc-banner-tag">' + (idx+1) + '-guruh</div>' +
        '<div class="gc-banner-icon">👥</div>' +
        '<div class="gc-banner-rating" style="background:'+g_color+'">★ Faol</div>' +
      '</div>' +

      // Card body
      '<div class="gc-body">' +
        '<div class="gc-body-head">' +
          '<div class="gc-title">'+esc(g.name)+'</div>' +
          '<span class="gc-status-badge" style="color:'+g_color+';background:'+g_color+'18">Faol</span>' +
        '</div>' +
        '<div class="gc-meta">' +
          '<span>👤 '+mIds.length+' o\'quvchi</span>' +
          '<span>🪙 '+avgCoins+' o\'rtacha</span>' +
        '</div>' +
        '<div class="gc-progress-label">' +
          '<span>O\'rtacha coin</span>' +
          '<span style="color:'+g_color+';font-weight:700">'+fillPct+'%</span>' +
        '</div>' +
        '<div class="gc-progress-track">' +
          '<div class="gc-progress-fill" style="width:'+fillPct+'%;background:'+g_grad+'"></div>' +
        '</div>' +

        // Action buttons
        '<div class="gc-actions">' +
          '<button class="gc-main-btn gc-manage-btn" data-gid="'+g.id+'" style="background:'+g_grad+'">⊞ Boshqarish</button>' +
          '<button class="gc-sq-btn gc-rename-btn" data-gid="'+g.id+'" data-name="'+esc(g.name)+'" title="Nomini o\'zgartirish">✏</button>' +
          '<button class="gc-sq-btn del-grp" data-id="'+g.id+'" title="Guruhni o\'chirish" style="color:#EF4444">🗑</button>' +
        '</div>' +

        // Expandable manage panel (hidden by default)
        '<div class="gc-panel" id="panel-'+g.id+'" style="display:none">' +
          '<div class="gc-panel-members">'+memberRows+'</div>' +
          addRow +
        '</div>' +
      '</div>' +
    '</div>'
  }).join('')

  const emptyState = '<div class="gc-zero">' +
    '<div style="font-size:3.5rem;margin-bottom:12px">👥</div>' +
    '<div style="font-weight:700;font-size:1.1rem;margin-bottom:6px">Hali guruh yo\'q</div>' +
    '<div style="color:#94A3B8;font-size:.88rem">Yuqoridagi "+ Guruh qo\'shish" tugmasidan boshlang</div>' +
  '</div>'

  // ── Ungrouped sidebar ────────────────────────────────────────────────
  const ungrpd = (students??[]).filter(s=>!sgMap[s.id])
  const ungrpdHTML = ungrpd.length === 0
    ? '<div class="gc-empty" style="text-align:center;padding:16px">✓ Hammasi guruhlarda</div>'
    : ungrpd.map(s =>
        '<div class="gc-member-row">' +
        '<div class="gc-member-av" style="background:#FEF3C7;color:#D97706">'+ini(s.full_name)+'</div>' +
        '<span class="gc-member-name">'+esc(s.full_name)+'</span>' +
        '<span style="font-size:.68rem;background:#FEF3C7;color:#92400E;padding:2px 7px;border-radius:20px;font-weight:700">Yangi</span>' +
        '<button class="gc-icon-btn del-stu" data-id="'+s.id+'" data-name="'+esc(s.full_name)+'" style="color:#EF4444">🗑</button>' +
        '</div>'
      ).join('')

  return buildTeacherNav(profile, '/guruhlar') +
    '<div class="teacher-main" style="max-width:1100px">' +

      // Header
      '<div class="gc-page-header">' +
        '<div>' +
          '<h1 class="gc-page-title">Guruhlarim</h1>' +
          '<p class="gc-page-sub">'+totalGroups+' ta guruh · '+totalStudents+' o\'quvchi · '+totalCoins+' jami coin</p>' +
        '</div>' +
        '<button class="btn btn-primary gc-new-btn" id="showNewGroupForm">+ Guruh qo\'shish</button>' +
      '</div>' +

      // New group form (hidden modal-like)
      '<div class="gc-new-form" id="newGroupForm" style="display:none">' +
        '<form id="newGrpForm" style="display:flex;gap:10px;align-items:center">' +
          '<input class="form-input" id="grpName" type="text" placeholder="Guruh nomi: 1-guruh, A-sinf..." autocomplete="off" style="flex:1;max-width:320px">' +
          '<button type="submit" class="btn btn-primary" id="btnNewGrp">Yaratish</button>' +
          '<button type="button" class="btn btn-ghost" id="hideNewGroupForm">Bekor</button>' +
        '</form>' +
      '</div>' +

      // Layout
      '<div class="gc-layout">' +

        // Main grid
        '<div class="gc-grid-wrap">' +
          '<div class="gc-grid" id="groupsList">' +
            (groupCards || emptyState) +
          '</div>' +
        '</div>' +

        // Sidebar
        '<div class="gc-sidebar">' +
          '<div class="gc-sidebar-box">' +
            '<div class="gc-sidebar-title">' +
              'Guruhsiz o\'quvchilar' +
              (ungroupedCount > 0 ? '<span class="gc-ungrp-badge">'+ungroupedCount+'</span>' : '') +
            '</div>' +
            ungrpdHTML +
          '</div>' +
        '</div>' +

      '</div>' +
    '</div>'
}

export function initGuruhlarView(profile) {
  // Toggle new group form
  document.getElementById('showNewGroupForm')?.addEventListener('click', () => {
    const f = document.getElementById('newGroupForm')
    f.style.display = f.style.display === 'none' ? 'block' : 'none'
    document.getElementById('grpName')?.focus()
  })
  document.getElementById('hideNewGroupForm')?.addEventListener('click', () => {
    document.getElementById('newGroupForm').style.display = 'none'
  })

  // Create group
  document.getElementById('newGrpForm')?.addEventListener('submit', async e => {
    e.preventDefault()
    const name = document.getElementById('grpName').value.trim()
    if (!name) return
    const btn = document.getElementById('btnNewGrp')
    btn.disabled = true; btn.textContent = '...'
    const { error } = await supabase.from('groups').insert({ name, teacher_id: profile.id })
    btn.disabled = false; btn.textContent = 'Yaratish'
    if (error) { toastError('Xato: ' + error.message); return }
    toastSuccess('"' + name + '" guruhi yaratildi!')
    navigate('/guruhlar')
  })

  // Boshqarish — toggle expand panel
  document.querySelectorAll('.gc-manage-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = document.getElementById('panel-' + btn.dataset.gid)
      if (!panel) return
      const open = panel.style.display !== 'none'
      panel.style.display = open ? 'none' : 'block'
      btn.textContent = open ? '⊞ Boshqarish' : '✕ Yopish'
    })
  })

  // Rename group
  document.querySelectorAll('.gc-rename-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const newName = prompt("Yangi guruh nomi:", btn.dataset.name)
      if (!newName || !newName.trim()) return
      const { error } = await supabase.from('groups').update({ name: newName.trim() }).eq('id', btn.dataset.gid)
      if (error) { toastError("Xato: " + error.message); return }
      toastSuccess('Guruh nomi o\'zgartirildi.')
      navigate('/guruhlar')
    })
  })

  // Add student to group
  document.querySelectorAll('.add-to-grp').forEach(btn => {
    btn.addEventListener('click', async () => {
      const gid = btn.dataset.gid
      const sel = document.querySelector('.add-stu-sel[data-gid="' + gid + '"]')
      const sid = sel?.value
      if (!sid) { toastError("O'quvchi tanlanmagan."); return }
      btn.disabled = true; btn.textContent = '...'
      const { error } = await supabase.from('group_members').insert({ group_id: gid, student_id: sid })
      btn.disabled = false; btn.textContent = "+ Qo'shish"
      if (error) { toastError('Xato: ' + error.message); return }
      toastSuccess("O'quvchi guruhga qo'shildi!")
      navigate('/guruhlar')
    })
  })

  // Remove from group
  document.querySelectorAll('.remove-from-group').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true
      const { error } = await supabase.from('group_members').delete()
        .eq('group_id', btn.dataset.gid).eq('student_id', btn.dataset.sid)
      if (error) { toastError('Xato!'); btn.disabled = false; return }
      toastSuccess("O'quvchi guruhdan chiqarildi.")
      navigate('/guruhlar')
    })
  })

  // Delete group
  document.querySelectorAll('.del-grp').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm("Guruhni o'chirasizmi? O'quvchilar o'chirilmaydi.")) return
      const { error } = await supabase.from('groups').delete().eq('id', btn.dataset.id)
      if (error) { toastError("O'chirishda xato."); return }
      toastSuccess("Guruh o'chirildi.")
      navigate('/guruhlar')
    })
  })

  // Delete student
  document.querySelectorAll('.del-stu').forEach(btn => {
    btn.addEventListener('click', async () => {
      const name = btn.dataset.name || "O'quvchi"
      if (!confirm('"' + name + '" ni butunlay o\'chirasizmi?')) return
      btn.disabled = true
      const { error } = await supabase.from('profiles').delete().eq('id', btn.dataset.id)
      if (error) { toastError("Xato: " + error.message); btn.disabled = false; return }
      toastSuccess('"' + name + '" o\'chirildi.')
      navigate('/guruhlar')
    })
  })
}
