-- ============================================
-- Guruhlar migration
-- Supabase SQL Editor ga nusxalab ishga tushiring
-- ============================================

-- 1. Guruhlar jadvali
CREATE TABLE IF NOT EXISTS public.groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  teacher_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Guruh a'zolari (o'quvchi ↔ guruh)
CREATE TABLE IF NOT EXISTS public.group_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, student_id)
);

-- RLS yoqish
ALTER TABLE public.groups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- groups: hamma ko'radi, faqat teacher boshqaradi
CREATE POLICY "Groups: hamma ko'radi"
  ON public.groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Groups: teacher yaratadi"
  ON public.groups FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher());

CREATE POLICY "Groups: teacher yangilaydi"
  ON public.groups FOR UPDATE TO authenticated
  USING (public.is_teacher());

CREATE POLICY "Groups: teacher o'chiradi"
  ON public.groups FOR DELETE TO authenticated
  USING (public.is_teacher());

-- group_members: hamma ko'radi, faqat teacher boshqaradi
CREATE POLICY "GroupMembers: hamma ko'radi"
  ON public.group_members FOR SELECT TO authenticated USING (true);

CREATE POLICY "GroupMembers: teacher qo'shadi"
  ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher());

CREATE POLICY "GroupMembers: teacher o'chiradi"
  ON public.group_members FOR DELETE TO authenticated
  USING (public.is_teacher());

-- ============================================
-- O'quvchini o'chirish: teacher uchun DELETE policy
-- ============================================
CREATE POLICY "Profiles: teacher student o'chira oladi"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    public.is_teacher() AND role = 'student'
  );

-- ============================================
-- Purchase requests jadvali
-- ============================================
CREATE TABLE IF NOT EXISTS public.purchase_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id   UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PurchaseReq: student o'zi ko'radi, teacher hammasini"
  ON public.purchase_requests FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_teacher());

CREATE POLICY "PurchaseReq: student yozadi"
  ON public.purchase_requests FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "PurchaseReq: teacher yangilaydi"
  ON public.purchase_requests FOR UPDATE TO authenticated
  USING (public.is_teacher());
