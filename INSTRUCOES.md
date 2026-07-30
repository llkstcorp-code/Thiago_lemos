# 🏠 Thiago Lemos Imóveis — Como abrir o site

## ✅ Correções aplicadas

Os seguintes problemas foram corrigidos neste pacote:

1. **Caracteres chineses (摄影)** que apareciam em duas seções do `index.html` — substituídos por "fotografia profissional".
2. **Erro de JavaScript** no `js/main.js`: a variável `ctaForm` era declarada duas vezes (o que fazia o navegador abortar o script e o site ficar quebrado). Removida a duplicação, mantendo o handler integrado com o Supabase.
3. **Bug no `js/supabase-api.js`**: o método `destaques()` passava o filtro `destaque: true`, mas o método `listar()` ignorava esse filtro. Adicionado o suporte.
4. **Encoding verificado** — todos os arquivos HTML/CSS/JS estão em UTF-8 (sem BOM).

## 🚀 Como abrir

### Opção 1 — Duplo clique (mais simples)

1. Extraia o ZIP em uma pasta (ex.: `C:\Users\Lucas\site_thiago`).
2. Abra o Explorador de Arquivos nessa pasta.
3. Dê **duplo clique em `index.html`**.

> ⚠️ No Firefox funciona direto. No Chrome/Edge, o duplo clique abre como `file://`, o que pode bloquear CDNs externos (Font Awesome, Google Fonts, Supabase) em algumas configurações. Se o site ficar sem ícones ou não carregar fontes, use a Opção 2.

### Opção 2 — Servidor local (recomendado)

Abra o PowerShell na pasta do site e rode **um** dos comandos abaixo:

**Se tiver Python:**
```powershell
python -m http.server 8000
```

**Se tiver Node.js:**
```powershell
npx serve -p 8000
```

**Se tiver PHP:**
```powershell
php -S localhost:8000
```

Depois abra no navegador: **http://localhost:8000**

## 📁 Estrutura

```
site_thiago/
├── index.html               ← Página principal (abra esta)
├── INSTRUCOES.md            ← Este arquivo
├── README.md                ← Documentação original
├── css/                     ← Estilos
├── js/                      ← Scripts
├── img/                     ← Logo
├── imagens/                 ← Imagens originais
├── admin/                   ← Painel administrativo (requer Supabase configurado)
└── database/                ← Schema SQL do Supabase
```

## ⚠️ Sobre o painel admin (`admin/index.html`)

O painel administrativo **não funciona** sem configurar o Supabase. Para usá-lo:

1. Crie uma conta em https://supabase.com
2. Crie um projeto (região **São Paulo**)
3. No **SQL Editor**, rode **primeiro** o arquivo `database/schema.sql` (todo o conteúdo)
4. Antes de rodar, abra `database/01_setup_admin.sql` e troque `v_email` e `v_senha_inicial` pelo e-mail e uma senha forte de verdade (não deixe uma senha real gravada em nenhum arquivo do projeto)
5. No **SQL Editor**, rode **depois** o arquivo `database/01_setup_admin.sql` (cria o usuário admin com os dados que você definiu)
6. Em **Storage**, crie o bucket `imoveis-fotos` marcado como **público**
7. Em **Settings → API**, copie a Project URL e a anon key
8. Abra `js/supabase-config.js` e cole as credenciais
9. Abra `admin/index.html` e faça login com o e-mail e a senha que você definiu no passo 4
10. Depois do primeiro login, troque a senha em **Authentication → Users → Reset password**, para não depender da senha inicial usada no script

Sem essa configuração, o site público continua funcionando normalmente com os imóveis estáticos do HTML.

## 🛠️ Problemas que você pode encontrar

| Sintoma | Causa | Solução |
|---------|-------|---------|
| Site abre todo preto, sem nada | Internet bloqueada ou CDN offline | Use a Opção 2 (servidor local) ou abra no Firefox |
| Caracteres chineses (摄影) | Não estava corrigido nesta versão | Já corrigido neste pacote |
| Painel admin não loga | Supabase não configurado | Veja a seção "Sobre o painel admin" acima |
| Imagens dos imóveis não aparecem | O site usa placeholders coloridos por padrão | Substitua conforme o `README.md` original |