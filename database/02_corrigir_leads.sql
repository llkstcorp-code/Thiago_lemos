-- ====================================================================
-- CORREÇÃO: leads do formulário do site não estavam sendo gravados
-- ====================================================================
--
-- SINTOMA
--   Quem preenchia o formulário de contato era levado ao WhatsApp
--   normalmente, mas nada aparecia na aba Leads do painel admin.
--   No console do navegador:
--     new row violates row-level security policy for table "lead_interacoes"
--
-- CAUSA
--   O gatilho tr_leads_creation_log grava uma linha em lead_interacoes
--   a cada lead novo. A função rodava com a permissão de quem fez o
--   INSERT — o visitante anônimo — e a política lead_interacoes_staff_all
--   só permite staff. O gatilho era barrado e derrubava o INSERT inteiro.
--
--   (A outra metade do problema estava no site, que pedia a linha de volta
--   com .insert().select(); isso já foi corrigido em js/supabase-api.js.)
--
-- COMO RODAR
--   Supabase → SQL Editor → cole tudo → Run.
--   Pode rodar mais de uma vez sem problema.
-- ====================================================================


-- --------------------------------------------------------------------
-- 1. O gatilho passa a rodar com a permissão de quem o criou
-- --------------------------------------------------------------------
-- SECURITY DEFINER faz a função executar com os privilégios do dono
-- (postgres), e não os do visitante. Assim ela consegue escrever em
-- lead_interacoes sem que a tabela precise ficar aberta a ninguém.
--
-- O SET search_path é obrigatório em função SECURITY DEFINER: sem ele,
-- alguém poderia apontar "public" para um schema próprio e fazer a
-- função executar código dele com privilégio elevado.

CREATE OR REPLACE FUNCTION log_lead_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;


-- --------------------------------------------------------------------
-- 2. Restringir o que um visitante anônimo pode gravar em leads
-- --------------------------------------------------------------------
-- A política atual é WITH CHECK (true): qualquer pessoa com a chave
-- pública (que está no JS do site, e isso é normal) pode inserir uma
-- linha com QUALQUER conteúdo — inclusive se atribuir a um corretor,
-- escrever em notas_admin, ou já nascer com status 'convertido'.
--
-- A política abaixo continua deixando o formulário funcionar, mas exige
-- que o lead tenha a forma de um lead de verdade.

DROP POLICY IF EXISTS "leads_public_insert" ON public.leads;

CREATE POLICY "leads_public_insert" ON public.leads
    FOR INSERT
    WITH CHECK (
        -- Lead novo sempre entra como 'novo'
        status = 'novo'
        -- Só as origens que o site realmente usa
        AND origem IN ('site_formulario', 'site_busca')
        -- Campos de gestão são exclusivos do painel admin
        AND corretor_id IS NULL
        AND notas_admin IS NULL
        AND valor_interesse IS NULL
        AND data_contato IS NULL
        AND data_conversao IS NULL
        AND arquivado = false
        -- Tamanhos sensatos (mesmos limites aplicados no formulário)
        AND char_length(nome) BETWEEN 2 AND 100
        AND char_length(email) BETWEEN 5 AND 150
        AND char_length(telefone) BETWEEN 8 AND 20
        AND char_length(COALESCE(mensagem, '')) <= 2000
    );


-- --------------------------------------------------------------------
-- 3. Conferência
-- --------------------------------------------------------------------
-- Deve retornar prosecdef = true para log_lead_creation.
SELECT proname AS funcao, prosecdef AS security_definer
FROM pg_proc
WHERE proname = 'log_lead_creation';
