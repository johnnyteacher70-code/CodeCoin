// src/views/login.js
import { signIn } from '../auth/auth.js'
import { navigate } from '../lib/router.js'
import { supabase } from '../lib/supabase.js'
import { toastSuccess, toastError } from '../lib/toast.js'

export async function loginView() {
  return `
    <div class="login-page">
      <!-- SOL: Form -->
      <div class="login-left">
        <div class="login-brand">
          <div class="login-brand-icon">TC</div>
          <span class="login-brand-name">TeacherCoin</span>
        </div>

        <h1 class="login-title">Xush kelibsiz!</h1>
        <p class="login-sub">Hisobingizga kiring va davom eting</p>

        <!-- Tab: Kirish / Ro'yxatdan o'tish -->
        <div class="tab-row">
          <button class="tab-btn active" data-tab="login">Kirish</button>
          <button class="tab-btn" data-tab="register">Ro'yxatdan o'tish</button>
        </div>

        <!-- Kirish -->
        <form class="login-form tab-panel" id="loginForm" data-panel="login">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" type="email" id="loginEmail" placeholder="siz@misol.uz" required autocomplete="email"/>
          </div>
          <div class="form-group">
            <label class="form-label">Parol</label>
            <input class="form-input" type="password" id="loginPassword" placeholder="••••••••" required autocomplete="current-password"/>
          </div>
          <div id="loginError" class="alert alert-error hidden"></div>
          <button type="submit" class="btn btn-primary btn-lg w-full" id="loginBtn">
            <span class="btn-text">Kirish</span>
          </button>
        </form>

        <!-- Ro'yxatdan o'tish -->
        <form class="login-form tab-panel hidden" id="registerForm" data-panel="register">
          <div class="form-group">
            <label class="form-label">To'liq ism</label>
            <input class="form-input" type="text" id="regName" placeholder="Abdullayev Ali" required autocomplete="name"/>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" type="email" id="regEmail" placeholder="ali@misol.uz" required autocomplete="email"/>
          </div>
          <div class="form-group">
            <label class="form-label">Parol</label>
            <input class="form-input" type="password" id="regPassword" placeholder="kamida 6 belgi" required minlength="6" autocomplete="new-password"/>
          </div>
          <div class="form-group">
            <label class="form-label">Parolni tasdiqlang</label>
            <input class="form-input" type="password" id="regPassword2" placeholder="••••••••" required autocomplete="new-password"/>
          </div>
          <button type="submit" class="btn btn-primary btn-lg w-full" id="registerBtn">
            <span class="btn-text">Ro'yxatdan o'tish</span>
          </button>
        </form>
      </div>

      <!-- O'NG: Hero -->
      <div class="login-right">
        <div class="login-hero-coin">
          <div class="login-hero-coin-inner">C</div>
        </div>
        <div class="login-hero-title">Coin bilan motivatsiya</div>
        <div class="login-hero-sub">O'quvchilaringizni rag'batlantiring va reytingni real vaqtda kuzating</div>
      </div>
    </div>
  `
}

export function initLoginView() {
  // Tab almashtirish
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'))
      btn.classList.add('active')
      document.querySelector(`[data-panel="${btn.dataset.tab}"]`).classList.remove('hidden')
    })
  })

  // Kirish
  const loginForm  = document.getElementById('loginForm')
  const loginError = document.getElementById('loginError')
  const loginBtn   = document.getElementById('loginBtn')

  loginForm?.addEventListener('submit', async e => {
    e.preventDefault()
    loginError.classList.add('hidden')
    setLoading(loginBtn, true)

    const { profile, error } = await signIn(
      document.getElementById('loginEmail').value.trim(),
      document.getElementById('loginPassword').value
    )
    if (error) {
      loginError.textContent = 'Email yoki parol noto\'g\'ri.'
      loginError.classList.remove('hidden')
      shakeEl(loginError)
      setLoading(loginBtn, false)
      return
    }
    navigate(profile?.role === 'teacher' ? '/dashboard' : '/mening')
  })

  // Ro'yxatdan o'tish
  const registerForm = document.getElementById('registerForm')
  const registerBtn  = document.getElementById('registerBtn')

  registerForm?.addEventListener('submit', async e => {
    e.preventDefault()
    const pass  = document.getElementById('regPassword').value
    const pass2 = document.getElementById('regPassword2').value
    if (pass !== pass2) {
      toastError('Parollar mos kelmadi.')
      shakeEl(document.getElementById('regPassword2'))
      return
    }
    setLoading(registerBtn, true)
    const { data, error } = await supabase.auth.signUp({
      email: document.getElementById('regEmail').value.trim(),
      password: pass,
      options: { data: { full_name: document.getElementById('regName').value.trim(), role: 'student' } }
    })
    setLoading(registerBtn, false)
    if (error) { toastError(error.message); return }
    if (data.session) {
      toastSuccess('Muvaffaqiyatli ro\'yxatdan o\'tdingiz!')
      navigate('/mening')
      return
    }
    // Email confirmation kerak bo'lsa
    toastSuccess('Ro\'yxatdan o\'tdingiz! Email ni tasdiqlang yoki kiring.')
    registerForm.reset()
    document.querySelector('[data-tab="login"]')?.click()
  })
}

/* ─── Helpers ────────────────────────────────────────────────── */
function setLoading(btn, on) {
  if (!btn) return
  if (on) btn.classList.add('btn-loading')
  else btn.classList.remove('btn-loading')
  btn.disabled = on
}

function shakeEl(el) {
  if (!el) return
  el.classList.remove('form-shake')
  void el.offsetWidth
  el.classList.add('form-shake')
}
