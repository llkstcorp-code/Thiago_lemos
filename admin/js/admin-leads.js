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

            // Arquivados ficam fora da listagem padrão
            if (!filtros.incluirArquivados) {
                query = query.eq('arquivado', false);
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
            // Arquivados não entram na contagem
            const { data, error } = await window.supabaseClient
                .from('leads')
                .select('status')
                .eq('arquivado', false);

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
     * Arquivar / desarquivar um lead.
     * Arquivar é reversível e some da listagem padrão — é o caminho normal
     * para spam e preenchimentos errados.
     */
    async arquivar(id, arquivado = true) {
        const { error } = await window.supabaseClient
            .from('leads')
            .update({ arquivado })
            .eq('id', id);
        return { error };
    },

    /**
     * Excluir um lead em definitivo. Só admin consegue (política
     * leads_admin_delete); não tem volta.
     */
    async excluir(id) {
        const { error } = await window.supabaseClient
            .from('leads')
            .delete()
            .eq('id', id);
        return { error };
    },

    /**
     * Escapa texto vindo do visitante antes de jogar no innerHTML.
     * Os leads são preenchidos por qualquer pessoa no site: sem isso,
     * alguém pode injetar HTML na tela do painel.
     */
    esc(valor) {
        return String(valor ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[c]);
    },

    /**
     * Renderizar tabela de leads
     */
    async renderTabela(filtroStatus = null, incluirArquivados = false) {
        const tbody = document.querySelector('#table-leads tbody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="7" class="empty-state-mini">Carregando...</td></tr>';

        const filtros = { incluirArquivados };
        if (filtroStatus) filtros.status = filtroStatus;
        const { data } = await this.listar(filtros);

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state-mini">Nenhum lead encontrado</td></tr>';
            return;
        }

        const esc = v => this.esc(v);

        tbody.innerHTML = data.map(lead => `
            <tr data-id="${esc(lead.id)}" class="${lead.arquivado ? 'linha-arquivada' : ''}">
                <td><small>${this.formatarData(lead.created_at)}</small></td>
                <td>
                    <strong>${esc(lead.nome)}</strong>
                    ${lead.arquivado ? '<span class="badge badge-rascunho">arquivado</span>' : ''}
                    ${lead.imovel ? `<br><small style="color: var(--text-muted);">Sobre: ${esc(lead.imovel.titulo)}</small>` : ''}
                </td>
                <td>
                    <a href="mailto:${esc(lead.email)}" style="color: var(--info);">${esc(lead.email)}</a><br>
                    <a href="https://wa.me/55${esc(lead.telefone).replace(/\D/g,'')}" target="_blank" style="color: var(--success);">
                        ${esc(lead.telefone)}
                    </a>
                </td>
                <td><small>${esc((lead.mensagem || '').substring(0, 80))}${lead.mensagem && lead.mensagem.length > 80 ? '...' : ''}</small></td>
                <td><span class="badge badge-rascunho">${esc(this.formatarOrigem(lead.origem))}</span></td>
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
                    <button class="btn-table" data-action="view" data-id="${esc(lead.id)}" title="Ver detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    <a href="https://wa.me/55${esc(lead.telefone).replace(/\D/g,'')}" target="_blank" class="btn-table" title="Abrir WhatsApp" style="color: var(--success);">
                        <i class="fab fa-whatsapp"></i>
                    </a>
                    <button class="btn-table" data-action="${lead.arquivado ? 'unarchive' : 'archive'}" data-id="${esc(lead.id)}"
                            title="${lead.arquivado ? 'Desarquivar' : 'Arquivar'}">
                        <i class="fas fa-box${lead.arquivado ? '-open' : ''}"></i>
                    </button>
                    <button class="btn-table" data-action="delete" data-id="${esc(lead.id)}" title="Excluir em definitivo" style="color: var(--danger);">
                        <i class="fas fa-trash"></i>
                    </button>
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

        tbody.querySelectorAll('[data-action="archive"], [data-action="unarchive"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const arquivar = btn.dataset.action === 'archive';
                const { error } = await this.arquivar(btn.dataset.id, arquivar);
                if (error) {
                    AdminUI.toast('Erro ao arquivar', 'error');
                } else {
                    AdminUI.toast(arquivar ? 'Lead arquivado' : 'Lead desarquivado', 'success');
                    await this.renderTabela(filtroStatus, incluirArquivados);
                    await this.atualizarEstatisticas();
                }
            });
        });

        tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => this.confirmarExclusao(btn.dataset.id, filtroStatus, incluirArquivados));
        });
    },

    /**
     * Confirmação antes de excluir em definitivo
     */
    async confirmarExclusao(id, filtroStatus = null, incluirArquivados = false) {
        const { data: leads } = await this.listar({ incluirArquivados: true });
        const lead = leads?.find(l => l.id === id);
        if (!lead) return;

        AdminUI.modal({
            titulo: 'Confirmar exclusão',
            body: `
                <p>Tem certeza que deseja excluir o lead de:</p>
                <p><strong>${this.esc(lead.nome)}</strong> (${this.esc(lead.email)})?</p>
                <p style="color: var(--danger); margin-top: 1rem;">
                    <i class="fas fa-exclamation-triangle"></i>
                    Esta ação não pode ser desfeita. Se a ideia é só tirar da lista,
                    use <strong>arquivar</strong> — dá para voltar atrás depois.
                </p>
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.5rem;">
                    <button class="btn btn-outline" id="btn-cancelar-lead">Cancelar</button>
                    <button class="btn btn-danger" id="btn-confirmar-lead">
                        <i class="fas fa-trash"></i> Sim, excluir
                    </button>
                </div>
            `
        });

        document.getElementById('btn-cancelar-lead').addEventListener('click', () => AdminUI.fecharModal());

        document.getElementById('btn-confirmar-lead').addEventListener('click', async () => {
            const { error } = await this.excluir(id);
            if (error) {
                AdminUI.toast('Erro ao excluir o lead', 'error');
            } else {
                AdminUI.toast('Lead excluído', 'success');
                AdminUI.fecharModal();
                await this.renderTabela(filtroStatus, incluirArquivados);
                await this.atualizarEstatisticas();
            }
        });
    },

    /**
     * Ver detalhes de um lead
     */
    async verDetalhes(id) {
        const { data: leads } = await this.listar({ incluirArquivados: true });
        const lead = leads?.find(l => l.id === id);
        if (!lead) return;

        const esc = v => this.esc(v);

        AdminUI.modal({
            titulo: 'Detalhes do Lead',
            body: `
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <div>
                        <small style="color: var(--text-muted); text-transform: uppercase;">Nome</small>
                        <p style="font-size: 1.1rem; font-weight: 600;">${esc(lead.nome)}</p>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <small style="color: var(--text-muted); text-transform: uppercase;">E-mail</small>
                            <p><a href="mailto:${esc(lead.email)}" style="color: var(--info);">${esc(lead.email)}</a></p>
                        </div>
                        <div>
                            <small style="color: var(--text-muted); text-transform: uppercase;">Telefone</small>
                            <p><a href="https://wa.me/55${esc(lead.telefone).replace(/\D/g,'')}" target="_blank" style="color: var(--success);">${esc(lead.telefone)}</a></p>
                        </div>
                    </div>
                    <div>
                        <small style="color: var(--text-muted); text-transform: uppercase;">Imóvel de interesse</small>
                        <p>${lead.imovel ? `<strong>${esc(lead.imovel.titulo)}</strong> (${esc(lead.imovel.codigo || 's/ código')})` : 'Não informado'}</p>
                    </div>
                    <div>
                        <small style="color: var(--text-muted); text-transform: uppercase;">Mensagem</small>
                        <p style="background: var(--bg-input); padding: 0.75rem; border-radius: 6px; margin-top: 0.4rem;">${esc(lead.mensagem) || '—'}</p>
                    </div>
                    <div>
                        <small style="color: var(--text-muted); text-transform: uppercase;">Origem</small>
                        <p>${esc(this.formatarOrigem(lead.origem))} • ${esc(lead.pagina_origem) || '—'}</p>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.4rem;">
                            Notas internas
                        </label>
                        <textarea id="lead-notas" rows="3" placeholder="Adicione anotações sobre este lead...">${esc(lead.notas_admin)}</textarea>
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
