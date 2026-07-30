/**
 * Dashboard com estatísticas
 */

const AdminDashboard = {

    async carregar() {
        await Promise.all([
            this.carregarStats(),
            this.carregarUltimosImoveis(),
            this.carregarUltimosLeads()
        ]);
    },

    async carregarStats() {
        try {
            // Total de imóveis
            const { count: totalImoveis } = await window.supabaseClient
                .from('imoveis')
                .select('*', { count: 'exact', head: true });

            // Imóveis disponíveis
            const { count: disponiveis } = await window.supabaseClient
                .from('imoveis')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'disponivel');

            // Leads do mês
            const inicioMes = new Date();
            inicioMes.setDate(1);
            inicioMes.setHours(0, 0, 0, 0);

            const { count: leadsMes } = await window.supabaseClient
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', inicioMes.toISOString());

            // Total de visualizações
            const { data: imoveisViews } = await window.supabaseClient
                .from('imoveis')
                .select('visualizacoes');

            const totalViews = (imoveisViews || []).reduce((acc, i) => acc + (i.visualizacoes || 0), 0);

            // Atualizar UI
            this.setText('stat-total-imoveis', totalImoveis || 0);
            this.setText('stat-disponiveis', disponiveis || 0);
            this.setText('stat-leads-mes', leadsMes || 0);
            this.setText('stat-views', totalViews.toLocaleString('pt-BR'));
        } catch (error) {
            console.error('Erro ao carregar stats:', error);
        }
    },

    async carregarUltimosImoveis() {
        const container = document.getElementById('ultimos-imoveis');
        if (!container) return;

        try {
            const { data } = await window.supabaseClient
                .from('imoveis')
                .select(`
                    id, titulo, codigo, created_at, status,
                    imovel_fotos(id, url, is_cover)
                `)
                .order('created_at', { ascending: false })
                .limit(5);

            if (!data || data.length === 0) {
                container.innerHTML = '<div class="empty-state-mini">Nenhum imóvel cadastrado</div>';
                return;
            }

            container.innerHTML = data.map(imovel => {
                const cover = imovel.imovel_fotos?.find(f => f.is_cover) || imovel.imovel_fotos?.[0];
                const thumbStyle = cover?.url ? `style="background-image: url('${cover.url}')"` : '';

                return `
                    <div class="item">
                        <div class="thumb" ${thumbStyle}></div>
                        <div class="info">
                            <strong>${imovel.titulo}</strong>
                            <small>${imovel.codigo || 's/ código'} • ${this.tempoRelativo(imovel.created_at)}</small>
                        </div>
                        <span class="badge badge-${imovel.status}">${imovel.status}</span>
                    </div>
                `;
            }).join('');
        } catch (error) {
            container.innerHTML = '<div class="empty-state-mini">Erro ao carregar</div>';
        }
    },

    async carregarUltimosLeads() {
        const container = document.getElementById('ultimos-leads');
        if (!container) return;

        try {
            const { data } = await window.supabaseClient
                .from('leads')
                .select('id, nome, mensagem, created_at, status')
                .order('created_at', { ascending: false })
                .limit(5);

            if (!data || data.length === 0) {
                container.innerHTML = '<div class="empty-state-mini">Nenhum lead recebido</div>';
                return;
            }

            container.innerHTML = data.map(lead => {
                const iniciais = lead.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                const msg = (lead.mensagem || '').substring(0, 60) || '—';

                return `
                    <div class="item" style="cursor: pointer;" onclick="AdminLeads.verDetalhes('${lead.id}')">
                        <div class="thumb" style="display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--primary);">
                            ${iniciais}
                        </div>
                        <div class="info">
                            <strong>${lead.nome}</strong>
                            <small>${msg} • ${this.tempoRelativo(lead.created_at)}</small>
                        </div>
                        <span class="badge badge-${lead.status === 'novo' ? 'disponivel' : 'rascunho'}">${lead.status}</span>
                    </div>
                `;
            }).join('');
        } catch (error) {
            container.innerHTML = '<div class="empty-state-mini">Erro ao carregar</div>';
        }
    },

    setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    },

    tempoRelativo(iso) {
        const d = new Date(iso);
        const agora = new Date();
        const diffMs = agora - d;
        const diffMin = Math.floor(diffMs / 60000);
        const diffH = Math.floor(diffMin / 60);
        const diffD = Math.floor(diffH / 24);

        if (diffMin < 1) return 'agora';
        if (diffMin < 60) return `há ${diffMin}min`;
        if (diffH < 24) return `há ${diffH}h`;
        if (diffD < 7) return `há ${diffD}d`;
        return d.toLocaleDateString('pt-BR');
    }
};

window.AdminDashboard = AdminDashboard;
