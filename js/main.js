/* ===== MAIN.JS - THIAGO LEMOS IMÓVEIS ===== */

(function() {
    'use strict';

    // ===== PRELOADER =====
    window.addEventListener('load', () => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            setTimeout(() => preloader.classList.add('hidden'), 500);
        }
        initAOS();
    });

    // ===== INICIALIZAR ANIMAÇÕES AOS =====
    function initAOS() {
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                easing: 'ease-out-cubic',
                once: true,
                offset: 80,
                disable: function() {
                    return window.innerWidth < 768;
                }
            });
        }
    }

    // ===== HEADER SCROLL =====
    const header = document.getElementById('header');
    const backToTop = document.getElementById('back-to-top');

    function handleScroll() {
        const scrollY = window.scrollY;

        if (header) {
            if (scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }

        if (backToTop) {
            if (scrollY > 500) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }

        updateActiveNavLink();
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    // ===== BACK TO TOP =====
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ===== MENU MOBILE =====
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Fechar menu ao clicar em um link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // ===== ACTIVE NAV LINK ON SCROLL =====
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    function updateActiveNavLink() {
        const scrollY = window.scrollY + 150;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollY >= top && scrollY < top + height) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + id) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    // ===== CONTADORES ANIMADOS =====
    const statNumbers = document.querySelectorAll('.stat-number');
    let countersStarted = false;

    function animateCounters() {
        if (countersStarted) return;

        const heroStats = document.querySelector('.hero-stats');
        if (!heroStats) return;

        const rect = heroStats.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (isVisible) {
            countersStarted = true;

            statNumbers.forEach(stat => {
                const target = parseInt(stat.getAttribute('data-count'));
                const duration = 2000;
                const step = target / (duration / 16);
                let current = 0;

                const update = () => {
                    current += step;
                    if (current < target) {
                        stat.textContent = Math.floor(current);
                        requestAnimationFrame(update);
                    } else {
                        stat.textContent = target;
                    }
                };

                update();
            });
        }
    }

    window.addEventListener('scroll', animateCounters, { passive: true });

    // ===== FILTRO DE IMÓVEIS =====
    const filterButtons = document.querySelectorAll('.filter-btn');
    const imovelCards = document.querySelectorAll('.imovel-card');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');

            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            imovelCards.forEach((card, index) => {
                const category = card.getAttribute('data-category');

                if (filter === 'all' || category === filter) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, index * 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // ===== FAVORITOS =====
    const favButtons = document.querySelectorAll('.imovel-fav');

    favButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            btn.classList.toggle('active');
            const icon = btn.querySelector('i');

            if (btn.classList.contains('active')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                showNotification('Imóvel adicionado aos favoritos!', 'success');
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
            }
        });
    });

    // ===== SISTEMA DE NOTIFICAÇÃO =====
    function showNotification(message, type = 'info') {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        Object.assign(notification.style, {
            position: 'fixed',
            top: '100px',
            right: '2rem',
            background: type === 'success' ? '#25d366' : '#c1ff00',
            color: type === 'success' ? '#fff' : '#0a0a0a',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            zIndex: '10000',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: '600',
            fontSize: '0.95rem',
            transform: 'translateX(400px)',
            transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 50);

        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 400);
        }, 3000);
    }

    // ===== FORMULÁRIO DE BUSCA =====
    const buscaForm = document.getElementById('busca-form');
    if (buscaForm) {
        buscaForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!window.ImoveisAPI || !window.supabaseClient || SUPABASE_CONFIG.url.includes('SEU-PROJETO')) {
                showNotification('Busca indisponível no momento. Tente novamente mais tarde.', 'error');
                return;
            }

            const tipo = document.getElementById('busca-tipo')?.value || 'all';
            const bairro = document.getElementById('busca-bairro')?.value || '';
            const faixaPreco = document.getElementById('busca-preco')?.value || '';

            const filtros = { tipo, bairro, limite: 24 };
            if (faixaPreco) {
                const [min, max] = faixaPreco.split('-');
                if (min) filtros.precoMin = Number(min);
                if (max) filtros.precoMax = Number(max);
            }

            showNotification('Buscando imóveis que combinam com você...', 'info');

            const { data: imoveis, error } = await ImoveisAPI.listar(filtros);

            document.getElementById('imoveis').scrollIntoView({ behavior: 'smooth' });

            if (error) {
                showNotification('Erro ao buscar imóveis. Tente novamente.', 'error');
                return;
            }

            ImoveisAPI.renderLista(imoveis, 'imoveis-grid');
            aposRenderizarImoveis();
        });
    }

    // ===== FORMULÁRIO DE CONTATO =====
    // (handler completo abaixo, integrado com Supabase)

    // ===== SMOOTH SCROLL PARA LINKS INTERNOS =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = target.offsetTop - headerHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ===== EFEITO PARALLAX NO HERO =====
    const heroBg = document.querySelector('.hero-bg');
    const heroSplatters = document.querySelectorAll('.hero-splatter');

    if (heroBg) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            if (scrolled < window.innerHeight) {
                heroBg.style.transform = `translateY(${scrolled * 0.4}px)`;
                heroSplatters.forEach((splatter, i) => {
                    const speed = (i + 1) * 0.2;
                    splatter.style.transform = `translate(${scrolled * speed * 0.1}px, ${scrolled * speed}px)`;
                });
            }
        }, { passive: true });
    }

    // ===== INICIALIZAR =====
    handleScroll();
    animateCounters();

    // ===== CARREGAR IMÓVEIS DO BANCO (se Supabase configurado) =====
    async function carregarImoveisDoBanco() {
        if (!window.ImoveisAPI || !window.supabaseClient) return;

        // Verificar se as credenciais foram configuradas
        if (SUPABASE_CONFIG.url.includes('SEU-PROJETO')) {
            console.log('⚠️ Supabase não configurado. Usando imóveis estáticos.');
            return;
        }

        try {
            const { data: imoveis, error } = await ImoveisAPI.destaques(6);
            if (error) throw error;

            if (imoveis && imoveis.length > 0) {
                ImoveisAPI.renderLista(imoveis, 'imoveis-grid');
                console.log(`✅ ${imoveis.length} imóveis carregados do banco`);
                aposRenderizarImoveis();
            }
        } catch (error) {
            console.warn('Não foi possível carregar do banco:', error.message);
        }
    }

    // Chamar sempre depois de (re)renderizar cards de imóveis dinamicamente
    function aposRenderizarImoveis() {
        // Os cards são inseridos depois que o AOS já rodou. No mobile o AOS
        // fica desativado e remove data-aos só dos elementos que já existiam
        // na página, então os cards novos ficam com opacity:0 para sempre.
        if (window.innerWidth < 768) {
            document.querySelectorAll('#imoveis-grid [data-aos]').forEach(el => {
                el.removeAttribute('data-aos');
            });
        } else if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }

        // Re-inicializar favoritos após renderizar
        initFavoritos();
    }

    function initFavoritos() {
        document.querySelectorAll('.imovel-fav').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const id = btn.dataset.id;

                if (window.FavoritosAPI) {
                    if (btn.classList.contains('active')) {
                        await FavoritosAPI.remover(id);
                        btn.classList.remove('active');
                        btn.querySelector('i').classList.replace('fas', 'far');
                    } else {
                        await FavoritosAPI.adicionar(id);
                        btn.classList.add('active');
                        btn.querySelector('i').classList.replace('far', 'fas');
                    }
                } else {
                    btn.classList.toggle('active');
                }
            });
        });
    }

    // Tentar carregar do banco quando a página carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', carregarImoveisDoBanco);
    } else {
        carregarImoveisDoBanco();
    }

    // Formulário de contato - redirecionar para o WhatsApp
    const ctaForm = document.getElementById('cta-form');
    const WHATSAPP_NUMERO = '5535997418298';
    if (ctaForm) {
        // Limites de tamanho por campo, para não gravar lixo no banco
        const LIMITES = { nome: 100, email: 150, telefone: 20, interesse: 50, mensagem: 2000 };

        // Intervalo mínimo entre dois envios do mesmo navegador
        const INTERVALO_MIN_MS = 30 * 1000;

        const limpar = (valor, max) => valor.trim().replace(/\s+/g, ' ').slice(0, max);

        ctaForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Honeypot: campo escondido que humanos não veem e bots costumam preencher.
            // Se veio preenchido, fingimos sucesso e não enviamos nada.
            const honeypot = ctaForm.querySelector('input[name="website"]');
            if (honeypot && honeypot.value !== '') {
                ctaForm.reset();
                showNotification('Mensagem enviada com sucesso!', 'success');
                return;
            }

            // Trava simples de repetição (evita envio acidental ou em rajada)
            const ultimoEnvio = Number(localStorage.getItem('ultimoEnvioContato') || 0);
            if (Date.now() - ultimoEnvio < INTERVALO_MIN_MS) {
                showNotification('Você acabou de enviar uma mensagem. Aguarde um instante.', 'error');
                return;
            }

            // Selecionar por id: o honeypot também é um input[type="text"] do form
            const formData = {
                nome: limpar(document.getElementById('contato-nome').value, LIMITES.nome),
                email: limpar(document.getElementById('contato-email').value, LIMITES.email),
                telefone: limpar(document.getElementById('contato-telefone').value, LIMITES.telefone),
                interesse: limpar(document.getElementById('contato-interesse').value, LIMITES.interesse),
                mensagem: limpar(document.getElementById('contato-mensagem').value, LIMITES.mensagem)
            };

            if (formData.nome.length < 2) {
                showNotification('Informe seu nome completo.', 'error');
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(formData.email)) {
                showNotification('Informe um e-mail válido.', 'error');
                return;
            }
            // Telefone brasileiro: 10 dígitos (fixo) ou 11 (celular), com ou sem máscara
            const digitosTelefone = formData.telefone.replace(/\D/g, '');
            if (digitosTelefone.length < 10 || digitosTelefone.length > 13) {
                showNotification('Informe um telefone válido com DDD.', 'error');
                return;
            }
            if (formData.mensagem.length < 5) {
                showNotification('Escreva sua mensagem.', 'error');
                return;
            }

            localStorage.setItem('ultimoEnvioContato', String(Date.now()));

            // Salva o lead no banco em segundo plano (não bloqueia o redirecionamento)
            if (window.LeadsAPI && !SUPABASE_CONFIG.url.includes('SEU-PROJETO')) {
                LeadsAPI.criar({
                    nome: formData.nome,
                    email: formData.email,
                    telefone: formData.telefone,
                    mensagem: formData.mensagem,
                    origem: 'site_formulario'
                }).catch(() => {});
            }

            const textoMensagem =
                `Olá! Meu nome é ${formData.nome}.\n` +
                (formData.interesse ? `Interesse: ${formData.interesse}\n` : '') +
                `E-mail: ${formData.email}\n` +
                `Telefone: ${formData.telefone}\n\n` +
                `${formData.mensagem}`;

            const linkWhatsapp = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(textoMensagem)}`;
            window.open(linkWhatsapp, '_blank', 'noopener');
            ctaForm.reset();
        });
    }

    console.log('%c🏠 Thiago Lemos Imóveis', 'color: #c1ff00; font-size: 24px; font-weight: bold;');
    console.log('%cSite desenvolvido com excelência.', 'color: #fff; font-size: 14px;');

})();
