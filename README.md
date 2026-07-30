# 🏠 Thiago Lemos Imóveis

Site institucional/front-end para a imobiliária **Thiago Lemos Imóveis** — elegante, moderno e focado em conversão para o público de compra de imóveis.

## ✨ Identidade Visual

- **Cor principal:** Verde-limão (`#c1ff00`) — referência à logo original
- **Cor de fundo:** Preto profundo (`#0a0a0a`) — sofisticação e elegância
- **Tipografia:** Playfair Display (títulos) + Poppins (corpo)
- **Estilo:** Premium, moderno, com toques de tinta/splatter (referência à arte da logo)
- **Público-alvo:** Compradores e locatários de imóveis de médio e alto padrão

## 📁 Estrutura do Projeto

```
site_thiago/
├── index.html              # Página principal
├── css/
│   ├── variables.css       # Variáveis CSS (cores, fontes, espaçamentos)
│   ├── style.css           # Estilos principais
│   └── responsive.css      # Estilos responsivos
├── js/
│   └── main.js             # Interações e animações
├── img/
│   └── logo.jpeg           # Logo oficial
├── imagens/                # Pasta original das imagens
└── README.md
```

## 🚀 Como Visualizar

Basta abrir o arquivo `index.html` em qualquer navegador moderno (Chrome, Edge, Firefox).

Não há dependências de build — tudo funciona via CDN (Google Fonts, Font Awesome, AOS).

## 🎯 Seções do Site

1. **Header** — Logo + menu de navegação + botão WhatsApp
2. **Hero** — Apresentação impactante com card de imóvel em destaque + estatísticas
3. **Sobre** — Apresentação do Thiago Lemos + diferenciais
4. **Busca** — Filtro rápido de imóveis
5. **Imóveis em Destaque** — Grid de imóveis com filtros por categoria
6. **Serviços** — Compra, venda, consultoria, marketing, financiamento
7. **Depoimentos** — Social proof com clientes satisfeitos
8. **CTA / Contato** — Formulário + informações de contato + redes sociais
9. **Footer** — Links, informações e CRECI

## ➕ Como Adicionar Novos Imóveis

Abra o arquivo `index.html` e copie o bloco de um imóvel existente. Exemplo:

```html
<article class="imovel-card" data-category="apartamento" data-aos="fade-up">
    <div class="imovel-image">
        <div class="imovel-badge">DESTAQUE</div>
        <button class="imovel-fav"><i class="far fa-heart"></i></button>
        <div class="imovel-image-placeholder" style="background: SEU-GRADIENTE-AQUI;">
            <i class="fas fa-building"></i>
        </div>
    </div>
    <div class="imovel-content">
        <span class="imovel-type">Apartamento</span>
        <h3 class="imovel-title">NOME DO IMÓVEL</h3>
        <p class="imovel-location"><i class="fas fa-map-marker-alt"></i> LOCALIZAÇÃO</p>
        <div class="imovel-features">
            <span><i class="fas fa-bed"></i> X quartos</span>
            <span><i class="fas fa-bath"></i> X banheiros</span>
            <span><i class="fas fa-ruler-combined"></i> Xm²</span>
            <span><i class="fas fa-car"></i> X vagas</span>
        </div>
        <div class="imovel-footer">
            <div class="imovel-price">
                <span class="imovel-price-label">A partir de</span>
                <span class="imovel-price-value">R$ XXX.XXX</span>
            </div>
            <a href="#" class="btn btn-primary btn-sm">Ver Detalhes</a>
        </div>
    </div>
</article>
```

### Categorias disponíveis para filtro:
- `apartamento`
- `casa`
- `cobertura`
- `comercial`

### Tipos de badge:
- `DESTAQUE` (verde)
- `NOVO` (amarelo) — adicione `badge-new`
- `EXCLUSIVO` (verde)
- `VENDA` (rosa) — adicione `badge-sale`

## 🖼️ Como Trocar Imagens dos Imóveis

Substitua o `<div class="imovel-image-placeholder">` por uma tag `<img>`:

```html
<img src="img/seu-imovel.jpg" alt="Apartamento Luxo" class="imovel-img">
```

E adicione no CSS (`style.css`):
```css
.imovel-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
```

## 📞 Personalizar Contato

No `index.html`, procure por:
- Telefone: `+55 (35) 99741-8298`
- WhatsApp: `+55 (35) 99741-8298`
- E-mail: `thiago10lemos10@gmail.com`
- Endereço: `Rua Paraná, 301 - Passos MG`
- CRECI: `35.314`

## 🎨 Customização de Cores

Edite `css/variables.css` para mudar toda a paleta do site de forma centralizada.

## 📱 Responsividade

- ✅ Desktop (1280px+)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (até 480px)

---

**Thiago Lemos Imóveis** — *O imóvel dos seus sonhos está aqui.*
