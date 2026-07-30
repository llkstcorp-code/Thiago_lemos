/**
 * ====================================================================
 * CONFIGURAÇÃO DO SUPABASE - FRONTEND PÚBLICO
 * ====================================================================
 *
 * COMO CONFIGURAR:
 * 1. Acesse https://supabase.com e crie sua conta
 * 2. Crie um novo projeto (escolha a região São Paulo)
 * 3. Vá em Settings > API
 * 4. Copie a "Project URL" e a "anon public key"
 * 5. Cole nos campos abaixo
 * 6. Rode o arquivo database/schema.sql no SQL Editor
 * 7. Crie o bucket 'imoveis-fotos' no Storage (público)
 *
 * IMPORTANTE: Se você NÃO configurou o Supabase ainda, o site continua
 * funcionando normalmente usando os imóveis estáticos do HTML.
 * ====================================================================
 */

const SUPABASE_CONFIG = {
    url: 'https://mrbbuykzuriajmjzmrde.supabase.co',
    anonKey: 'sb_publishable_e1QrBgAYo4J0H5K7gjHUNA_AwNKAYR0'
};
// Flag para saber se o Supabase está realmente configurado
const SUPABASE_CONFIGURED = !(
    !SUPABASE_CONFIG.url ||
    SUPABASE_CONFIG.url.includes('SEU-PROJETO') ||
    !SUPABASE_CONFIG.anonKey ||
    SUPABASE_CONFIG.anonKey.includes('SUA-ANON-KEY')
);

// Inicializar cliente Supabase apenas se:
// 1. A biblioteca estiver disponível (carregada via CDN)
// 2. As credenciais estiverem preenchidas
let supabase = null;

if (SUPABASE_CONFIGURED && typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    try {
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
            auth: {
                persistSession: false,   // site público não precisa persistir sessão
                autoRefreshToken: false
            }
        });
        console.log('✅ Supabase conectado:', SUPABASE_CONFIG.url);
    } catch (err) {
        console.warn('⚠️ Falha ao inicializar Supabase. Site seguirá funcionando normalmente.', err.message);
        supabase = null;
    }
} else if (!SUPABASE_CONFIGURED) {
    console.log('%c⚠️ Supabase não configurado.', 'color: #ffb800; font-weight: bold;');
    console.log('O site está funcionando normalmente com imóveis estáticos.');
    console.log('Para conectar ao banco, edite o arquivo js/supabase-config.js');
} else {
    console.warn('⚠️ Biblioteca do Supabase não foi carregada (CDN indisponível?). Site seguirá funcionando normalmente.');
}

// Defesa adicional: se algo chamar window.supabaseClient e a biblioteca
// não estiver disponível, expõe um objeto vazio para não quebrar o resto do site.
if (typeof window.supabase === 'undefined') {
    window.supabase = { createClient: null };
}

// Exportar para uso global
window.supabaseClient = supabase;
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.SUPABASE_CONFIGURED = SUPABASE_CONFIGURED;
