// src/views/yangi-oquvchi.js — Yangi o'quvchi qo'shish
import { supabase } from '../lib/supabase.js'
import { navigate } from '../lib/router.js'
import { buildTeacherNav } from './nav.js'
import { toastSuccess, toastError } from '../lib/toast.js'

function setLoad(btn,on){ if(!btn)return; btn.classList.toggle('btn-loading',on); btn.disabled=on }

export async function yangiOquvchiView(profile) {
  if (profile?.role !== 'teacher') { navigate('/mening'); return '' }

  const { data: groups } = await supabase.from('groups').select('id,name').order('name')
  const grpOpts = (groups??[]).map(g=>'<option value="' + g.id + '">' + g.name + '</option>').join('')

  return `
    ${buildTeacherNav(profile, '/yangi-oquvchi')}
    <div class="teacher-main" style="max-width:520px">
      <div class="page-title">Yangi o'quvchi qo'shish</div>
      <div class="card">
        <form id="newStuForm" style="display:flex;flex-direction:column;gap:16px">
          <div class="form-group">
            <label class="form-label">To'liq ism</label>
            <input class="form-input" id="newName" type="text" placeholder="Abdullayev Ali">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" id="newEmail" type="email" placeholder="ali@misol.uz">
          </div>
          <div class="form-group">
            <label class="form-label">Parol</label>
            <input class="form-input" id="newPass" type="text" placeholder="kamida 6 belgi">
          </div>
          <div class="form-group">
            <label class="form-label">Guruhga qo'shish <span style="color:var(--text-3)">(ixtiyoriy)</span></label>
            <select class="form-select" id="newStuGrp">
              <option value="">— Guruhsiz —</option>
              ${grpOpts}
            </select>
          </div>
          <button type="submit" class="btn btn-primary w-full" id="btnNewStu">
            <span class="btn-text">O'quvchini qo'shish</span>
          </button>
        </form>
      </div>

      <div class="card" style="margin-top:16px;padding:14px 18px">
        <div style="font-size:.82rem;color:var(--text-2);line-height:1.7">
          <strong>Eslatma:</strong> O'quvchi yaratilgandan so'ng u email va parol bilan tizimga kirishi mumkin.
          Supabase sozlamalarida <em>Email confirmation</em> o'chirilgan bo'lishi kerak.
        </div>
      </div>
    </div>
  `
}

export function initYangiOquvchiView(profile) {
  const form = document.getElementById('newStuForm')
  const btn  = document.getElementById('btnNewStu')

  form?.addEventListener('submit', async e => {
    e.preventDefault()
    const name  = document.getElementById('newName').value.trim()
    const email = document.getElementById('newEmail').value.trim()
    const pass  = document.getElementById('newPass').value
    const gid   = document.getElementById('newStuGrp').value

    if (!name)  { toastError("Ism kiritilmagan.");  return }
    if (!email) { toastError("Email kiritilmagan."); return }
    if (pass.length < 6) { toastError("Parol kamida 6 belgi bo'lishi kerak."); return }

    setLoad(btn, true)

    // O'qituvchi sessionini saqlash
    const { data: { session: teacherSession } } = await supabase.auth.getSession()

    const { data: sd, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { full_name: name, role: 'student' } }
    })

    // O'qituvchi sessionini qaytarish
    if (teacherSession) {
      await supabase.auth.setSession({
        access_token: teacherSession.access_token,
        refresh_token: teacherSession.refresh_token
      })
    }

    if (error) { toastError('Xato: ' + error.message); setLoad(btn, false); return }

    if (gid && sd?.user?.id) {
      await supabase.from('group_members').insert({ group_id: gid, student_id: sd.user.id })
    }

    setLoad(btn, false)
    toastSuccess('"' + name + '" muvaffaqiyatli qo\'shildi!')
    form.reset()
  })
}
