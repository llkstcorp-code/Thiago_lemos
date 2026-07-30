-- ====================================================================
-- 🚀 SETUP ADMIN THIAGO LEMOS IMÓVEIS
-- ====================================================================
-- Este script configura TUDO o que você precisa no Supabase:
--   1. Cria o usuário admin no Auth (edite v_email/v_senha_inicial abaixo antes de rodar)
--   2. Promove esse usuário a admin no banco
--   3. Configura amenidades padrão
--   4. Configura os dados de contato do site
--
-- ⚠️  IMPORTANTE: rode este script DEPOIS do schema.sql principal.
-- ⚠️  IMPORTANTE: edite v_email e v_senha_inicial com dados reais antes de
--     rodar, e troque a senha pelo painel do Supabase logo depois do primeiro
--     login. Nunca deixe uma senha real gravada neste arquivo.
-- ====================================================================

-- ====================================================================
-- 1. CRIAR USUÁRIO ADMIN NO SUPABASE AUTH
-- ====================================================================
-- O Supabase Auth normalmente exige confirmação por e-mail, mas
-- podemos criar o usuário já confirmado usando a função admin.
-- ====================================================================

-- ⚠️ ANTES DE RODAR: troque os valores abaixo pelos dados reais do admin.
-- Nunca deixe uma senha real gravada neste arquivo — ele fica salvo em disco
-- junto com o resto do site. Depois de rodar o script, é recomendável também
-- trocar a senha pelo painel do Supabase (Authentication → Users → Reset password),
-- assim a senha usada aqui deixa de ser válida mesmo que este arquivo vaze.
DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'TROQUE-PELO-EMAIL-DO-ADMIN@exemplo.com';
    v_senha_inicial TEXT := 'TROQUE-POR-UMA-SENHA-FORTE-E-UNICA';
    v_nome TEXT := 'Thiago Lemos';
BEGIN
    -- Verifica se o usuário já existe
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
        -- Cria o usuário já confirmado (bypassa confirmação por e-mail)
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_senha_inicial, gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('nome', v_nome),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        )
        RETURNING id INTO v_user_id;

        RAISE NOTICE '✅ Usuário criado com ID: %', v_user_id;
    ELSE
        RAISE NOTICE 'ℹ️  Usuário já existia com ID: %', v_user_id;
    END IF;

    -- Garante que o profile existe na tabela public.users
    INSERT INTO public.users (id, email, nome, role, ativo)
    VALUES (v_user_id, v_email, v_nome, 'admin', true)
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin',
        ativo = true,
        nome = v_nome,
        updated_at = NOW();

    RAISE NOTICE '✅ Usuário promovido a ADMIN no banco';
END $$;

-- ====================================================================
-- 2. CONFIGURAR AMENIDADES PADRÃO
-- ====================================================================
-- Se as amenidades não existirem, cria as principais.
-- Idempotente: pode rodar várias vezes.
-- ====================================================================

INSERT INTO public.amenidades (nome, slug, icone, categoria) VALUES
    ('Piscina', 'piscina', 'fas fa-swimming-pool', 'lazer'),
    ('Churrasqueira', 'churrasqueira', 'fas fa-fire', 'lazer'),
    ('Academia', 'academia', 'fas fa-dumbbell', 'lazer'),
    ('Salão de Festas', 'salao-de-festas', 'fas fa-glass-cheers', 'lazer'),
    ('Playground', 'playground', 'fas fa-child', 'lazer'),
    ('Quadra Esportiva', 'quadra-esportiva', 'fas fa-basketball-ball', 'lazer'),
    ('Sauna', 'sauna', 'fas fa-hot-tub', 'lazer'),
    ('Espaço Gourmet', 'espaco-gourmet', 'fas fa-utensils', 'lazer'),
    ('Garagem Coberta', 'garagem-coberta', 'fas fa-car', 'conforto'),
    ('Portaria 24h', 'portaria-24h', 'fas fa-shield-alt', 'seguranca'),
    ('Câmeras de Segurança', 'cameras-de-seguranca', 'fas fa-video', 'seguranca'),
    ('Elevador', 'elevador', 'fas fa-arrow-up', 'conforto'),
    ('Mobiliado', 'mobiliado', 'fas fa-couch', 'conforto'),
    ('Ar Condicionado', 'ar-condicionado', 'fas fa-snowflake', 'conforto'),
    ('Aquecimento Solar', 'aquecimento-solar', 'fas fa-sun', 'sustentabilidade'),
    ('Energia Solar', 'energia-solar', 'fas fa-solar-panel', 'sustentabilidade'),
    ('Jardim', 'jardim', 'fas fa-leaf', 'lazer'),
    ('Pet Friendly', 'pet-friendly', 'fas fa-paw', 'conforto'),
    ('Acessibilidade', 'acessibilidade', 'fas fa-wheelchair', 'acessibilidade'),
    ('Internet Fibra', 'internet-fibra', 'fas fa-wifi', 'conforto')
ON CONFLICT (nome) DO NOTHING;

-- ====================================================================
-- 3. CONFIGURAR DADOS DE CONTATO DO SITE
-- ====================================================================
-- Esses dados aparecem no rodapé e na seção de contato.
-- Edite os valores abaixo com os dados reais do Thiago.
-- ====================================================================

INSERT INTO public.site_config (chave, valor, descricao) VALUES
    ('telefone_principal', '+55 (35) 99741-8298', 'Telefone exibido no site'),
    ('whatsapp', '5535997418298', 'WhatsApp (apenas números, com DDI 55)'),
    ('email_contato', 'thiago10lemos10@gmail.com', 'E-mail principal de contato'),
    ('endereco_completo', 'Rua Paraná, 301 - Passos/MG', 'Endereço do escritório'),
    ('creci', '35.314', 'Número do CRECI'),
    ('horario_atendimento', 'Seg-Sex: 9h-19h | Sáb: 9h-14h', 'Horário de funcionamento'),
    ('instagram_url', 'https://www.instagram.com/thiagolemos3/', 'Instagram'),
    ('facebook_url', 'https://www.facebook.com/thiago.agiliza.9', 'Facebook'),
    ('youtube_url', '', 'YouTube'),
    ('linkedin_url', '', 'LinkedIn'),
    ('tiktok_url', '', 'TikTok'),
    ('meta_title', 'Thiago Lemos Imóveis | O Imóvel dos Seus Sonhos', 'Título SEO padrão'),
    ('meta_description', 'Encontre o imóvel dos seus sonhos com atendimento personalizado, transparência e exclusividade.', 'Descrição SEO padrão'),
    ('mostrar_preco', 'true', 'Exibir preços publicamente'),
    ('itens_por_pagina', '12', 'Quantos imóveis por página')
ON CONFLICT (chave) DO UPDATE
SET valor = EXCLUDED.valor,
    updated_at = NOW();

-- ====================================================================
-- 4. VERIFICAÇÃO FINAL
-- ====================================================================
-- Mostra o status da configuração. Se tudo deu certo você vai ver:
--   ✅ Usuário admin ativo
--   ✅ 20 amenidades cadastradas
--   ✅ 15 configurações do site
-- ====================================================================

DO $$
DECLARE
    v_admin_count INT;
    v_amenidades_count INT;
    v_config_count INT;
BEGIN
    SELECT COUNT(*) INTO v_admin_count FROM public.users WHERE role = 'admin' AND ativo = true;
    SELECT COUNT(*) INTO v_amenidades_count FROM public.amenidades;
    SELECT COUNT(*) INTO v_config_count FROM public.site_config;

    RAISE NOTICE '';
    RAISE NOTICE '====================================================================';
    RAISE NOTICE '🎉 SETUP CONCLUÍDO COM SUCESSO!';
    RAISE NOTICE '====================================================================';
    RAISE NOTICE '👤 Administradores ativos: %', v_admin_count;
    RAISE NOTICE '🏷️  Amenidades cadastradas: %', v_amenidades_count;
    RAISE NOTICE '⚙️  Configurações do site: %', v_config_count;
    RAISE NOTICE '';
    RAISE NOTICE '➡️  PRÓXIMO PASSO:';
    RAISE NOTICE '    1. Copie a Project URL e a anon key em Settings → API';
    RAISE NOTICE '    2. Cole no arquivo js/supabase-config.js';
    RAISE NOTICE '    3. Crie o bucket "imoveis-fotos" (público) em Storage';
    RAISE NOTICE '    4. Troque a senha em Authentication → Users → Reset password';
    RAISE NOTICE '       (a senha usada neste script não deve continuar sendo a definitiva)';
    RAISE NOTICE '    5. Abra admin/index.html e faça login';
    RAISE NOTICE '====================================================================';
END $$;

-- Mostra os dados do admin criado (sem expor a senha)
SELECT
    u.id,
    u.email,
    u.nome,
    u.role,
    u.ativo,
    u.created_at
FROM public.users u
ORDER BY u.created_at DESC
LIMIT 5;