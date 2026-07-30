/**
 * Autenticação do Painel Admin
 */

const AdminAuth = {
    // Fazer login
    async login(email, password) {
        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // Verificar se é staff
            const { data: userData, error: userError } = await window.supabaseClient
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (userError || !userData) {
                throw new Error('Usuário sem permissão de acesso');
            }

            if (!userData.ativo) {
                throw new Error('Usuário inativo. Contate o administrador');
            }

            window.currentUser = userData;
            return { data: userData, error: null };
        } catch (error) {
            console.error('Erro no login:', error);
            return { data: null, error: error.message };
        }
    },

    // Fazer logout
    async logout() {
        const { error } = await window.supabaseClient.auth.signOut();
        if (!error) {
            window.currentUser = null;
            window.location.reload();
        }
    },

    // Verificar sessão ativa
    async checkSession() {
        try {
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            if (error || !session) return null;

            const { data: userData, error: userError } = await window.supabaseClient
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (userError || !userData || !userData.ativo) {
                await this.logout();
                return null;
            }

            return userData;
        } catch (error) {
            console.error('Erro ao verificar sessão:', error);
            return null;
        }
    },

    // Mostrar/ocultar login e painel
    showLogin() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-panel').style.display = 'none';
    },

    showPanel(user) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'grid';

        // Atualizar info do usuário
        const avatar = document.getElementById('user-avatar');
        const nome = document.getElementById('user-nome');
        const role = document.getElementById('user-role');

        if (avatar) avatar.textContent = user.nome.charAt(0).toUpperCase();
        if (nome) nome.textContent = user.nome;
        if (role) role.textContent = user.role;
    }
};

window.AdminAuth = AdminAuth;
