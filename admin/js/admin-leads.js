/**
 * Gestão de Leads - Painel Admin
 */

const AdminLeads = {

    /**
     * Listar todos os leads
     */
    async listar(filtros = {}) {
        try {
            let query = window.supabaseClient
                .from('leads')
                .select(`
                    *,
                    imovel:imoveis(id, titulo, codigo)
                `)
                .order('created_at', { ascending: false });

            if (filtros.status) {
                query = query.eq('status', filtros.status);
            }

            const { data, error } = await query;
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Erro ao listar leads:', error);
            return { data: null, error };
        }
    },

    /**
     * Estatísticas de leads
     */
    async getEstatisticas() {
        try {
            const { data, error } = await window.supabaseClient
                .from('leads')
                .select('status');

            if (error) throw error;

            const stats = {
                novo: 0,
                contatado: 0,
                visita_agendada: 0,
                convertido: 0,
                perdido: 0,
                proposta_enviada: 0,
                total: data?.length || 0
            };

            (data || []).forEach(l => {
                if (stats[l.status] !== undefined) stats[l.status]++;
            });

            return { data: stats, error: null };
        } catch (error) {
            console.error('Erro ao buscar stats:', error);
            return { data: null, error };
        }
    },

    /**
     * Atualizar status do lead
     */
    async atualizarStatus(id, novoStatus) {
        const update = { status: novoStatus };

        if (novoStatus === 'contatado' && !update.data_contato) {
            update.data_contato = new Date().toISOString();
        }
        if (novoStatus === 'convertido') {
            update.data_conversao = new Date().toISOString();
        }

        const { error } = await window.supabaseClient
            .from('leads')
            .update(update)
            .eq('id', id);

        return { error };
    },

    /**
     * Salvar notas do admin
     */
    async salvarNotas(id, notas) {
        const { error } = await window.supabaseClient
            .from('leads')
            .update({ notas_admin: notas })
            .eq('id', id);
        return { error };
    },

    /**
     * Renderizar tabela de leads
     */
    async renderTabela(filtroStatus = null) {
        const tbody = document.querySelector('#table-leads tbody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="7" class="empty-state-mini">Carregando...</td></tr>';

        const filtros = filtroStatus ? { status: filtroStatus } : {};
        const { data } = await this.listar(filtros);

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state-mini">Nenhum lead encontrado</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(lead => `
            <tr data-id="${lead.id}">
                <td><small>${this.formatarData(lead.created_at)}</small></td>
                <td>
                    <strong>${lead.nome}</strong>
                    ${lead.imovel ? `<br><small style="color: var(--text-muted);">Sobre: ${lead.imovel.titulo}</small>` : ''}
                </td>
                <td>
                    <a href="mailto:${lead.email}" style="color: var(--info);">${lead.email}</a><br>
                    <a href="https://wa.me/55${lead.telefone.replace(/\D/g,'')}" target="_blank" style="color: var(--success);">
                        ${lead.telefone}
                    </a>
                </td>
                <td><small>${(lead.mensagem || '').substring(0, 80)}${lead.mensagem && lead.mensagem.length > 80 ? '...' : ''}</small></td>
                <td><span class="badge badge-rascunho">${this.formatarOrigem(lead.origem)}</span></td>
                <td>
                    <select class="status-select" data-id="${lead.id}" style="width: auto; min-width: 140px; padding: 0.4rem 0.6rem; font-size: 0.8rem;">
                        <option value="novo" ${lead.status === 'novo' ? 'selected' : ''}>Novo</option>
                        <option value="contatado" ${lead.status === 'contatado' ? 'selected' : ''}>Contatado</option>
                        <option value="visita_agendada" ${lead.status === 'visita_agendada' ? 'selected' : ''}>Visita Agendada</option>
                        <option value="proposta_enviada" ${lead.status === 'proposta_enviada' ? 'selected' : ''}>Proposta Enviada</option>
                        <option value="convertido" ${lead.status === 'convertido' ? 'selected' : ''}>Convertido ✓</option>
                        <option value="perdido" ${lead.status === 'perdido' ? 'selected' : ''}>Perdido</option>
                    </select>
                </td>
                <td>
                    <button class="btn-table" data-action="view" data-id="${lead.id}" title="Ver detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    <a href="https://wa.me/55${lead.telefone.replace(/\D/g,'')}" target="_blank" class="btn-table" title="Abrir WhatsApp" style="color: var(--success);">
                        <i class="fab fa-whatsapp"></i>
                    </a>
                </td>
            </tr>
        `).join('');

        // Listeners
        tbody.querySelectorAll('.status-select').forEach(sel => {
            sel.addEventListener('change', async (e) => {
                const id = sel.dataset.id;
                const novoStatus = e.target.value;
                const { error } = await this.atualizarStatus(id, novoStatus);
                if (error) {
                    AdminUI.toast('Erro ao atualizar status', 'error');
                } else {
                    AdminUI.toast('Status atualizado', 'success');
                    await this.atualizarEstatisticas();
                }
            });
        });

        tbody.querySelectorAll('[data-action="view"]').forEach(btn => {
            btn.addEventListener('click', () => this.verDetalhes(btn.dataset.id));
        });
    },

    /**
     * Ver detalhes de um lead
     */
    async verDetalhes(id) {
        const { data: leads } = await this.listar();
        const lead = leads?.find(l => l.id === id);
        if (!lead) return;

        AdminUI.modal({
            titulo: 'Detalhes do Lead',
            body: `
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <div>
                        <small style="color: var(--text-muted); text-transform: uppercase;">Nome</small>
                        <p style="font-size: 1.1rem; font-weight: 600;">${lead.nome}</p>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <small style="color: var(--text-muted); text-transform: uppercase;">E-mail</small>
                            <p><a href="mailto:${lead.email}" style="color: var(--info);">${lead.email}</a></p>
                        </div>
                        <div>
                            <small style="color: var(--text-muted); text-transform: uppercase;">Telefone</small>
                            <p><a href="https://wa.me/55${lead.telefone.replace(/\D/g,'')}" target="_blank" style="color: var(--success);">${lead.telefone}</a></p>
                        </div>
                    </div>
                    <div>
                        <small style="color: var(--text-muted); text-transform: uppercase;">Imóvel de interesse</small>
                        <p>${lead.imovel ? `<strong>${lead.imovel.titulo}</strong> (${lead.imovel.codigo || 's/ código'})` : 'Não informado'}</p>
                    </div>
                    <div>
                        <small style="color: var(--text-muted); text-transform: uppercase;">Mensagem</small>
                        <p style="background: var(--bg-input); padding: 0.75rem; border-radius: 6px; margin-top: 0.4rem;">${lead.mensagem || '—'}</p>
                    </div>
                    <div>
                        <small style="color: var(--text-muted); text-transform: uppercase;">Origem</small>
                        <p>${this.formatarOrigem(lead.origem)} • ${lead.pagina_origem || '—'}</p>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.4rem;">
                            Notas internas
                        </label>
                        <textarea id="lead-notas" rows="3" placeholder="Adicione anotações sobre este lead...">${lead.notas_admin || ''}</textarea>
                        <button class="btn btn-primary" id="btn-salvar-notas" style="margin-top: 0.5rem;">
                            <i class="fas fa-save"></i> Salvar Notas
                        </button>
                    </div>
                    <div style="background: var(--bg-input); padding: 0.75rem; border-radius: 6px; font-size: 0.8rem; color: var(--text-muted);">
                        <i class="fas fa-info-circle"></i>
                        Recebido em ${this.formatarData(lead.created_at)}
                        ${lead.data_contato ? ` • Contatado em ${this.formatarData(lead.data_contato)}` : ''}
                    </div>
                </div>
            `
        });

        document.getElementById('btn-salvar-notas').addEventListener('click', async () => {
            const notas = document.getElementById('lead-notas').value;
            const { error } = await this.salvarNotas(id, notas);
            if (error) AdminUI.toast('Erro ao salvar notas', 'error');
            else AdminUI.toast('Notas salvas!', 'success');
        });
    },

    /**
     * Atualizar cards de estatísticas
     */
    async atualizarEstatisticas() {
        const { data: stats } = await this.getEstatisticas();
        if (!stats) return;

        const ids = {
            novo: 'count-novo',
            contatado: 'count-contatado',
            visita_agendada: 'count-visita',
            convertido: 'count-convertido'
        };
        Object.entries(ids).forEach(([key, id]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = stats[key] || 0;
        });
    },

    formatarData(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    formatarOrigem(origem) {
        const labels = {
            site_formulario: 'Site',
            site_busca: 'Busca no site',
            whatsapp: 'WhatsApp',
            telefone: 'Telefone',
            instagram: 'Instagram',
            facebook: 'Facebook',
            indicacao: 'Indicação',
            outro: 'Outro'
        };
        return labels[origem] || origem;
    }
};

window.AdminLeads = AdminLeads;
