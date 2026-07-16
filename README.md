# 🪙 TangaLab

O'quvchilarni rag'batlantirish uchun tanga (ball) tizimi.
O'qituvchi tanga beradi/ayiradi — o'quvchilar reyting va balansi bilan o'z o'rnini ko'radi.

---

## Sozlash bosqichlari

### 1. Supabase loyiha ochish
1. [supabase.com](https://supabase.com) ga kiring va yangi loyiha yarating
2. Loyiha tayyor bo'lgach, **Settings → API** bo'limiga o'ting
3. `Project URL` va `anon public` kalitini nusxa oling

### 2. `schema.sql` ni ishga tushirish
1. Supabase dashboard'da **SQL Editor** ni oching
2. `supabase/schema.sql` faylining to'liq mazmunini ko'chiring va SQL Editor'ga joylashtiring
3. **Run** tugmasini bosing — barcha jadvallar, RLS qoidalari va triggerlar yaratiladi

### 3. `.env` faylini to'ldirish
Loyiha papkasida `.env.example` ni nusxalab `.env` yarating:

```bash
cp .env.example .env
```

So'ng `.env` faylni tahrirlang:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 4. O'rnatish va ishga tushirish

```bash
npm install
npm run dev
```

Brauzer avtomatik ochiladi: `http://localhost:5173`

### 5. Birinchi o'qituvchi akaunti
`schema.sql` ishga tushgandan so'ng, birinchi hisobni Supabase dashboard'da yarating:

**Authentication → Users → Add user**

Keyin uni o'qituvchi qiling (SQL Editor'da):
```sql
UPDATE public.profiles
SET role = 'teacher'
WHERE id = '<yangi_foydalanuvchi_uuid>';
```

---

## Loyiha tuzilishi

```
tangalab/
├── index.html
├── package.json
├── vite.config.js
├── .env              ← bu fayl .gitignore'da
├── .env.example
├── supabase/
│   └── schema.sql    ← SQL Editor'ga joylashtiriladigan fayl
└── src/
    ├── main.js       ← Kirish nuqtasi + router
    ├── style.css     ← Barcha stillar (CSS custom properties)
    ├── auth/
    │   └── auth.js   ← signIn, signOut, profil
    ├── lib/
    │   ├── supabase.js  ← Supabase client
    │   ├── router.js    ← Hash-based SPA router
    │   └── levels.js    ← Daraja tizimi (Bronza→Platina)
    └── views/
        ├── nav.js       ← Navigatsiya paneli
        ├── login.js     ← Kirish sahifasi
        ├── reyting.js   ← Reyting + podium
        ├── mening.js    ← Shaxsiy tanga va tarix (student)
        ├── dokon.js     ← Mukofotlar do'koni
        ├── admin.js     ← Tanga berish + o'quvchi qo'shish (teacher)
        └── tarix.js     ← Butun sinf tarixi (teacher)
```

---

## Daraja tizimi

| Daraja   | Tangalar       | Rang     |
|----------|---------------|----------|
| 🥉 Bronza  | 0 – 99        | To'q sariq |
| 🥈 Kumush  | 100 – 299     | Kulrang    |
| 🥇 Oltin   | 300 – 699     | Oltin      |
| 💎 Platina | 700 va undan ko'p | Ko'k-oq |

---

## Texnologiya

- **Frontend:** Vite + vanilla JavaScript (ES Modules)
- **Backend:** Supabase (Auth + PostgreSQL + Row Level Security)
- **Realtime:** Supabase Realtime — tanga yangilanganda ekran avtomatik o'zgaradi

---

## ⚠️ Muhim ogohlantirishlar

**Bepul Supabase loyiha 1 hafta harakatsiz tursa "paused" holatga o'tadi.**
Ilovani ochganda xato chiqsa, [app.supabase.com](https://app.supabase.com) ga kiring va loyihani qayta yoqing (`Resume project`).

**Email tasdiqlash:** Supabase by default yangi foydalanuvchiga tasdiqlash emaili yuboradi.
Test uchun `Authentication → Settings → Email Auth → Confirm email` kalit sozlamani o'chiring.

---

## Qisqa buyruqlar

```bash
npm run dev      # ishlab chiqish serveri
npm run build    # production uchun yig'ish
npm run preview  # yig'ilgan versiyani ko'rish
```
