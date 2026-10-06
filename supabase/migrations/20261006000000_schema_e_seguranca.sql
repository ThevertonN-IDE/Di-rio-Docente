-- ==============================================================================
-- DIÁRIO DOCENTE SaaS - SCHEMA, RLS, STORAGE E REGRAS DE NEGÓCIO (FREE/PRO)
-- Data: Outubro de 2026
-- ==============================================================================

-- 1. TABELA DE PERFIS (PLANOS E ASSINATURAS)
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_completo TEXT,
    email TEXT,
    plano TEXT DEFAULT 'free', -- 'free' ou 'pro'
    pro_expira_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger para criar perfil automaticamente no SignUp do Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_novo_usuario()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfis (id, email, nome_completo, plano)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nome_completo', ''),
        'free'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_novo_usuario ON auth.users;
CREATE TRIGGER trg_novo_usuario
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_novo_usuario();


-- 2. TABELA DE TURMAS
CREATE TABLE IF NOT EXISTS public.turmas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    disciplina TEXT,
    ano_letivo INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    media_aprovacao NUMERIC(4, 2) DEFAULT 6.00,
    arquivada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 3. TABELA DE ALUNOS E MATRÍCULAS
CREATE TABLE IF NOT EXISTS public.alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT,
    foto_url TEXT, -- Salva apenas o path relativo: user_id/filename.ext (LGPD)
    observacoes_gerais TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.matriculas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    numero_chamada INT,
    status TEXT DEFAULT 'ativo',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(turma_id, aluno_id)
);


-- 4. AULAS E FREQUÊNCIAS (CHAMADA DIÁRIA)
CREATE TABLE IF NOT EXISTS public.aulas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    bimestre INT DEFAULT 1,
    conteudo_ministrado TEXT,
    proximo_conteudo TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.frequencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aula_id UUID NOT NULL REFERENCES public.aulas(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    presente BOOLEAN NOT NULL DEFAULT TRUE,
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(aula_id, aluno_id)
);


-- 5. AVALIAÇÕES E NOTAS
CREATE TABLE IF NOT EXISTS public.avaliacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    bimestre INT DEFAULT 1,
    titulo TEXT NOT NULL,
    peso NUMERIC(3, 1) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    avaliacao_id UUID NOT NULL REFERENCES public.avaliacoes(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    valor NUMERIC(4, 2),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(avaliacao_id, aluno_id)
);


-- 6. BANCO DE QUESTÕES E DOCUMENTOS SALVOS (A4 / LATEX / APOSTILAS)
CREATE TABLE IF NOT EXISTS public.questoes_banco (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assunto TEXT NOT NULL,
    enunciado TEXT NOT NULL,
    nivel_dificuldade TEXT DEFAULT 'Médio',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.documentos_salvos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL, -- 'prova', 'plano_aula', 'apostila'
    titulo TEXT NOT NULL,
    conteudo JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==============================================================================
-- 7. REGRAS DE NEGÓCIO: TRIGGER DO PLANO FREE (1 TURMA) VS PLANO PRO
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.verificar_limite_turmas()
RETURNS TRIGGER AS $$
DECLARE
  v_plano TEXT;
  v_expira_em TIMESTAMPTZ;
  v_total_turmas INT;
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(NEW.user_id, auth.uid());

  -- Permite updates / upsert do mesmo registro na restauração
  IF EXISTS (SELECT 1 FROM public.turmas WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Consulta plano e data de expiração
  SELECT LOWER(TRIM(plano)), pro_expira_em 
  INTO v_plano, v_expira_em
  FROM public.perfis 
  WHERE id = v_user_id
  LIMIT 1;

  -- Se for Pro, valida se a assinatura não expirou
  IF v_plano = 'pro' THEN
    IF v_expira_em IS NULL OR v_expira_em > NOW() THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Plano Free ou Pro vencido: limite estrito de 1 turma ativa
  SELECT COUNT(*) INTO v_total_turmas 
  FROM public.turmas 
  WHERE user_id = v_user_id;

  IF v_total_turmas >= 1 THEN
    RAISE EXCEPTION 'Limite de 1 turma atingido para o plano gratuito ou sua assinatura Pro expirou. Assine o Plano Pro para criar turmas ilimitadas.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove triggers legados e recria o gatilho oficial
DROP TRIGGER IF EXISTS trg_verificar_limite_turmas ON public.turmas;
CREATE TRIGGER trg_verificar_limite_turmas
BEFORE INSERT ON public.turmas
FOR EACH ROW
EXECUTE FUNCTION public.verificar_limite_turmas();


-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) - ISOLAMENTO DE DADOS ENTRE PROFESSORES
-- ==============================================================================

ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frequencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questoes_banco ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_salvos ENABLE ROW LEVEL SECURITY;

-- Políticas de perfis
CREATE POLICY "Professores visualizam e alteram o proprio perfil"
ON public.perfis FOR ALL
USING (auth.uid() = id);

-- Políticas diretas por user_id
CREATE POLICY "Acesso proprio a turmas" ON public.turmas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Acesso proprio a alunos" ON public.alunos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Acesso proprio a questoes" ON public.questoes_banco FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Acesso proprio a documentos" ON public.documentos_salvos FOR ALL USING (auth.uid() = user_id);

-- Políticas relacionais (acesso às tabelas filhas apenas se a turma pertencer ao professor)
CREATE POLICY "Acesso a matriculas de turmas proprias" ON public.matriculas FOR ALL
USING (EXISTS (SELECT 1 FROM public.turmas WHERE id = matriculas.turma_id AND user_id = auth.uid()));

CREATE POLICY "Acesso a aulas de turmas proprias" ON public.aulas FOR ALL
USING (EXISTS (SELECT 1 FROM public.turmas WHERE id = aulas.turma_id AND user_id = auth.uid()));

CREATE POLICY "Acesso a frequencias de aulas proprias" ON public.frequencias FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.aulas a 
    JOIN public.turmas t ON t.id = a.turma_id 
    WHERE a.id = frequencias.aula_id AND t.user_id = auth.uid()
));

CREATE POLICY "Acesso a avaliacoes de turmas proprias" ON public.avaliacoes FOR ALL
USING (EXISTS (SELECT 1 FROM public.turmas WHERE id = avaliacoes.turma_id AND user_id = auth.uid()));

CREATE POLICY "Acesso a notas de avaliacoes proprias" ON public.notas FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.avaliacoes av 
    JOIN public.turmas t ON t.id = av.turma_id 
    WHERE av.id = notas.avaliacao_id AND t.user_id = auth.uid()
));


-- ==============================================================================
-- 9. CONFIGURAÇÃO DO BUCKET FOTOS-ALUNOS (LGPD - ACESSO PRIVADO)
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-alunos', 'fotos-alunos', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- O professor só pode fazer upload e acessar fotos dentro da sua própria pasta (user_id/...)
CREATE POLICY "Professores gerenciam apenas fotos de seus alunos"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'fotos-alunos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'fotos-alunos' AND (storage.foldername(name))[1] = auth.uid()::text);