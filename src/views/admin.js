// src/views/admin.js — Coin berish & Market
import { supabase } from '../lib/supabase.js'
import { navigate } from '../lib/router.js'
import { buildTeacherNav } from './nav.js'
import { toastSuccess, toastError } from '../lib/toast.js'

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }
function ini(n) { return String(n).split(' ').map(w=>w[0]||'').join('').toUpperCase().slice(0,2) }
function setLoad(btn,on){ if(!btn)return; btn.disabled=on; btn.style.opacity=on?'0.6':'1' }

const AVATAR_COLORS = ['#6366F1','#8B5CF6','#EC4899','#F59E0B','#10B981','#3B82F6','#EF4444','#14B8A6']
function avatarColor(id){ let h=0; for(let c of String(id)){h=(h*31+c.charCodeAt(0))%AVATAR_COLORS.length} return AVATAR_COLORS[h] }

export async function adminView(profile) {
  if (profile?.role !== 'teacher') { navigate('/mening'); return '' }

  const [{ data: students },{ data: groups },{ data: gm },{ data: rewards }] = await Promise.all([
    supabase.from('profiles').select('id,full_name,coins').eq('role','student').order('coins', { ascending: false }),
    supabase.from('groups').select('*').order('name'),
    supabase.from('group_members').select('group_id,student_id'),
    supabase.from('rewards').select('*').order('price')
  ])

  const sgMap = {}, memberMap = {}
  ;(gm??[]).forEach(m => {
    sgMap[m.student_id] = m.group_id
    if (!memberMap[m.group_id]) memberMap[m.group_id] = []
    memberMap[m.group_id].push(m.student_id)
  })

  const totalStudents = (students??[]).length
  const totalCoins    = (students??[]).reduce((a,s) => a+(s.coins||0), 0)
  const avgCoins      = totalStudents ? Math.round(totalCoins/totalStudents) : 0

  // ── Student cards for selector ────────────────────────────────────────
  const stuCards = (students??[]).map(s => {
    const group = (groups??[]).find(g => sgMap[s.id] === g.id)
    const color = avatarColor(s.id)
    return '<div class="cb-stu-card" data-sid="'+s.id+'" data-coins="'+(s.coins||0)+'" data-name="'+esc(s.full_name)+'">' +
      '<div class="cb-stu-av" style="background:'+color+'22;color:'+color+'">'+ini(s.full_name)+'</div>' +
      '<div class="cb-stu-info">' +
        '<div class="cb-stu-name">'+esc(s.full_name)+'</div>' +
        '<div class="cb-stu-meta">'+(group ? '👥 '+esc(group.name) : '<span style="color:#F59E0B">Guruhsiz</span>')+'</div>' +
      '</div>' +
      '<div class="cb-stu-bal">' +
        '<div class="cb-stu-coins">'+( s.coins||0)+'</div>' +
        '<div class="cb-stu-coin-lbl">🪙</div>' +
      '</div>' +
    '</div>'
  }).join('') || '<div class="cb-empty">Hali o\'quvchilar yo\'q</div>'

  const grpOpts = (groups??[]).map(g => '<option value="'+g.id+'">'+esc(g.name)+'</option>').join('')

  // ── Rewards ──────────────────────────────────────────────────────────
  const rwdCards = (rewards??[]).map(r =>
    '<div class="rwd-card" data-rid="'+r.id+'">' +
      '<div class="rwd-emoji">'+esc(r.emoji)+'</div>' +
      '<div class="rwd-info">' +
        '<div class="rwd-name">'+esc(r.name)+'</div>' +
        '<div class="rwd-price">'+r.price+' 🪙</div>' +
      '</div>' +
      '<button class="rwd-del-btn del-rwd" data-id="'+r.id+'" title="O\'chirish">🗑</button>' +
    '</div>'
  ).join('') || '<div class="cb-empty">Hali mukofotlar yo\'q</div>'

  return buildTeacherNav(profile, '/admin') +
    '<div class="teacher-main" style="max-width:1100px">' +

      // Page header
      '<div class="gc-page-header">' +
        '<div>' +
          '<h1 class="gc-page-title">Coin boshqaruvi</h1>' +
          '<p class="gc-page-sub">'+totalStudents+' o\'quvchi · '+totalCoins+' jami coin · '+avgCoins+' o\'rtacha</p>' +
        '</div>' +
      '</div>' +

      // Tabs
      '<div class="cb-tabs">' +
        '<button class="cb-tab active" data-tab="coins">🪙 Coin berish</button>' +
        '<button class="cb-tab" data-tab="group">👥 Guruhga berish</button>' +
        '<button class="cb-tab" data-tab="market">🛍 Market</button>' +
      '</div>' +

      // ── Coin berish tab ───────────────────────────────────────────────
      '<div class="cb-panel" id="tab-coins">' +
        '<div class="cb-layout">' +

          // Left: student list
          '<div class="cb-left">' +
            '<div class="cb-section-label">O\'quvchi tanlang</div>' +
            '<div class="cb-search-wrap">' +
              '<span class="cb-search-icon">🔍</span>' +
              '<input class="cb-search" id="stuSearch" type="text" placeholder="Ism bo\'yicha qidirish...">' +
            '</div>' +
            '<div class="cb-stu-list" id="stuList">'+stuCards+'</div>' +
          '</div>' +

          // Right: coin form
          '<div class="cb-right">' +
            // Selected student display
            '<div class="cb-selected-box" id="selectedBox" style="display:none">' +
              '<div class="cb-selected-av" id="selAv"></div>' +
              '<div class="cb-selected-info">' +
                '<div class="cb-selected-name" id="selName"></div>' +
                '<div class="cb-selected-bal"><span id="selCoins">0</span> 🪙 joriy balans</div>' +
              '</div>' +
              '<button class="cb-deselect" id="deselectBtn">✕</button>' +
            '</div>' +
            '<div class="cb-no-select" id="noSelect">👈 Chap tomonda o\'quvchi tanlang</div>' +

            // Form
            '<div class="cb-form-card" id="coinFormCard" style="display:none">' +
              '<div class="cb-section-label" style="margin-bottom:12px">Coin miqdori</div>' +

              // Quick amounts
              '<div class="cb-quick-amounts">' +
                '<button class="cb-quick" data-v="5">+5</button>' +
                '<button class="cb-quick" data-v="10">+10</button>' +
                '<button class="cb-quick" data-v="20">+20</button>' +
                '<button class="cb-quick" data-v="50">+50</button>' +
                '<button class="cb-quick" data-v="100">+100</button>' +
              '</div>' +

              '<div class="cb-input-row">' +
                '<span class="cb-input-prefix" id="amtSign">+</span>' +
                '<input class="cb-amount-input" id="coinAmt" type="number" placeholder="0" min="1">' +
                '<span class="cb-input-suffix">🪙</span>' +
              '</div>' +

              '<div class="cb-section-label" style="margin:14px 0 8px">Sabab</div>' +
              '<input class="form-input" id="coinRsn" type="text" placeholder="Masalan: Test natijasi, Dars faolligi...">' +

              // Preset reasons
              '<div class="cb-reasons">' +
                '<button class="cb-reason-chip" data-r="Test natijasi">Test</button>' +
                '<button class="cb-reason-chip" data-r="Dars faolligi">Faollik</button>' +
                '<button class="cb-reason-chip" data-r="Uy vazifasi">Uy ishi</button>' +
                '<button class="cb-reason-chip" data-r="Loyiha">Loyiha</button>' +
                '<button class="cb-reason-chip" data-r="Intizom">Intizom</button>' +
              '</div>' +

              '<div class="cb-action-btns">' +
                '<button class="cb-give-btn" id="btnGive">✚ Berish</button>' +
                '<button class="cb-deduct-btn" id="btnDedct">− Ayirish</button>' +
              '</div>' +
            '</div>' +
          '</div>' +

        '</div>' +
      '</div>' +

      // ── Market tab ────────────────────────────────────────────────────
// ── Guruhga coin berish tab ───────────────────────────────────────
      '<div class="cb-panel hidden" id="tab-group">' +
        '<div style="max-width:480px">' +
          '<div class="cb-section-label" style="margin-bottom:14px">Guruh tanlang</div>' +
          '<div class="grp-coin-list" id="grpCoinList">' +
            (groups??[]).map(g => {
              const mIds = memberMap[g.id] ?? []
              return '<div class="grp-coin-item">' +
                '<div class="grp-coin-info">' +
                  '<div class="grp-coin-name">' + esc(g.name) + '</div>' +
                  '<div class="grp-coin-count">' + mIds.length + ' o\'quvchi</div>' +
                '</div>' +
                '<button class="grp-coin-select-btn" data-gid="' + g.id + '" data-gname="' + esc(g.name) + '">' +
                  'Tanlash' +
                '</button>' +
              '</div>'
            }).join('') ||
            '<div class="cb-empty">Hali guruh yo\'q</div>' +
          '</div>' +
          '<div class="cb-form-card" id="grpCoinForm" style="display:none;margin-top:16px">' +
            '<div id="grpCoinTitle" class="cb-section-label" style="margin-bottom:12px"></div>' +
            '<div class="cb-quick-amounts">' +
              '<button class="cb-quick grp-quick" data-v="5">+5</button>' +
              '<button class="cb-quick grp-quick" data-v="10">+10</button>' +
              '<button class="cb-quick grp-quick" data-v="20">+20</button>' +
              '<button class="cb-quick grp-quick" data-v="50">+50</button>' +
            '</div>' +
            '<div class="cb-input-row">' +
              '<span class="cb-input-prefix">+</span>' +
              '<input class="cb-amount-input" id="grpCoinAmt" type="number" placeholder="0" min="1">' +
              '<span class="cb-input-suffix">🪙</span>' +
            '</div>' +
            '<div class="cb-section-label" style="margin:14px 0 8px">Sabab</div>' +
            '<input class="form-input" id="grpCoinRsn" type="text" placeholder="Barcha guruh uchun sabab...">' +
            '<div class="cb-action-btns" style="margin-top:14px">' +
              '<button class="cb-give-btn" id="btnGrpGive">✔ Guruhga berish</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="cb-panel hidden" id="tab-market">' +
        '<div class="mkt-layout">' +

          // Add reward form
          '<div class="mkt-form-card">' +
            '<div class="cb-section-label" style="margin-bottom:14px">Yangi mukofot qo\'shish</div>' +
            '<form id="rwdForm">' +
              '<div class="mkt-form-row">' +
                '<input class="form-input mkt-emoji-input" id="rwdEmoji" type="text" value="🎁" maxlength="4" title="Emoji">' +
                '<input class="form-input" id="rwdName" type="text" placeholder="Mukofot nomi..." style="flex:1">' +
                '<input class="form-input mkt-price-input" id="rwdPrice" type="number" placeholder="Narx" min="1">' +
                '<button type="submit" class="btn btn-primary" id="btnAddRwd" style="white-space:nowrap">+ Qo\'shish</button>' +
              '</div>' +
            '</form>' +
          '</div>' +

          // Rewards grid
          '<div class="cb-section-label" style="margin:20px 0 12px">Mavjud mukofotlar</div>' +
          '<div class="rwd-grid" id="rwdList">'+rwdCards+'</div>' +

        '</div>' +
      '</div>' +

    '</div>'
}

export function initAdminView(profile) {
  // ── Tabs ─────────────────────────────────────────────────────────────
  document.querySelectorAll('.cb-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.cb-tab').forEach(t => t.classList.remove('active'))
      document.querySelectorAll('.cb-panel').forEach(p => p.classList.add('hidden'))
      tab.classList.add('active')
      document.getElementById('tab-' + tab.dataset.tab)?.classList.remove('hidden')
    })
  })

  // ── Student search ────────────────────────────────────────────────────
  document.getElementById('stuSearch')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase()
    document.querySelectorAll('.cb-stu-card').forEach(card => {
      const name = card.dataset.name?.toLowerCase() || ''
      card.style.display = name.includes(q) ? '' : 'none'
    })
  })

  // ── Student select ────────────────────────────────────────────────────
  let selectedSid = null

  document.querySelectorAll('.cb-stu-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.cb-stu-card').forEach(c => c.classList.remove('selected'))
      card.classList.add('selected')
      selectedSid = card.dataset.sid
      const name   = card.dataset.name
      const coins  = card.dataset.coins
      const color  = card.querySelector('.cb-stu-av')?.style.color || '#6366F1'
      const avBg   = card.querySelector('.cb-stu-av')?.style.background || '#6366F122'
      const avText = card.querySelector('.cb-stu-av')?.textContent || ''

      document.getElementById('selectedBox').style.display = 'flex'
      document.getElementById('noSelect').style.display    = 'none'
      document.getElementById('coinFormCard').style.display = 'block'
      document.getElementById('selAv').textContent   = avText
      document.getElementById('selAv').style.background = avBg
      document.getElementById('selAv').style.color   = color
      document.getElementById('selName').textContent = name
      document.getElementById('selCoins').textContent = coins
    })
  })

  document.getElementById('deselectBtn')?.addEventListener('click', () => {
    selectedSid = null
    document.querySelectorAll('.cb-stu-card').forEach(c => c.classList.remove('selected'))
    document.getElementById('selectedBox').style.display   = 'none'
    document.getElementById('noSelect').style.display      = 'block'
    document.getElementById('coinFormCard').style.display  = 'none'
  })

  // ── Quick amounts ─────────────────────────────────────────────────────
  document.querySelectorAll('.cb-quick').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('coinAmt').value = btn.dataset.v
      document.querySelectorAll('.cb-quick').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
    })
  })

  // ── Preset reasons ────────────────────────────────────────────────────
  document.querySelectorAll('.cb-reason-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('coinRsn').value = chip.dataset.r
      document.querySelectorAll('.cb-reason-chip').forEach(c => c.classList.remove('active'))
      chip.classList.add('active')
    })
  })

  // ── Send coin ─────────────────────────────────────────────────────────
  async function sendCoin(sign) {
    if (!selectedSid) { toastError("O'quvchi tanlanmagan."); return }
    const raw    = parseInt(document.getElementById('coinAmt').value, 10)
    const reason = document.getElementById('coinRsn').value.trim()
    if (!raw || raw <= 0) { toastError("Miqdor kiriting."); return }
    if (!reason) { toastError("Sabab kiriting."); return }
    const amount = sign < 0 ? -Math.abs(raw) : Math.abs(raw)
    // Balans tekshiruvi
    if (sign < 0) {
      const curBal = parseInt(document.getElementById('selCoins').textContent, 10) || 0
      if (Math.abs(raw) > curBal) { toastError('Yetarli coin yo\'q! Balans: ' + curBal + ' 🪙'); return }
    }
    const btn    = sign > 0 ? document.getElementById('btnGive') : document.getElementById('btnDedct')
    setLoad(btn, true)
    const { error } = await supabase.from('transactions').insert({
      student_id: selectedSid, amount, reason, type: 'award', created_by: profile.id
    })
    setLoad(btn, false)
    if (error) { toastError('Xato: ' + error.message); return }

    // Update displayed balance
    const newBal = parseInt(document.getElementById('selCoins').textContent, 10) + amount
    document.getElementById('selCoins').textContent = newBal
    const card = document.querySelector('.cb-stu-card[data-sid="'+selectedSid+'"]')
    if (card) {
      card.dataset.coins = newBal
      card.querySelector('.cb-stu-coins').textContent = newBal
    }

    toastSuccess((amount > 0 ? '+' : '') + amount + ' 🪙 ' + (amount > 0 ? 'berildi!' : 'ayirildi!'))
    document.getElementById('coinAmt').value = ''
    document.getElementById('coinRsn').value = ''
    document.querySelectorAll('.cb-quick,.cb-reason-chip').forEach(b => b.classList.remove('active'))
  }

  document.getElementById('btnGive')?.addEventListener('click',  () => sendCoin(1))
  document.getElementById('btnDedct')?.addEventListener('click', () => sendCoin(-1))

  // ── Guruhga coin berish ───────────────────────────────────────────────
  let selectedGid = null, selectedGname = ''

  document.querySelectorAll('.grp-coin-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.grp-coin-select-btn').forEach(b => { b.textContent = 'Tanlash'; b.classList.remove('active') })
      btn.textContent = '✓ Tanlandi'; btn.classList.add('active')
      selectedGid   = btn.dataset.gid
      selectedGname = btn.dataset.gname
      const form = document.getElementById('grpCoinForm')
      form.style.display = 'block'
      document.getElementById('grpCoinTitle').textContent = selectedGname + ' guruhiga coin berish'
    })
  })

  document.querySelectorAll('.grp-quick').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('grpCoinAmt').value = btn.dataset.v
      document.querySelectorAll('.grp-quick').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
    })
  })

  document.getElementById('btnGrpGive')?.addEventListener('click', async () => {
    if (!selectedGid) { toastError("Guruh tanlanmagan."); return }
    const raw    = parseInt(document.getElementById('grpCoinAmt').value, 10)
    const reason = document.getElementById('grpCoinRsn').value.trim()
    if (!raw || raw <= 0) { toastError("Miqdor kiriting."); return }
    if (!reason) { toastError("Sabab kiriting."); return }

    const btn = document.getElementById('btnGrpGive')
    setLoad(btn, true)

    // Guruh a'zolarini olish
    const { data: members } = await supabase.from('group_members').select('student_id').eq('group_id', selectedGid)
    if (!members || members.length === 0) { toastError("Guruhda o'quvchi yo'q."); setLoad(btn, false); return }

    // Barcha a'zolarga tranzaksiya
    const inserts = members.map(m => ({ student_id: m.student_id, amount: raw, reason, type: 'award', created_by: profile.id }))
    const { error } = await supabase.from('transactions').insert(inserts)
    setLoad(btn, false)
    if (error) { toastError('Xato: ' + error.message); return }
    toastSuccess(selectedGname + ' guruhining ' + members.length + ' ta o\'quvchisiga +' + raw + ' 🪙 berildi!')
    document.getElementById('grpCoinAmt').value = ''
    document.getElementById('grpCoinRsn').value = ''
    document.querySelectorAll('.grp-quick').forEach(b => b.classList.remove('active'))
  })

  // ── Market ────────────────────────────────────────────────────────────
  const rwdForm = document.getElementById('rwdForm')
  rwdForm?.addEventListener('submit', async e => {
    e.preventDefault()
    const name  = document.getElementById('rwdName').value.trim()
    const price = parseInt(document.getElementById('rwdPrice').value, 10)
    const emoji = document.getElementById('rwdEmoji').value.trim() || '🎁'
    if (!name || !price) { toastError("Barcha maydonlarni to'ldiring."); return }
    const btn = document.getElementById('btnAddRwd')
    setLoad(btn, true)
    const { data, error } = await supabase.from('rewards').insert({ name, price, emoji }).select().single()
    setLoad(btn, false)
    if (error) { toastError('Xato: ' + error.message); return }
    toastSuccess('"' + name + '" qo\'shildi!')
    rwdForm.reset()
    document.getElementById('rwdEmoji').value = '🎁'
    const grid = document.getElementById('rwdList')
    const empty = grid?.querySelector('.cb-empty')
    if (empty) empty.remove()
    if (data && grid) {
      const d = document.createElement('div')
      d.className = 'rwd-card'; d.dataset.rid = data.id
      d.innerHTML = '<div class="rwd-emoji">'+esc(emoji)+'</div>' +
        '<div class="rwd-info"><div class="rwd-name">'+esc(name)+'</div><div class="rwd-price">'+price+' 🪙</div></div>' +
        '<button class="rwd-del-btn del-rwd" data-id="'+data.id+'">🗑</button>'
      grid.appendChild(d)
      d.querySelector('.del-rwd').addEventListener('click', delRwd)
    }
  })

  function delRwd() {
    const btn = this || event?.currentTarget
    if (!confirm("O'chirasizmi?")) return
    btn.disabled = true
    supabase.from('rewards').delete().eq('id', btn.dataset.id).then(({ error }) => {
      if (error) { toastError("Xato."); btn.disabled = false; return }
      btn.closest('.rwd-card')?.remove()
    })
  }
  document.querySelectorAll('.del-rwd').forEach(b => b.addEventListener('click', delRwd))
}
