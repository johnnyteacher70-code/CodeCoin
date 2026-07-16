-- ============================================================
-- TangaLab — Supabase Schema
-- Barcha buyruqlarni Supabase SQL Editor'da bir marta ishga tushiring
-- ============================================================

-- ─── 1. JADVALLAR ────────────────────────────────────────────

-- Foydalanuvchilar profili (auth.users bilan 1:1)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher')),
  coins       INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mukofotlar do'koni
CREATE TABLE IF NOT EXISTS public.rewards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  price       INTEGER NOT NULL CHECK (price > 0),
  emoji       TEXT NOT NULL DEFAULT '🎁',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tanga operatsiyalari tarixi
CREATE TABLE IF NOT EXISTS public.transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,            -- musbat: berildi, manfiy: ayirildi
  reason      TEXT NOT NULL DEFAULT '',
  type        TEXT NOT NULL DEFAULT 'award' CHECK (type IN ('award', 'purchase')),
  created_by  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. RLS YORDAMCHI FUNKSIYA ────────────────────────────────

-- SECURITY DEFINER: RLS ichida rekursiyasiz rol tekshirish
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'teacher'
  );
$$;

-- ─── 3. ROW LEVEL SECURITY ────────────────────────────────────

ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards     ENABLE ROW LEVEL SECURITY;

-- profiles: barcha autentifikatsiyalangan foydalanuvchi ko'ra oladi (reyting uchun)
CREATE POLICY "Profiles: hamma ko'radi"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- profiles: faqat o'qituvchi yangilaydi (coin berish uchun)
CREATE POLICY "Profiles: faqat teacher yangilaydi"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_teacher());

-- profiles: faqat o'qituvchi yangi profil yaratadi (trigger orqali avtomatik)
CREATE POLICY "Profiles: faqat teacher insert qiladi"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_teacher());

-- transactions: o'quvchi faqat o'zinikini ko'radi; teacher hammasini
CREATE POLICY "Transactions: o'z yozuvlarini ko'radi"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR public.is_teacher()
  );

-- transactions: faqat teacher yozadi
CREATE POLICY "Transactions: faqat teacher yozadi"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_teacher());

-- rewards: hamma ko'ra oladi
CREATE POLICY "Rewards: hamma ko'radi"
  ON public.rewards FOR SELECT
  TO authenticated
  USING (true);

-- rewards: faqat teacher boshqaradi
CREATE POLICY "Rewards: faqat teacher boshqaradi"
  ON public.rewards FOR ALL
  TO authenticated
  USING (public.is_teacher())
  WITH CHECK (public.is_teacher());

-- ─── 4. TRIGGERLAR ────────────────────────────────────────────

-- Trigger 1: auth.users ga yangi foydalanuvchi qo'shilganda profiles ham yaratiladi
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, coins)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    0
  );
  RETURN NEW;
END;
$$;

-- Triggerdan oldin mavjudini o'chiramiz (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger 2: transactions qo'shilganda profiles.coins avtomatik yangilanadi
CREATE OR REPLACE FUNCTION public.handle_transaction_coins()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET coins = GREATEST(0, coins + NEW.amount)
  WHERE id = NEW.student_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_transaction_created ON public.transactions;

CREATE TRIGGER on_transaction_created
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_coins();

-- ─── 5. NAMUNAVIY MA'LUMOTLAR (ixtiyoriy) ────────────────────

-- Do'kon uchun bir nechta mukofot qo'shish:
INSERT INTO public.rewards (name, price, emoji) VALUES
  ('Uy vazifasidan ozod', 50, '📋'),
  ('Darsda muzqaymoq', 30, '🍦'),
  ('O''qituvchi bilan selfie', 20, '🤳'),
  ('Darsda o''yin vaqti', 100, '🎮'),
  ('Maxsus sertifikat', 75, '🏆')
ON CONFLICT DO NOTHING;

-- ─── ESLATMA ──────────────────────────────────────────────────
-- Birinchi o'qituvchi akaunti yaratilgandan so'ng, uni qo'lda teacher qiling:
-- UPDATE public.profiles SET role = 'teacher' WHERE id = '<user_id>';
-- Yoki Supabase Authentication > Users bo'limidan email orqali toping.
