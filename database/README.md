# 🗄️ Setup do Banco de Dados — Thiago Lemos Imóveis

Guia completo para colocar o banco de dados no ar com Supabase.

---

## 📋 Pré-requisitos

- Conta de e-mail (Gmail, Outlook, etc)
- ~20 minutos de tempo
- Navegador moderno (Chrome, Edge, Firefox)

---

## 🚀 Passo a Passo

### 1️⃣ Criar conta no Supabase

1. Acesse **[supabase.com](https://supabase.com)**
2. Clique em **"Start your project"**
3. Faça login com GitHub (recomendado) ou e-mail
4. Confirme o e-mail se necessário

---

### 2️⃣ Criar novo projeto

1. No painel, clique em **"New Project"**
2. Preencha:
   - **Name:** `thiago-lemos-imoveis`
   - **Database Password:** (crie uma senha FORTE e anote)
   - **Region:** `South America (São Paulo)` ← IMPORTANTE para performance
3. Clique em **"Create new project"**
4. ⏳ Aguarde 1-2 minutos enquanto o projeto é provisionado

---

### 3️⃣ Rodar o Schema do Banco

1. No menu lateral, vá em **SQL Editor** (ícone de banco de dados)
2. Clique em **"+ New query"**
3. Abra o arquivo `database/schema.sql` deste projeto
4. **Copie TODO o conteúdo** e cole no editor
5. Clique em **"Run"** (▶️) ou pressione `Ctrl+Enter`
6. ✅ Deve aparecer "Success. No rows returned"

**Se aparecer erro:** apague tudo e rode de novo, ou use **"Database → Reset"** no painel.

> ⚠️ O schema é **idempotente** — pode rodar várias vezes sem quebrar.

---

### 4️⃣ Criar o Bucket de Storage (para as fotos)

1. No menu lateral, vá em **Storage** (ícone de pasta)
2. Clique em **"Create a new bucket"**
3. Preencha:
   - **Name:** `imoveis-fotos`
   - **Public bucket:** ✅ **MARQUE** (obrigatório para as fotos aparecerem no site)
4. Clique em **"Create bucket"**

> As políticas de acesso ao storage já foram criadas pelo schema.sql.

---

### 5️⃣ Pegar as Credenciais (URL e Chave)

1. No menu lateral, vá em **Settings → API**
2. Você vai precisar de duas informações:
   - **Project URL** (ex: `https://abcdefgh.supabase.co`)
   - **anon public key** (uma string JWT longa começando com `eyJ...`)
3. **Anote ambas** — você vai usar agora

---

### 6️⃣ Configurar as Credenciais no Site

Abra o arquivo **`js/supabase-config.js`** e cole suas credenciais:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://SEU-PROJETO.supabase.co',     // ← Cole aqui
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI...'  // ← Cole aqui
};
```

> ⚠️ **NUNCA** compartilhe a `service_role` key. Use apenas a `anon` key no frontend.

---

### 7️⃣ Criar o Primeiro Usuário Admin

#### 7.1. Criar o usuário no Auth

1. No painel Supabase, vá em **Authentication → Users**
2. Clique em **"Add user" → "Create new user"**
3. Preencha:
   - **Email:** seu e-mail (ex: `thiago@seudominio.com`)
   - **Password:** uma senha forte
   - **Auto Confirm User:** ✅ MARQUE
4. Clique em **"Create user"**

#### 7.2. Promover a Admin no Banco

1. Volte em **SQL Editor**
2. Rode este comando (substitua o e-mail):

```sql
UPDATE public.users
SET role = 'admin', ativo = true, nome = 'Thiago Lemos'
WHERE email = 'seu@email.com';
```

3. ✅ Deve aparecer "Success. 1 row updated"

---

### 8️⃣ Testar o Painel Admin

1. Abra o arquivo **`admin/index.html`** no navegador
2. Faça login com o e-mail e senha que você criou
3. Você deve ver o dashboard! 🎉

---

### 9️⃣ Cadastrar seu Primeiro Imóvel

1. No painel, clique em **"Novo Imóvel"**
2. Preencha os dados (mínimo: título, tipo, preço, bairro, cidade)
3. **Anexe fotos** arrastando ou clicando
4. Marque as amenidades (piscina, churrasqueira, etc)
5. Clique em **"Salvar Imóvel"**
6. Volte em **"Imóveis"** para ver a lista

---

### 🔟 Testar o Site Público

1. Abra o arquivo **`index.html`** no navegador
2. Os imóveis cadastrados devem aparecer na seção "Imóveis em Destaque"
3. Para o site puxar dados do banco, é necessário que o `index.html` esteja usando `js/supabase-api.js` (instruções abaixo)

---

## ⚙️ Integração Frontend → Banco (opcional)

Se quiser que o site público (`index.html`) consuma o banco ao invés de ter dados estáticos:

### Adicione antes do `</body>` no `index.html`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-config.js"></script>
<script src="js/supabase-api.js"></script>
```

### No `js/main.js`, substitua a renderização dos imóveis por:

```javascript
// Carregar imóveis do banco ao iniciar
document.addEventListener('DOMContentLoaded', async () => {
    const { data: imoveis } = await ImoveisAPI.destaques(6);
    ImoveisAPI.renderLista(imoveis, 'imoveis-grid');
});
```

### No formulário de contato, salvar como lead:

```javascript
document.getElementById('cta-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const dados = {
        nome: e.target[0].value,
        email: e.target[1].value,
        telefone: e.target[2].value,
        mensagem: e.target[4].value
    };
    const { error } = await LeadsAPI.criar(dados);
    if (!error) {
        showNotification('Mensagem enviada!', 'success');
        e.target.reset();
    }
});
```

### Usando a busca unificada (RPC):

```javascript
const { data } = await window.supabaseClient.rpc('buscar_imoveis', {
    p_tipo: 'apartamento',
    p_quartos_min: 2,
    p_preco_max: 1500000,
    p_ordenacao: 'preco_asc',
    p_limite: 12,
    p_offset: 0
});
```

---

## 📊 Estrutura do Banco Criada

Após rodar o schema, você terá:

| Tabela | Função |
|---|---|
| `users` | Usuários admin/corretores |
| `imoveis` | Catálogo principal de imóveis |
| `imovel_fotos` | Fotos de cada imóvel |
| `amenidades` | Características (piscina, etc) |
| `imovel_amenidades` | Relação N:N imóvel ↔ amenidade |
| `leads` | Contatos recebidos do site |
| `lead_interacoes` | Timeline/histórico de cada lead |
| `favoritos` | Imóveis favoritados pelos visitantes |
| `imovel_visualizacoes` | Analytics detalhado de views |
| `site_config` | Configurações dinâmicas (telefone, e-mail, etc) |
| `audit_log` | Auditoria de mudanças em imóveis |
| `newsletter` | Inscritos no boletim informativo |

**Views úteis criadas:**
- `v_imoveis_publicados` - imóveis com foto de capa (usado no site)
- `v_imovel_detalhes` - detalhes completos do imóvel para a página individual
- `v_leads_stats` - estatísticas mensais de leads
- `v_imoveis_mais_vistos` - top 20 imóveis mais vistos
- `v_dashboard_resumo` - snapshot do dashboard com KPIs

**Funções RPC úteis:**
- `buscar_imoveis(filtros)` - busca unificada com filtros avançados
- `contar_imoveis(filtros)` - contador com mesmos filtros
- `registrar_visualizacao(...)` - registra view individual + incrementa contador
- `increment_imovel_view(id)` - versão legada, só incrementa contador
- `marcar_lead_contatado(id)` - atalho para mudar status
- `stats_por_bairro(cidade)` - estatísticas agregadas por bairro
- `is_admin()` / `is_staff()` - helpers RLS

---

## 🛡️ Segurança Configurada

- ✅ **RLS (Row Level Security)** ativo em todas as tabelas
- ✅ **Público** só vê imóveis com status `disponivel`
- ✅ **Staff** (logado) tem acesso total aos imóveis/leads
- ✅ **Admin** pode excluir leads e editar configurações
- ✅ **Storage** público para leitura, restrito para upload
- ✅ **Slugs** gerados automaticamente (com normalização de acentos)
- ✅ **Códigos internos** gerados (TL-2026-0001)
- ✅ **Audit log** registra mudanças em imóveis
- ✅ **Triggers** registram timeline de interações dos leads
- ✅ **Validações** (preços ≥ 0, suítes ≤ quartos, etc)

---

## 🔧 Comandos Úteis SQL

### Ver todos os imóveis
```sql
SELECT id, codigo, titulo, status, preco, bairro
FROM imoveis ORDER BY created_at DESC;
```

### Ver leads não contatados
```sql
SELECT nome, email, telefone, created_at
FROM leads WHERE status = 'novo' AND arquivado = false ORDER BY created_at DESC;
```

### Estatísticas gerais (use a view)
```sql
SELECT * FROM v_dashboard_resumo;
```

### Buscar imóveis com filtros (use a função)
```sql
SELECT * FROM buscar_imoveis(
    p_tipo := 'apartamento',
    p_finalidade := 'venda',
    p_quartos_min := 2,
    p_preco_max := 1000000,
    p_ordenacao := 'preco_asc',
    p_limite := 10
);
```

### Ver histórico de um lead
```sql
SELECT * FROM lead_interacoes
WHERE lead_id = 'uuid-do-lead'
ORDER BY created_at DESC;
```

### Estatísticas por bairro
```sql
SELECT * FROM stats_por_bairro('São Paulo');
```

### Ver audit log de um imóvel
```sql
SELECT * FROM audit_log
WHERE tabela = 'imoveis' AND registro_id = 'uuid-do-imovel'
ORDER BY created_at DESC;
```

### Promover outro usuário a admin
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'outro@email.com';
```

### Adicionar nova amenidade
```sql
INSERT INTO public.amenidades (nome, slug, icone, categoria)
VALUES ('Coworking', 'coworking', 'fas fa-laptop', 'lazer');
```

### Alterar configuração do site
```sql
UPDATE public.site_config SET valor = '(11) 98888-8888'
WHERE chave = 'telefone_principal';
```

---

## 📝 Configurações Dinâmicas (`site_config`)

A tabela `site_config` permite editar dados do site sem mexer no código:

| Chave | Descrição |
|---|---|
| `telefone_principal` | Telefone exibido no site |
| `whatsapp` | Número do WhatsApp (apenas números, com DDI) |
| `email_contato` | E-mail principal |
| `endereco_completo` | Endereço do escritório |
| `creci` | Número do CRECI |
| `horario_atendimento` | Horário de funcionamento |
| `instagram_url`, `facebook_url`, `youtube_url` | Redes sociais |
| `meta_title`, `meta_description` | SEO padrão |
| `mostrar_preco` | Se deve exibir preços publicamente |
| `itens_por_pagina` | Quantos imóveis por página |

Para consumir no frontend:
```javascript
const { data } = await window.supabaseClient
    .from('site_config')
    .select('*')
    .eq('chave', 'whatsapp')
    .single();
```

---

## 💰 Limites do Plano Gratuito

| Recurso | Limite Free |
|---|---|
| Banco de dados | 500 MB |
| Storage (fotos) | 1 GB |
| Bandwidth | 2 GB/mês |
| Usuários Auth | 50.000 |
| Requisições API | Ilimitadas |

**Estimativa:** Suporta tranquilamente **~500 imóveis com 5 fotos cada** no plano gratuito.

---

## 🆘 Problemas Comuns

### Erro "Invalid API key"
→ Verifique se a `anonKey` e `url` estão corretas em `supabase-config.js`

### Não consigo logar no admin
→ Verifique se rodou o `UPDATE users SET role = 'admin'` no SQL

### Fotos não aparecem
→ Confirme que o bucket `imoveis-fotos` está **público**

### Erro "permission denied for table"
→ O RLS está bloqueando. Verifique se você está logado como staff.

### Imóvel criado mas não aparece no site
→ Status precisa estar como `disponivel` (não `rascunho`)

### Slug ficou vazio ou com caracteres estranhos
→ O trigger gera automaticamente. Não preencha o campo `slug` manualmente.

### Busca não encontra por acentuação
→ O índice usa `unaccent()`. "Apartamento" e "apartamento" retornam o mesmo resultado.

### Erro ao rodar schema pela segunda vez
→ Use `DROP TABLE IF EXISTS` ou apague tudo e rode novamente. O schema é idempotente para a maioria das operações.

---

## 📞 Suporte

- **Documentação Supabase:** [supabase.com/docs](https://supabase.com/docs)
- **Discord Supabase (PT-BR):** canal no Discord oficial
- **Email:** contato@thiagoimoveis.com

---

**Pronto! Agora você tem um banco de dados profissional para o site do Thiago Lemos Imóveis.** 🎉