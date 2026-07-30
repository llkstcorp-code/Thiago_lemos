-- ====================================================================
-- THIAGO LEMOS IMÓVEIS - SCHEMA COMPLETO DO BANCO DE DADOS
-- PostgreSQL 15+ | Supabase
-- ====================================================================
-- Como rodar: copie TUDO e cole no SQL Editor do Supabase
-- Ou salve este arquivo e rode: supabase db reset
-- ====================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Neste projeto as extensões ficaram espalhadas entre "public" e "extensions"
-- (unaccent em public, uuid-ossp em extensions) — incluímos os dois no
-- search_path para evitar erros de função/operador não encontrado.
SET search_path TO public, extensions;

-- ====================================================================
-- ENUMS (tipos customizados)
-- ====================================================================

CREATE TYPE imovel_tipo AS ENUM (
    'apartamento',
    'casa',
    'cobertura',
    'terreno',
    'comercial',
    'rural'
);

CREATE TYPE imovel_finalidade AS ENUM (
    'venda'
);

CREATE TYPE imovel_status AS ENUM (
    'rascunho',
    'disponivel',
    'reservado',
    'vendido',
    'alugado'
);

CREATE TYPE lead_status AS ENUM (
    'novo',
    'contatado',
    'visita_agendada',
    'proposta_enviada',
    'convertido',
    'perdido'
);

CREATE TYPE lead_origem AS ENUM (
    'site_formulario',
    'site_busca',
    'whatsapp',
    'telefone',
    'instagram',
    'facebook',
    'indicacao',
    'outro'
);

CREATE TYPE user_role AS ENUM (
    'admin',
    'corretor',
    'assistente'
);

CREATE TYPE lead_interacao_tipo AS ENUM (
    'criacao',
    'mudanca_status',
    'nota',
    'email_enviado',
    'whatsapp_enviado',
    'ligacao',
    'visita_agendada',
    'outro'
);

-- ====================================================================
-- TABELA: users (admins e corretores)
-- ====================================================================
DROP TABLE IF EXISTS public.users CASCADE;
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'corretor',
    telefone TEXT,
    avatar_url TEXT,
    creci TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'Usuários administrativos do sistema (espelha auth.users)';

CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_ativo ON public.users(ativo) WHERE ativo = true;

-- ====================================================================
-- TABELA: site_config (configurações dinâmicas do site)
-- ====================================================================
DROP TABLE IF EXISTS public.site_config CASCADE;
CREATE TABLE public.site_config (
    chave TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT NOT NULL DEFAULT 'texto' CHECK (tipo IN ('texto', 'numero', 'booleano', 'json', 'url', 'telefone', 'email')),
    atualizado_por UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.site_config IS 'Configurações dinâmicas do site (telefone, e-mail, redes sociais, etc)';

INSERT INTO public.site_config (chave, valor, descricao, tipo) VALUES
    ('telefone_principal', '(35) 99741-8298', 'Telefone principal exibido no site', 'telefone'),
    ('whatsapp', '5535997418298', 'Número do WhatsApp (apenas números, com DDI)', 'telefone'),
    ('email_contato', 'thiago10lemos10@gmail.com', 'E-mail principal de contato', 'email'),
    ('endereco_completo', 'Rua Paraná, 301 - Passos - MG', 'Endereço do escritório', 'texto'),
    ('creci', '35.314', 'Número do CRECI do corretor', 'texto'),
    ('horario_atendimento', 'Seg à Sex: 9h às 18h | Sáb: 9h às 13h', 'Horário de atendimento', 'texto'),
    ('instagram_url', '', 'URL completa do Instagram', 'url'),
    ('facebook_url', '', 'URL completa do Facebook', 'url'),
    ('youtube_url', '', 'URL do canal no YouTube', 'url'),
    ('meta_title', 'Thiago Lemos Imóveis - Encontre o imóvel dos seus sonhos', 'Título SEO padrão', 'texto'),
    ('meta_description', 'Imóveis de qualidade em São Paulo e região. Apartamentos, casas, coberturas e terrenos para venda.', 'Descrição SEO padrão', 'texto'),
    ('mostrar_preco', 'true', 'Exibir preços no site público', 'booleano'),
    ('itens_por_pagina', '12', 'Quantidade de imóveis por página na listagem', 'numero'),
    ('analytics_id', '', 'Google Analytics ID (G-XXXXXXX)', 'texto')
ON CONFLICT (chave) DO NOTHING;

-- ====================================================================
-- TABELA: amenidades (características dos imóveis)
-- ====================================================================
DROP TABLE IF EXISTS public.amenidades CASCADE;
CREATE TABLE public.amenidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icone TEXT,
    categoria TEXT,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_amenidades_categoria ON public.amenidades(categoria);
CREATE INDEX idx_amenidades_ativo ON public.amenidades(ativo) WHERE ativo = true;
CREATE INDEX idx_amenidades_slug ON public.amenidades(slug);

-- Amenidades pré-cadastradas
INSERT INTO public.amenidades (nome, slug, icone, categoria, ordem) VALUES
    ('Piscina', 'piscina', 'fas fa-swimming-pool', 'lazer', 1),
    ('Churrasqueira', 'churrasqueira', 'fas fa-fire', 'lazer', 2),
    ('Salão de Festas', 'salao-festas', 'fas fa-glass-cheers', 'lazer', 3),
    ('Academia', 'academia', 'fas fa-dumbbell', 'lazer', 4),
    ('Playground', 'playground', 'fas fa-child', 'lazer', 5),
    ('Quadra Esportiva', 'quadra', 'fas fa-futbol', 'lazer', 6),
    ('Sauna', 'sauna', 'fas fa-hot-tub', 'lazer', 7),
    ('Espaço Gourmet', 'espaco-gourmet', 'fas fa-utensils', 'lazer', 8),
    ('Espaço Coworking', 'coworking', 'fas fa-laptop', 'lazer', 9),
    ('Brinquedoteca', 'brinquedoteca', 'fas fa-gamepad', 'lazer', 10),
    ('Cinema', 'cinema', 'fas fa-film', 'lazer', 11),
    ('Portaria 24h', 'portaria-24h', 'fas fa-shield-alt', 'seguranca', 1),
    ('Câmeras de Segurança', 'cameras', 'fas fa-video', 'seguranca', 2),
    ('Cerca Elétrica', 'cerca-eletrica', 'fas fa-bolt', 'seguranca', 3),
    ('Guarita', 'guarita', 'fas fa-concierge-bell', 'seguranca', 4),
    ('Alarme', 'alarme', 'fas fa-bell', 'seguranca', 5),
    ('Interfone', 'interfone', 'fas fa-phone', 'seguranca', 6),
    ('Elevador', 'elevador', 'fas fa-arrows-alt-v', 'conforto', 1),
    ('Garagem Coberta', 'garagem-coberta', 'fas fa-car', 'conforto', 2),
    ('Mobiliado', 'mobiliado', 'fas fa-couch', 'conforto', 3),
    ('Ar Condicionado', 'ar-condicionado', 'fas fa-snowflake', 'conforto', 4),
    ('Aquecimento Solar', 'aquecimento-solar', 'fas fa-sun', 'conforto', 5),
    ('Jardim', 'jardim', 'fas fa-leaf', 'conforto', 6),
    ('Vista para o Mar', 'vista-mar', 'fas fa-water', 'conforto', 7),
    ('Pet Friendly', 'pet-friendly', 'fas fa-paw', 'conforto', 8),
    ('Acessibilidade', 'acessibilidade', 'fas fa-wheelchair', 'conforto', 9),
    ('Sacada / Varanda', 'sacada', 'fas fa-door-open', 'conforto', 10),
    ('Lareira', 'lareira', 'fas fa-fire-alt', 'conforto', 11),
    ('Closet', 'closet', 'fas fa-door-closed', 'conforto', 12),
    ('Lavabo', 'lavabo', 'fas fa-toilet', 'conforto', 13),
    ('Área de Serviço', 'area-servico', 'fas fa-tshirt', 'conforto', 14),
    ('Dependência de Empregada', 'dependencia-empregada', 'fas fa-door-open', 'conforto', 15),
    ('Hidromassagem', 'hidromassagem', 'fas fa-bath', 'conforto', 16),
    ('Armários Embutidos', 'armarios-embutidos', 'fas fa-archive', 'conforto', 17)
ON CONFLICT (slug) DO NOTHING;

-- ====================================================================
-- TABELA PRINCIPAL: imoveis
-- ====================================================================
DROP TABLE IF EXISTS public.imoveis CASCADE;
CREATE TABLE public.imoveis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Informações básicas
    titulo TEXT NOT NULL,
    slug TEXT UNIQUE,
    descricao TEXT,
    codigo TEXT UNIQUE,
    tipo imovel_tipo NOT NULL,
    finalidade imovel_finalidade NOT NULL DEFAULT 'venda',

    -- Preços
    preco NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (preco >= 0),
    preco_condominio NUMERIC(10, 2) CHECK (preco_condominio IS NULL OR preco_condominio >= 0),
    preco_iptu NUMERIC(10, 2) CHECK (preco_iptu IS NULL OR preco_iptu >= 0),
    aceita_financiamento BOOLEAN DEFAULT true,
    aceita_fgts BOOLEAN DEFAULT false,

    -- Características físicas
    area_m2 NUMERIC(8, 2) CHECK (area_m2 IS NULL OR area_m2 >= 0),
    area_construida_m2 NUMERIC(8, 2) CHECK (area_construida_m2 IS NULL OR area_construida_m2 >= 0),
    quartos INTEGER DEFAULT 0 CHECK (quartos >= 0),
    suites INTEGER DEFAULT 0 CHECK (suites >= 0),
    banheiros INTEGER DEFAULT 0 CHECK (banheiros >= 0),
    vagas_garagem INTEGER DEFAULT 0 CHECK (vagas_garagem >= 0),
    andar INTEGER,
    total_andares INTEGER,
    mobiliado BOOLEAN DEFAULT false,

    -- Localização
    endereco TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT NOT NULL,
    cidade TEXT NOT NULL DEFAULT 'São Paulo',
    estado CHAR(2) NOT NULL DEFAULT 'SP',
    cep TEXT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),

    -- Controle
    status imovel_status NOT NULL DEFAULT 'rascunho',
    destaque BOOLEAN NOT NULL DEFAULT false,
    visualizacoes INTEGER NOT NULL DEFAULT 0,

    -- SEO
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT[],

    -- Auditoria
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,

    -- Constraint: suites <= quartos
    CONSTRAINT chk_suites_quartos CHECK (suites <= quartos OR quartos = 0)
);

COMMENT ON COLUMN public.imoveis.codigo IS 'Código interno (gerado automaticamente: TL-YYYY-XXXX)';
COMMENT ON COLUMN public.imoveis.slug IS 'URL amigável (gerada automaticamente a partir do título)';

-- Índices
CREATE INDEX idx_imoveis_tipo ON public.imoveis(tipo);
CREATE INDEX idx_imoveis_finalidade ON public.imoveis(finalidade);
CREATE INDEX idx_imoveis_status ON public.imoveis(status);
CREATE INDEX idx_imoveis_destaque ON public.imoveis(destaque) WHERE destaque = true;
CREATE INDEX idx_imoveis_bairro ON public.imoveis(bairro);
CREATE INDEX idx_imoveis_cidade ON public.imoveis(cidade);
CREATE INDEX idx_imoveis_preco ON public.imoveis(preco);
CREATE INDEX idx_imoveis_quartos ON public.imoveis(quartos);
CREATE INDEX idx_imoveis_area ON public.imoveis(area_m2);
CREATE INDEX idx_imoveis_created_at ON public.imoveis(created_at DESC);
CREATE INDEX idx_imoveis_published_at ON public.imoveis(published_at DESC NULLS LAST);
CREATE INDEX idx_imoveis_slug ON public.imoveis(slug);
CREATE INDEX idx_imoveis_codigo ON public.imoveis(codigo);

-- Índice composto: filtros comuns no site público
CREATE INDEX idx_imoveis_listagem ON public.imoveis(status, finalidade, tipo, preco)
    WHERE status = 'disponivel';

-- Wrapper IMUTÁVEL para public.unaccent() — necessário porque a função original do
-- Postgres é STABLE e não pode ser usada em expressão de índice (erro 42P17)
CREATE OR REPLACE FUNCTION public.imutavel_unaccent(text)
RETURNS text AS
$$
    SELECT public.unaccent($1)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

-- Índice de busca textual (full-text search em PT-BR, sem acentos)
CREATE INDEX idx_imoveis_search ON public.imoveis
    USING gin(to_tsvector('portuguese',
        public.imutavel_unaccent(
            COALESCE(titulo, '') || ' ' ||
            COALESCE(descricao, '') || ' ' ||
            COALESCE(bairro, '') || ' ' ||
            COALESCE(cidade, '') || ' ' ||
            COALESCE(endereco, '')
        )
    ));

-- Índice trigram para buscas parciais (autocomplete)
CREATE INDEX idx_imoveis_titulo_trgm ON public.imoveis
    USING gin(public.imutavel_unaccent(lower(titulo)) gin_trgm_ops);
CREATE INDEX idx_imoveis_bairro_trgm ON public.imoveis
    USING gin(public.imutavel_unaccent(lower(bairro)) gin_trgm_ops);

-- ====================================================================
-- TABELA: imovel_fotos
-- ====================================================================
DROP TABLE IF EXISTS public.imovel_fotos CASCADE;
CREATE TABLE public.imovel_fotos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    imovel_id UUID NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    ordem INTEGER NOT NULL DEFAULT 0,
    is_cover BOOLEAN NOT NULL DEFAULT false,
    legenda TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fotos_imovel ON public.imovel_fotos(imovel_id);
CREATE INDEX idx_fotos_ordem ON public.imovel_fotos(imovel_id, ordem);

-- Garantir apenas 1 foto de capa por imóvel
CREATE UNIQUE INDEX uniq_foto_cover_per_imovel
    ON public.imovel_fotos(imovel_id)
    WHERE is_cover = true;

-- ====================================================================
-- TABELA: imovel_amenidades (relação N:N)
-- ====================================================================
DROP TABLE IF EXISTS public.imovel_amenidades CASCADE;
CREATE TABLE public.imovel_amenidades (
    imovel_id UUID NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
    amenidade_id UUID NOT NULL REFERENCES public.amenidades(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (imovel_id, amenidade_id)
);

CREATE INDEX idx_imovel_amenidades_amenidade ON public.imovel_amenidades(amenidade_id);

-- ====================================================================
-- TABELA: leads (contatos recebidos)
-- ====================================================================
DROP TABLE IF EXISTS public.leads CASCADE;
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Dados de contato
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT NOT NULL,
    telefone_alt TEXT,
    mensagem TEXT,

    -- Contexto
    imovel_id UUID REFERENCES public.imoveis(id) ON DELETE SET NULL,
    origem lead_origem NOT NULL DEFAULT 'site_formulario',
    pagina_origem TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,

    -- Gestão
    status lead_status NOT NULL DEFAULT 'novo',
    corretor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    notas_admin TEXT,
    valor_interesse NUMERIC(14, 2) CHECK (valor_interesse IS NULL OR valor_interesse >= 0),
    data_contato TIMESTAMPTZ,
    data_conversao TIMESTAMPTZ,
    arquivado BOOLEAN NOT NULL DEFAULT false,

    -- Metadata
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.leads.arquivado IS 'Se true, o lead foi descartado e sai das listagens padrão';

CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_arquivado ON public.leads(arquivado) WHERE arquivado = false;
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_imovel ON public.leads(imovel_id);
CREATE INDEX idx_leads_corretor ON public.leads(corretor_id);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_telefone ON public.leads(telefone);
CREATE INDEX idx_leads_origem ON public.leads(origem);

-- ====================================================================
-- TABELA: lead_interacoes (timeline / histórico do lead)
-- ====================================================================
DROP TABLE IF EXISTS public.lead_interacoes CASCADE;
CREATE TABLE public.lead_interacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    tipo lead_interacao_tipo NOT NULL DEFAULT 'outro',
    descricao TEXT,
    status_anterior lead_status,
    status_novo lead_status,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_interacoes_lead ON public.lead_interacoes(lead_id, created_at DESC);
CREATE INDEX idx_lead_interacoes_tipo ON public.lead_interacoes(tipo);

COMMENT ON TABLE public.lead_interacoes IS 'Timeline de interações com o lead (notas, mudanças de status, ligações, etc)';

-- ====================================================================
-- TABELA: favoritos
-- ====================================================================
DROP TABLE IF EXISTS public.favoritos CASCADE;
CREATE TABLE public.favoritos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    imovel_id UUID NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(imovel_id, session_id)
);

CREATE INDEX idx_favoritos_imovel ON public.favoritos(imovel_id);
CREATE INDEX idx_favoritos_session ON public.favoritos(session_id);
CREATE INDEX idx_favoritos_user ON public.favoritos(user_id) WHERE user_id IS NOT NULL;

-- ====================================================================
-- TABELA: imovel_visualizacoes (analytics detalhado)
-- ====================================================================
DROP TABLE IF EXISTS public.imovel_visualizacoes CASCADE;
CREATE TABLE public.imovel_visualizacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    imovel_id UUID NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
    session_id TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_views_imovel ON public.imovel_visualizacoes(imovel_id, created_at DESC);
CREATE INDEX idx_views_session ON public.imovel_visualizacoes(session_id, created_at DESC);
CREATE INDEX idx_views_created ON public.imovel_visualizacoes(created_at DESC);

-- ====================================================================
-- TABELA: audit_log (auditoria de mudanças importantes)
-- ====================================================================
DROP TABLE IF EXISTS public.audit_log CASCADE;
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tabela TEXT NOT NULL,
    registro_id UUID NOT NULL,
    acao TEXT NOT NULL CHECK (acao IN ('INSERT', 'UPDATE', 'DELETE')),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_tabela ON public.audit_log(tabela, created_at DESC);
CREATE INDEX idx_audit_registro ON public.audit_log(tabela, registro_id, created_at DESC);
CREATE INDEX idx_audit_user ON public.audit_log(user_id, created_at DESC);

COMMENT ON TABLE public.audit_log IS 'Log de auditoria para mudanças em imóveis, leads e configs';

-- ====================================================================
-- TABELA: newsletter (inscritos no boletim)
-- ====================================================================
DROP TABLE IF EXISTS public.newsletter CASCADE;
CREATE TABLE public.newsletter (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    nome TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    confirmado BOOLEAN NOT NULL DEFAULT false,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX idx_newsletter_email ON public.newsletter(email);
CREATE INDEX idx_newsletter_ativo ON public.newsletter(ativo) WHERE ativo = true;

-- ====================================================================
-- FUNCTIONS & TRIGGERS
-- ====================================================================

-- Função: updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função: gerar slug automático (com normalização de acentos)
CREATE OR REPLACE FUNCTION generate_imovel_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        -- Remove acentos, caracteres especiais, converte para lowercase
        base_slug := lower(public.unaccent(NEW.titulo));
        base_slug := regexp_replace(base_slug, '[^a-zA-Z0-9\s-]', '', 'g');
        base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
        base_slug := trim(both '-' from base_slug);
        -- Limita o tamanho
        base_slug := substring(base_slug from 1 for 80);
        final_slug := base_slug;

        WHILE EXISTS (SELECT 1 FROM public.imoveis WHERE slug = final_slug AND id IS DISTINCT FROM NEW.id) LOOP
            counter := counter + 1;
            final_slug := base_slug || '-' || counter;
        END LOOP;

        NEW.slug := final_slug;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função: gerar código interno (TL-YYYY-XXXX)
CREATE OR REPLACE FUNCTION generate_imovel_codigo()
RETURNS TRIGGER AS $$
DECLARE
    year TEXT;
    seq INTEGER;
BEGIN
    IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
        year := to_char(NOW(), 'YYYY');
        SELECT COALESCE(MAX(
            CAST(NULLIF(regexp_replace(codigo, 'TL-' || year || '-', ''), '') AS INTEGER)
        ), 0) + 1
        INTO seq
        FROM public.imoveis
        WHERE codigo LIKE 'TL-' || year || '-%';

        NEW.codigo := 'TL-' || year || '-' || LPAD(seq::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função: setar published_at automaticamente quando vira disponível
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Seta published_at quando vira disponível pela primeira vez
    IF NEW.status = 'disponivel' AND OLD.status IS DISTINCT FROM 'disponivel' AND NEW.published_at IS NULL THEN
        NEW.published_at = NOW();
    END IF;

    -- Se voltou para rascunho/reservado/vendido/alugado, mantém published_at (histórico)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função: incrementar visualizações + registrar evento
CREATE OR REPLACE FUNCTION registrar_visualizacao(
    p_imovel_id UUID,
    p_session_id TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_ip INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    -- Incrementa contador no imóvel
    UPDATE public.imoveis
    SET visualizacoes = visualizacoes + 1
    WHERE id = p_imovel_id;

    -- Registra evento detalhado
    INSERT INTO public.imovel_visualizacoes (
        imovel_id, session_id, user_id, ip_address, user_agent, referrer
    ) VALUES (
        p_imovel_id, p_session_id, p_user_id, p_ip, p_user_agent, p_referrer
    );
END;
$$ LANGUAGE plpgsql;

-- Mantém função antiga para compatibilidade (apenas incrementa o contador)
CREATE OR REPLACE FUNCTION increment_imovel_view(p_imovel_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.imoveis
    SET visualizacoes = visualizacoes + 1
    WHERE id = p_imovel_id;
END;
$$ LANGUAGE plpgsql;

-- Função: registrar interação de lead quando status muda
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO public.lead_interacoes (
            lead_id, user_id, tipo, descricao, status_anterior, status_novo
        ) VALUES (
            NEW.id, NEW.corretor_id, 'mudanca_status',
            'Status alterado de ' || OLD.status || ' para ' || NEW.status,
            OLD.status, NEW.status
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função: registrar criação de lead
CREATE OR REPLACE FUNCTION log_lead_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.lead_interacoes (
        lead_id, tipo, descricao, status_novo
    ) VALUES (
        NEW.id, 'criacao',
        'Lead recebido via ' || NEW.origem,
        NEW.status
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função: audit log em imóveis
CREATE OR REPLACE FUNCTION audit_imoveis()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_log (tabela, registro_id, acao, dados_anteriores, dados_novos)
        VALUES ('imoveis', OLD.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_log (tabela, registro_id, acao, dados_novos)
        VALUES ('imoveis', NEW.id, 'INSERT', to_jsonb(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_log (tabela, registro_id, acao, dados_anteriores)
        VALUES ('imoveis', OLD.id, 'DELETE', to_jsonb(OLD));
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar triggers em imoveis
CREATE TRIGGER tr_imoveis_updated_at
    BEFORE UPDATE ON public.imoveis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_imoveis_slug
    BEFORE INSERT ON public.imoveis
    FOR EACH ROW EXECUTE FUNCTION generate_imovel_slug();

CREATE TRIGGER tr_imoveis_codigo
    BEFORE INSERT ON public.imoveis
    FOR EACH ROW EXECUTE FUNCTION generate_imovel_codigo();

CREATE TRIGGER tr_imoveis_published_at
    BEFORE UPDATE ON public.imoveis
    FOR EACH ROW EXECUTE FUNCTION set_published_at();

CREATE TRIGGER tr_imoveis_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.imoveis
    FOR EACH ROW EXECUTE FUNCTION audit_imoveis();

-- Triggers em leads
CREATE TRIGGER tr_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_leads_creation_log
    AFTER INSERT ON public.leads
    FOR EACH ROW EXECUTE FUNCTION log_lead_creation();

CREATE TRIGGER tr_leads_status_log
    AFTER UPDATE OF status ON public.leads
    FOR EACH ROW EXECUTE FUNCTION log_lead_status_change();

-- Trigger em users
CREATE TRIGGER tr_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger em site_config
CREATE OR REPLACE FUNCTION update_site_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_site_config_updated_at
    BEFORE UPDATE ON public.site_config
    FOR EACH ROW EXECUTE FUNCTION update_site_config_updated_at();

-- Trigger: criar registro em users quando alguém se cadastra no Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, nome, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
        'corretor'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ====================================================================
-- VIEWS
-- ====================================================================

-- View: imóveis publicados com foto de capa
CREATE OR REPLACE VIEW public.v_imoveis_publicados AS
SELECT
    i.*,
    f.url AS cover_url,
    f.storage_path AS cover_path,
    u.nome AS corretor_nome,
    u.telefone AS corretor_telefone,
    u.email AS corretor_email,
    u.creci AS corretor_creci,
    (SELECT COUNT(*) FROM public.imovel_fotos WHERE imovel_id = i.id) AS total_fotos
FROM public.imoveis i
LEFT JOIN public.imovel_fotos f
    ON f.imovel_id = i.id AND f.is_cover = true
LEFT JOIN public.users u
    ON u.id = i.created_by
WHERE i.status = 'disponivel';

-- View: detalhes completos do imóvel (para página de detalhes)
CREATE OR REPLACE VIEW public.v_imovel_detalhes AS
SELECT
    i.*,
    u.nome AS corretor_nome,
    u.telefone AS corretor_telefone,
    u.email AS corretor_email,
    u.creci AS corretor_creci,
    u.avatar_url AS corretor_avatar
FROM public.imoveis i
LEFT JOIN public.users u ON u.id = i.created_by
WHERE i.status = 'disponivel';

-- View: estatísticas mensais de leads
CREATE OR REPLACE VIEW public.v_leads_stats AS
SELECT
    date_trunc('month', created_at) AS mes,
    COUNT(*) AS total_leads,
    COUNT(*) FILTER (WHERE status = 'novo') AS novos,
    COUNT(*) FILTER (WHERE status = 'contatado') AS contatados,
    COUNT(*) FILTER (WHERE status = 'visita_agendada') AS visitas_agendadas,
    COUNT(*) FILTER (WHERE status = 'proposta_enviada') AS propostas_enviadas,
    COUNT(*) FILTER (WHERE status = 'convertido') AS convertidos,
    COUNT(*) FILTER (WHERE status = 'perdido') AS perdidos
FROM public.leads
WHERE arquivado = false
GROUP BY date_trunc('month', created_at)
ORDER BY mes DESC;

-- View: imóveis mais vistos (top 20)
CREATE OR REPLACE VIEW public.v_imoveis_mais_vistos AS
SELECT
    id, titulo, slug, codigo, bairro, cidade, preco, visualizacoes, status
FROM public.imoveis
WHERE status = 'disponivel'
ORDER BY visualizacoes DESC
LIMIT 20;

-- View: dashboard resumo
CREATE OR REPLACE VIEW public.v_dashboard_resumo AS
SELECT
    (SELECT COUNT(*) FROM public.imoveis WHERE status = 'disponivel') AS imoveis_disponiveis,
    (SELECT COUNT(*) FROM public.imoveis WHERE status = 'reservado') AS imoveis_reservados,
    (SELECT COUNT(*) FROM public.imoveis WHERE status = 'vendido') AS imoveis_vendidos,
    (SELECT COUNT(*) FROM public.imoveis WHERE status = 'alugado') AS imoveis_alugados,
    (SELECT COUNT(*) FROM public.imoveis WHERE destaque = true AND status = 'disponivel') AS imoveis_destaque,
    (SELECT COUNT(*) FROM public.leads WHERE status = 'novo' AND arquivado = false) AS leads_novos,
    (SELECT COUNT(*) FROM public.leads WHERE status = 'convertido' AND arquivado = false) AS leads_convertidos,
    (SELECT COALESCE(SUM(visualizacoes), 0) FROM public.imoveis) AS total_visualizacoes,
    (SELECT COUNT(*) FROM public.imovel_visualizacoes WHERE created_at >= NOW() - INTERVAL '7 days') AS views_ultimos_7_dias,
    (SELECT COUNT(*) FROM public.leads WHERE created_at >= NOW() - INTERVAL '7 days') AS leads_ultimos_7_dias;

-- ====================================================================
-- FUNCTIONS RPC ÚTEIS PARA O FRONTEND
-- ====================================================================

-- Função: busca unificada de imóveis com filtros
CREATE OR REPLACE FUNCTION buscar_imoveis(
    p_tipo TEXT DEFAULT NULL,
    p_finalidade TEXT DEFAULT NULL,
    p_bairro TEXT DEFAULT NULL,
    p_cidade TEXT DEFAULT NULL,
    p_preco_min NUMERIC DEFAULT NULL,
    p_preco_max NUMERIC DEFAULT NULL,
    p_quartos_min INTEGER DEFAULT NULL,
    p_area_min NUMERIC DEFAULT NULL,
    p_destaque BOOLEAN DEFAULT NULL,
    p_busca TEXT DEFAULT NULL,
    p_ordenacao TEXT DEFAULT 'recentes', -- recentes | preco_asc | preco_desc | visualizacoes
    p_limite INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    titulo TEXT,
    slug TEXT,
    descricao TEXT,
    codigo TEXT,
    tipo imovel_tipo,
    finalidade imovel_finalidade,
    preco NUMERIC,
    preco_condominio NUMERIC,
    preco_iptu NUMERIC,
    area_m2 NUMERIC,
    quartos INTEGER,
    suites INTEGER,
    banheiros INTEGER,
    vagas_garagem INTEGER,
    bairro TEXT,
    cidade TEXT,
    estado CHAR(2),
    status imovel_status,
    destaque BOOLEAN,
    visualizacoes INTEGER,
    cover_url TEXT,
    corretor_nome TEXT,
    corretor_telefone TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_ordem TEXT;
BEGIN
    -- Mapear ordenação
    v_ordem := CASE p_ordenacao
        WHEN 'preco_asc' THEN 'preco ASC'
        WHEN 'preco_desc' THEN 'preco DESC'
        WHEN 'visualizacoes' THEN 'visualizacoes DESC'
        ELSE 'created_at DESC'
    END;

    RETURN QUERY EXECUTE format('
        SELECT
            i.id, i.titulo, i.slug, i.descricao, i.codigo,
            i.tipo, i.finalidade, i.preco, i.preco_condominio, i.preco_iptu,
            i.area_m2, i.quartos, i.suites, i.banheiros, i.vagas_garagem,
            i.bairro, i.cidade, i.estado, i.status, i.destaque, i.visualizacoes,
            f.url AS cover_url,
            u.nome AS corretor_nome,
            u.telefone AS corretor_telefone,
            i.created_at
        FROM public.imoveis i
        LEFT JOIN public.imovel_fotos f ON f.imovel_id = i.id AND f.is_cover = true
        LEFT JOIN public.users u ON u.id = i.created_by
        WHERE i.status = ''disponivel''
            AND ($1 IS NULL OR i.tipo::text = $1)
            AND ($2 IS NULL OR i.finalidade::text = $2)
            AND ($3 IS NULL OR public.unaccent(lower(i.bairro)) LIKE ''%%'' || public.unaccent(lower($3)) || ''%%'')
            AND ($4 IS NULL OR public.unaccent(lower(i.cidade)) LIKE ''%%'' || public.unaccent(lower($4)) || ''%%'')
            AND ($5 IS NULL OR i.preco >= $5)
            AND ($6 IS NULL OR i.preco <= $6)
            AND ($7 IS NULL OR i.quartos >= $7)
            AND ($8 IS NULL OR i.area_m2 >= $8)
            AND ($9 IS NULL OR i.destaque = $9)
            AND ($10 IS NULL OR (
                to_tsvector(''portuguese'', public.unaccent(COALESCE(i.titulo, '''') || '' '' ||
                    COALESCE(i.descricao, '''') || '' '' || COALESCE(i.bairro, '''') || '' '' ||
                    COALESCE(i.cidade, '''')))
                @@ plainto_tsquery(''portuguese'', public.unaccent($10))
            ))
        ORDER BY i.destaque DESC, ' || v_ordem || '
        LIMIT $11 OFFSET $12
    ', v_ordem)
    USING p_tipo, p_finalidade, p_bairro, p_cidade, p_preco_min, p_preco_max,
          p_quartos_min, p_area_min, p_destaque, p_busca, p_limite, p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Função: contar imóveis com filtros
CREATE OR REPLACE FUNCTION contar_imoveis(
    p_tipo TEXT DEFAULT NULL,
    p_finalidade TEXT DEFAULT NULL,
    p_bairro TEXT DEFAULT NULL,
    p_cidade TEXT DEFAULT NULL,
    p_preco_min NUMERIC DEFAULT NULL,
    p_preco_max NUMERIC DEFAULT NULL,
    p_quartos_min INTEGER DEFAULT NULL,
    p_area_min NUMERIC DEFAULT NULL,
    p_destaque BOOLEAN DEFAULT NULL,
    p_busca TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    v_total BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_total
    FROM public.imoveis i
    WHERE i.status = 'disponivel'
        AND (p_tipo IS NULL OR i.tipo::text = p_tipo)
        AND (p_finalidade IS NULL OR i.finalidade::text = p_finalidade)
        AND (p_bairro IS NULL OR public.unaccent(lower(i.bairro)) LIKE '%' || public.unaccent(lower(p_bairro)) || '%')
        AND (p_cidade IS NULL OR public.unaccent(lower(i.cidade)) LIKE '%' || public.unaccent(lower(p_cidade)) || '%')
        AND (p_preco_min IS NULL OR i.preco >= p_preco_min)
        AND (p_preco_max IS NULL OR i.preco <= p_preco_max)
        AND (p_quartos_min IS NULL OR i.quartos >= p_quartos_min)
        AND (p_area_min IS NULL OR i.area_m2 >= p_area_min)
        AND (p_destaque IS NULL OR i.destaque = p_destaque)
        AND (p_busca IS NULL OR (
            to_tsvector('portuguese', public.unaccent(COALESCE(i.titulo, '') || ' ' ||
                COALESCE(i.descricao, '') || ' ' || COALESCE(i.bairro, '') || ' ' ||
                COALESCE(i.cidade, '')))
            @@ plainto_tsquery('portuguese', public.unaccent(p_busca))
        ));
    RETURN v_total;
END;
$$ LANGUAGE plpgsql STABLE;

-- Função: marcar lead como contatado automaticamente
CREATE OR REPLACE FUNCTION marcar_lead_contatado(p_lead_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.leads
    SET status = 'contatado',
        data_contato = COALESCE(data_contato, NOW()),
        updated_at = NOW()
    WHERE id = p_lead_id AND status = 'novo';
END;
$$ LANGUAGE plpgsql;

-- Função: estatísticas de imóveis por bairro
CREATE OR REPLACE FUNCTION stats_por_bairro(p_cidade TEXT DEFAULT 'São Paulo')
RETURNS TABLE (
    bairro TEXT,
    total BIGINT,
    preco_medio NUMERIC,
    preco_min NUMERIC,
    preco_max NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.bairro,
        COUNT(*)::BIGINT AS total,
        AVG(i.preco)::NUMERIC(14,2) AS preco_medio,
        MIN(i.preco)::NUMERIC(14,2) AS preco_min,
        MAX(i.preco)::NUMERIC(14,2) AS preco_max
    FROM public.imoveis i
    WHERE i.status = 'disponivel'
        AND (p_cidade IS NULL OR public.unaccent(lower(i.cidade)) = public.unaccent(lower(p_cidade)))
    GROUP BY i.bairro
    ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imoveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imovel_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imovel_amenidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imovel_visualizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter ENABLE ROW LEVEL SECURITY;

-- Funções helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin' AND ativo = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND ativo = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Impede que um usuário não-admin altere o próprio cargo (role) ou status (ativo).
-- Sem isso, a política "users_update_own" permitiria que qualquer usuário
-- autenticado se auto-promovesse a admin.
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.is_admin() THEN
        IF NEW.role IS DISTINCT FROM OLD.role OR NEW.ativo IS DISTINCT FROM OLD.ativo THEN
            RAISE EXCEPTION 'Apenas administradores podem alterar cargo ou status de usuários';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.users;
CREATE TRIGGER trg_prevent_role_escalation
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_role_escalation();

-- POLÍTICAS

-- USERS
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "users_admin_insert" ON public.users;
CREATE POLICY "users_admin_insert" ON public.users
    FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "users_admin_delete" ON public.users;
CREATE POLICY "users_admin_delete" ON public.users
    FOR DELETE USING (public.is_admin());

-- IMÓVEIS
DROP POLICY IF EXISTS "imoveis_public_read" ON public.imoveis;
CREATE POLICY "imoveis_public_read" ON public.imoveis
    FOR SELECT USING (status = 'disponivel' OR public.is_staff());

DROP POLICY IF EXISTS "imoveis_staff_write" ON public.imoveis;
CREATE POLICY "imoveis_staff_write" ON public.imoveis
    FOR ALL USING (public.is_staff())
    WITH CHECK (public.is_staff());

-- FOTOS
DROP POLICY IF EXISTS "fotos_public_read" ON public.imovel_fotos;
CREATE POLICY "fotos_public_read" ON public.imovel_fotos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.imoveis i
            WHERE i.id = imovel_id AND (i.status = 'disponivel' OR public.is_staff())
        )
    );

DROP POLICY IF EXISTS "fotos_staff_all" ON public.imovel_fotos;
CREATE POLICY "fotos_staff_all" ON public.imovel_fotos
    FOR ALL USING (public.is_staff())
    WITH CHECK (public.is_staff());

-- AMENIDADES
DROP POLICY IF EXISTS "amenidades_public_read" ON public.amenidades;
CREATE POLICY "amenidades_public_read" ON public.amenidades
    FOR SELECT USING (ativo = true OR public.is_staff());

DROP POLICY IF EXISTS "amenidades_admin_all" ON public.amenidades;
CREATE POLICY "amenidades_admin_all" ON public.amenidades
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- IMOVEL_AMENIDADES
DROP POLICY IF EXISTS "imovel_amenidades_public_read" ON public.imovel_amenidades;
CREATE POLICY "imovel_amenidades_public_read" ON public.imovel_amenidades
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.imoveis i
            WHERE i.id = imovel_id AND (i.status = 'disponivel' OR public.is_staff())
        )
    );

DROP POLICY IF EXISTS "imovel_amenidades_staff_all" ON public.imovel_amenidades;
CREATE POLICY "imovel_amenidades_staff_all" ON public.imovel_amenidades
    FOR ALL USING (public.is_staff())
    WITH CHECK (public.is_staff());

-- LEADS (público pode inserir, staff pode ler/editar)
DROP POLICY IF EXISTS "leads_public_insert" ON public.leads;
CREATE POLICY "leads_public_insert" ON public.leads
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "leads_staff_read" ON public.leads;
CREATE POLICY "leads_staff_read" ON public.leads
    FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "leads_staff_update" ON public.leads;
CREATE POLICY "leads_staff_update" ON public.leads
    FOR UPDATE USING (public.is_staff());

DROP POLICY IF EXISTS "leads_admin_delete" ON public.leads;
CREATE POLICY "leads_admin_delete" ON public.leads
    FOR DELETE USING (public.is_admin());

-- LEAD_INTERACOES (só staff)
DROP POLICY IF EXISTS "lead_interacoes_staff_all" ON public.lead_interacoes;
CREATE POLICY "lead_interacoes_staff_all" ON public.lead_interacoes
    FOR ALL USING (public.is_staff())
    WITH CHECK (public.is_staff());

-- FAVORITOS (qualquer pessoa pode favoritar/desfavoritar - dado não sensível,
-- vinculado a um session_id anônimo, sem autenticação real por trás).
-- Sem UPDATE: a tabela só é criada e apagada, nunca alterada.
DROP POLICY IF EXISTS "favoritos_public_all" ON public.favoritos;

DROP POLICY IF EXISTS "favoritos_public_insert" ON public.favoritos;
CREATE POLICY "favoritos_public_insert" ON public.favoritos
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "favoritos_public_select" ON public.favoritos;
CREATE POLICY "favoritos_public_select" ON public.favoritos
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "favoritos_public_delete" ON public.favoritos;
CREATE POLICY "favoritos_public_delete" ON public.favoritos
    FOR DELETE USING (true);

-- VISUALIZAÇÕES (qualquer pessoa pode registrar, staff lê)
DROP POLICY IF EXISTS "views_public_insert" ON public.imovel_visualizacoes;
CREATE POLICY "views_public_insert" ON public.imovel_visualizacoes
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "views_staff_read" ON public.imovel_visualizacoes;
CREATE POLICY "views_staff_read" ON public.imovel_visualizacoes
    FOR SELECT USING (public.is_staff());

-- SITE_CONFIG (público lê, admin edita)
DROP POLICY IF EXISTS "site_config_public_read" ON public.site_config;
CREATE POLICY "site_config_public_read" ON public.site_config
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "site_config_admin_write" ON public.site_config;
CREATE POLICY "site_config_admin_write" ON public.site_config
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- AUDIT_LOG (só admin lê)
DROP POLICY IF EXISTS "audit_log_admin_read" ON public.audit_log;
CREATE POLICY "audit_log_admin_read" ON public.audit_log
    FOR SELECT USING (public.is_admin());

-- NEWSLETTER (público pode se inscrever, staff lê)
DROP POLICY IF EXISTS "newsletter_public_insert" ON public.newsletter;
CREATE POLICY "newsletter_public_insert" ON public.newsletter
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "newsletter_staff_read" ON public.newsletter;
CREATE POLICY "newsletter_staff_read" ON public.newsletter
    FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "newsletter_staff_update" ON public.newsletter;
CREATE POLICY "newsletter_staff_update" ON public.newsletter
    FOR UPDATE USING (public.is_staff());

-- ====================================================================
-- STORAGE POLICIES
-- ====================================================================
-- (Executar também no painel Storage ou via SQL abaixo)

-- Permitir leitura pública das fotos
DROP POLICY IF EXISTS "fotos_storage_public_read" ON storage.objects;
CREATE POLICY "fotos_storage_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'imoveis-fotos');

-- Permitir upload apenas autenticado
DROP POLICY IF EXISTS "fotos_storage_auth_upload" ON storage.objects;
CREATE POLICY "fotos_storage_auth_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'imoveis-fotos'
        AND auth.role() = 'authenticated'
    );

-- Permitir delete apenas autenticado
DROP POLICY IF EXISTS "fotos_storage_auth_delete" ON storage.objects;
CREATE POLICY "fotos_storage_auth_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'imoveis-fotos'
        AND auth.role() = 'authenticated'
    );

-- Permitir update apenas autenticado
DROP POLICY IF EXISTS "fotos_storage_auth_update" ON storage.objects;
CREATE POLICY "fotos_storage_auth_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'imoveis-fotos'
        AND auth.role() = 'authenticated'
    );

-- ====================================================================
-- DADOS DE EXEMPLO (OPCIONAL - para desenvolvimento)
-- ====================================================================
-- Descomente as linhas abaixo se quiser popular com dados de teste:

/*
INSERT INTO public.imoveis (titulo, descricao, tipo, finalidade, preco, bairro, cidade, quartos, banheiros, vagas_garagem, area_m2, status, destaque) VALUES
    ('Apartamento Luxo Vista Mar', 'Apartamento de alto padrão com vista deslumbrante para o mar.', 'apartamento', 'venda', 1200000.00, 'Bela Vista', 'São Paulo', 3, 2, 2, 95.5, 'disponivel', true),
    ('Casa Térrea com Piscina', 'Casa ampla com piscina, churrasqueira e jardim.', 'casa', 'venda', 850000.00, 'Jardins', 'São Paulo', 4, 3, 4, 220.0, 'disponivel', true),
    ('Cobertura Duplex', 'Cobertura duplex com terraço e vista panorâmica.', 'cobertura', 'venda', 2500000.00, 'Vila Mariana', 'São Paulo', 4, 4, 3, 280.0, 'disponivel', false),
    ('Apartamento Compacto', 'Apartamento compacto, ideal para investimento.', 'apartamento', 'venda', 250000.00, 'Centro', 'São Paulo', 1, 1, 1, 45.0, 'disponivel', false),
    ('Terreno em Condomínio', 'Terreno plano em condomínio fechado.', 'terreno', 'venda', 450000.00, 'Alphaville', 'São Paulo', 0, 0, 0, 600.0, 'disponivel', false);
*/

-- ====================================================================
-- FIM DO SCHEMA
-- ====================================================================
-- Após rodar este script:
-- 1. Crie o bucket 'imoveis-fotos' no Storage (público)
-- 2. Faça o primeiro signup em Authentication > Users
-- 3. Promova o usuário a admin:
--    UPDATE public.users SET role = 'admin' WHERE email = 'seu@email.com';
-- 4. Use as credenciais do projeto no arquivo js/supabase-config.js
-- 5. Use as funções RPC:
--    SELECT * FROM buscar_imoveis(p_tipo := 'apartamento', p_quartos_min := 2);
--    SELECT * FROM contar_imoveis();
--    SELECT * FROM v_dashboard_resumo;
--    SELECT * FROM stats_por_bairro();
-- ====================================================================