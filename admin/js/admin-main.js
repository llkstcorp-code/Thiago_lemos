/**
 * UI Helpers (modal, toast, navegação)
 */
const AdminUI = {

    /**
     * Trocar de view (tela)
     */
    switchView(viewName) {
        // Esconder todas as views
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

        // Mostrar view alvo
        const view = document.getElementById(`view-${viewName}`);
        if (view) view.classList.add('active');

        // Marcar nav item ativo
        const navItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
        if (navItem) navItem.classList.add('active');

        // Atualizar título
        const titulos = {
            'dashboard': 'Dashboard',
            'imoveis': 'Imóveis',
            'novo-imovel': 'Cadastrar Imóvel',
            'leads': 'Leads',
            'amenidades': 'Amenidades'
        };
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = titulos[viewName] || 'Admin';

        // Carregar dados da view
        switch (viewName) {
            case 'dashboard':
                AdminDashboard.carregar();
                break;
            case 'imoveis':
                AdminImoveis.renderTabela();
                break;
            case 'novo-imovel':
                AdminImoveis.limparFormulario();
                AdminAmenidades.renderizarCheckboxes('amenidades-grid');
                AdminFotos.init();
                AdminFotos.reset();
                // Forçar init do form uma vez
                if (!this._formInit) {
                    document.getElementById('form-imovel').addEventListener('submit', (e) => AdminImoveis.salvar(e));
                    document.getElementById('btn-cancelar').addEventListener('click', () => this.switchView('imoveis'));
                    this._formInit = true;
                }
                break;
            case 'leads':
                AdminLeads.renderTabela();
                AdminLeads.atualizarEstatisticas();
                break;
            case 'amenidades':
                AdminAmenidades.renderTabela();
                break;
        }

        // Fechar sidebar mobile
        document.querySelector('.sidebar')?.classList.remove('open');
    },

    /**
     * Mostrar modal
     */
    modal({ titulo, body }) {
        const modal = document.getElementById('modal');
        const modalTitulo = document.getElementById('modal-titulo');
        const modalBody = document.getElementById('modal-body');

        if (modalTitulo) modalTitulo.textContent = titulo;
        if (modalBody) modalBody.innerHTML = body;
        if (modal) modal.classList.add('show');
    },

    fecharModal() {
        const modal = document.getElementById('modal');
        if (modal) modal.classList.remove('show');
    },

    /**
     * Toast notification
     */
    toast(mensagem, tipo = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const icones = {
            success: 'check-circle',
            error: 'times-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        toast.innerHTML = `
            <i class="fas fa-${icones[tipo] || 'info-circle'}"></i>
            <span>${mensagem}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(120%)';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
};

// ====================================================================
// INICIALIZAÇÃO
// ====================================================================

document.addEventListener('DOMContentLoaded', async () => {

    // Verificar sessão
    const user = await AdminAuth.checkSession();

    if (user) {
        AdminAuth.showPanel(user);
        AdminUI.switchView('dashboard');
    } else {
        AdminAuth.showLogin();
    }

    // ============================================
    // LOGIN
    // ============================================
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const errorEl = document.getElementById('login-error');

            errorEl.classList.remove('show');

            const btn = loginForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
            btn.disabled = true;

            const { data, error } = await AdminAuth.login(email, password);

            btn.innerHTML = originalText;
            btn.disabled = false;

            if (error) {
                errorEl.textContent = error;
                errorEl.classList.add('show');
                return;
            }

            AdminAuth.showPanel(data);
            AdminUI.switchView('dashboard');
            AdminUI.toast(`Bem-vindo, ${data.nome}!`, 'success');
        });
    }

    // ============================================
    // LOGOUT
    // ============================================
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm('Deseja realmente sair?')) {
                AdminAuth.logout();
            }
        });
    }

    // ============================================
    // NAVEGAÇÃO
    // ============================================
    document.querySelectorAll('.nav-item, [data-view]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const view = el.dataset.view;
            if (view) AdminUI.switchView(view);
        });
    });

    // ============================================
    // MENU MOBILE
    // ============================================
    const menuMobile = document.getElementById('menu-mobile');
    if (menuMobile) {
        menuMobile.addEventListener('click', () => {
            document.querySelector('.sidebar')?.classList.toggle('open');
        });
    }

    // ============================================
    // MODAL
    // ============================================
    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', () => AdminUI.fecharModal());
    }
    document.getElementById('modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'modal') AdminUI.fecharModal();
    });

    // ============================================
    // BUSCA E FILTRO DE IMÓVEIS
    // ============================================
    const searchImoveis = document.getElementById('search-imoveis');
    const filterStatus = document.getElementById('filter-status');

    if (searchImoveis) {
        let timeout;
        searchImoveis.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                AdminImoveis.renderTabela({
                    busca: searchImoveis.value,
                    status: filterStatus?.value
                });
            }, 300);
        });
    }

    if (filterStatus) {
        filterStatus.addEventListener('change', () => {
            AdminImoveis.renderTabela({
                busca: searchImoveis?.value,
                status: filterStatus.value
            });
        });
    }

    // ============================================
    // FILTRO DE LEADS POR STATUS
    // ============================================
    document.querySelectorAll('.lead-stat').forEach(card => {
        card.addEventListener('click', () => {
            const filtro = card.dataset.filter;
            AdminLeads.renderTabela(filtro);
        });
    });
});

console.log('%c🏠 Painel Admin TL', 'color: #c1ff00; font-size: 18px; font-weight: bold;');
