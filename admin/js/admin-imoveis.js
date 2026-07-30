/**
 * CRUD de Imóveis - Painel Admin
 */

const AdminImoveis = {

    /**
     * Listar todos os imóveis (admin vê todos os status)
     */
    async listar(filtros = {}) {
        try {
            let query = window.supabaseClient
                .from('imoveis')
                .select(`
                    *,
                    imovel_fotos:imovel_fotos(id, url, is_cover, ordem)
                `)
                .order('created_at', { ascending: false });

            if (filtros.status) {
                query = query.eq('status', filtros.status);
            }

            if (filtros.busca) {
                query = query.or(
                    `titulo.ilike.%${filtros.busca}%,bairro.ilike.%${filtros.busca}%,codigo.ilike.%${filtros.busca}%`
                );
            }

            const { data, error } = await query;
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Erro ao listar imóveis:', error);
            return { data: null, error };
        }
    },

    /**
     * Buscar imóvel por ID (com fotos e amenidades)
     */
    async buscarPorId(id) {
        try {
            const { data, error } = await window.supabaseClient
                .from('imoveis')
                .select(`
                    *,
                    imovel_fotos(*),
                    imovel_amenidades(amenidade_id)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Erro ao buscar imóvel:', error);
            return { data: null, error };
        }
    },

    /**
     * Criar novo imóvel
     */
    async criar(dados) {
        try {
            // Remover campos vazios
            Object.keys(dados).forEach(k => {
                if (dados[k] === '' || dados[k] === null) delete dados[k];
            });

            dados.created_by = window.currentUser?.id;

            const { data, error } = await window.supabaseClient
                .from('imoveis')
                .insert([dados])
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Erro ao criar imóvel:', error);
            return { data: null, error: error.message };
        }
    },

    /**
     * Atualizar imóvel
     */
    async atualizar(id, dados) {
        try {
            Object.keys(dados).forEach(k => {
                if (dados[k] === '') delete dados[k];
            });

            const { data, error } = await window.supabaseClient
                .from('imoveis')
                .update(dados)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Erro ao atualizar imóvel:', error);
            return { data: null, error: error.message };
        }
    },

    /**
     * Deletar imóvel
     */
    async deletar(id) {
        try {
            // 1. Buscar fotos para deletar do storage
            const { data: fotos } = await window.supabaseClient
                .from('imovel_fotos')
                .select('storage_path')
                .eq('imovel_id', id);

            // 2. Deletar arquivos do storage
            if (fotos && fotos.length > 0) {
                const paths = fotos.map(f => f.storage_path).filter(Boolean);
                if (paths.length > 0) {
                    await window.supabaseClient.storage
                        .from('imoveis-fotos')
                        .remove(paths);
                }
            }

            // 3. Deletar imóvel (cascade apaga fotos e amenidades)
            const { error } = await window.supabaseClient
                .from('imoveis')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Erro ao deletar imóvel:', error);
            return { error: error.message };
        }
    },

    /**
     * Salvar amenidades do imóvel
     */
    async salvarAmenidades(imovelId, amenidadesIds) {
        try {
            // Deletar existentes
            await window.supabaseClient
                .from('imovel_amenidades')
                .delete()
                .eq('imovel_id', imovelId);

            // Inserir novas
            if (amenidadesIds && amenidadesIds.length > 0) {
                const rows = amenidadesIds.map(aid => ({
                    imovel_id: imovelId,
                    amenidade_id: aid
                }));
                const { error } = await window.supabaseClient
                    .from('imovel_amenidades')
                    .insert(rows);
                if (error) throw error;
            }
            return { error: null };
        } catch (error) {
            console.error('Erro ao salvar amenidades:', error);
            return { error: error.message };
        }
    },

    /**
     * Toggle destaque
     */
    async toggleDestaque(id, destaque) {
        const { error } = await window.supabaseClient
            .from('imoveis')
            .update({ destaque: !destaque })
            .eq('id', id);
        return { error };
    },

    /**
     * Renderizar tabela de imóveis
     */
    async renderTabela(filtros = {}) {
        const tbody = document.querySelector('#table-imoveis tbody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="9" class="empty-state-mini">Carregando...</td></tr>';

        const { data } = await this.listar(filtros);

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state-mini">Nenhum imóvel encontrado</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(imovel => {
            const cover = imovel.imovel_fotos?.find(f => f.is_cover) || imovel.imovel_fotos?.[0];
            const coverUrl = cover?.url
                ? `style="background-image: url('${cover.url}')"`
                : '';

            const tipoLabel = {
                apartamento: 'Apartamento',
                casa: 'Casa',
                cobertura: 'Cobertura',
                terreno: 'Terreno',
                comercial: 'Comercial',
                rural: 'Rural'
            }[imovel.tipo] || imovel.tipo;

            return `
                <tr data-id="${imovel.id}">
                    <td><div class="thumb-table" ${coverUrl}></div></td>
                    <td><code>${imovel.codigo || '—'}</code></td>
                    <td><strong>${imovel.titulo}</strong></td>
                    <td>${tipoLabel}</td>
                    <td>${imovel.bairro}</td>
                    <td><strong>${this.formatarPreco(imovel.preco)}</strong></td>
                    <td><span class="badge badge-${imovel.status}">${this.formatarStatus(imovel.status)}</span></td>
                    <td>
                        <i class="fas fa-star destaque-star ${imovel.destaque ? 'active' : ''}"
                           data-action="toggle-destaque"
                           data-id="${imovel.id}"
                           data-destaque="${imovel.destaque}"
                           title="${imovel.destaque ? 'Remover destaque' : 'Marcar como destaque'}"></i>
                    </td>
                    <td>
                        <button class="btn-table" data-action="edit" data-id="${imovel.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-table danger" data-action="delete" data-id="${imovel.id}" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Event listeners
        tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', () => this.editar(btn.dataset.id));
        });
        tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => this.confirmarDelete(btn.dataset.id));
        });
        tbody.querySelectorAll('[data-action="toggle-destaque"]').forEach(icon => {
            icon.addEventListener('click', async () => {
                const id = icon.dataset.id;
                const atual = icon.dataset.destaque === 'true';
                const { error } = await this.toggleDestaque(id, atual);
                if (!error) await this.renderTabela(filtros);
            });
        });
    },

    async editar(id) {
        const { data: imovel } = await this.buscarPorId(id);
        if (!imovel) return;

        // Trocar para view de formulário (limpa o form e dispara o render das amenidades)
        AdminUI.switchView('novo-imovel');
        document.getElementById('page-title').textContent = 'Editar Imóvel';

        // Preencher campos
        this.preencherFormulario(imovel);

        // Carregar fotos
        if (imovel.imovel_fotos) {
            AdminFotos.carregar(imovel.imovel_fotos);
        }

        // Esperar o grid de amenidades terminar de renderizar antes de marcar,
        // senão o innerHTML do render assíncrono apaga as marcações
        await AdminUI.amenidadesProntas();

        if (imovel.imovel_amenidades) {
            AdminAmenidades.marcarSelecionadas(imovel.imovel_amenidades.map(a => a.amenidade_id));
        }
    },

    /**
     * Preencher formulário com dados do imóvel
     */
    preencherFormulario(imovel) {
        // O hidden que identifica o registro em edição chama-se "imovel-id".
        // Sem isto o salvar() enxerga id vazio e cria um imóvel novo.
        document.getElementById('imovel-id').value = imovel.id ?? '';

        // published_at só deve ser definido na primeira publicação
        this._publishedAtOriginal = imovel.published_at || null;

        const campos = [
            'titulo', 'descricao', 'tipo', 'finalidade', 'status',
            'preco', 'preco_condominio', 'preco_iptu',
            'area_m2', 'area_construida_m2', 'quartos', 'suites', 'banheiros',
            'vagas_garagem', 'andar', 'total_andares',
            'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'cep',
            'codigo'
        ];

        campos.forEach(campo => {
            const el = document.getElementById(campo);
            if (el) el.value = imovel[campo] ?? '';
        });

        // Checkboxes
        const checks = ['destaque', 'aceita_financiamento', 'aceita_fgts', 'mobiliado'];
        checks.forEach(c => {
            const el = document.getElementById(c);
            if (el) el.checked = !!imovel[c];
        });
    },

    limparFormulario() {
        const form = document.getElementById('form-imovel');
        if (form) form.reset();
        document.getElementById('imovel-id').value = '';
        this._publishedAtOriginal = null;
        AdminAmenidades.limparSelecao();
        AdminFotos.reset();
    },

    /**
     * Salvar imóvel (criar ou atualizar)
     */
    async salvar(event) {
        if (event) event.preventDefault();

        // Evita que dois cliques rápidos gerem dois registros
        if (this._salvando) return;
        this._salvando = true;

        const btnSalvar = document.querySelector('#form-imovel button[type="submit"]');
        if (btnSalvar) btnSalvar.disabled = true;

        try {
            await this._salvarInterno();
        } finally {
            this._salvando = false;
            if (btnSalvar) btnSalvar.disabled = false;
        }
    },

    async _salvarInterno() {
        const id = document.getElementById('imovel-id').value;

        // Coletar dados do formulário
        const dados = {
            titulo: document.getElementById('titulo').value.trim(),
            descricao: document.getElementById('descricao').value.trim() || null,
            tipo: document.getElementById('tipo').value,
            finalidade: document.getElementById('finalidade').value,
            status: document.getElementById('status').value,
            preco: parseFloat(document.getElementById('preco').value) || 0,
            preco_condominio: parseFloat(document.getElementById('preco_condominio').value) || null,
            preco_iptu: parseFloat(document.getElementById('preco_iptu').value) || null,
            aceita_financiamento: document.getElementById('aceita_financiamento').checked,
            aceita_fgts: document.getElementById('aceita_fgts').checked,
            area_m2: parseFloat(document.getElementById('area_m2').value) || null,
            area_construida_m2: parseFloat(document.getElementById('area_construida_m2').value) || null,
            quartos: parseInt(document.getElementById('quartos').value) || 0,
            suites: parseInt(document.getElementById('suites').value) || 0,
            banheiros: parseInt(document.getElementById('banheiros').value) || 0,
            vagas_garagem: parseInt(document.getElementById('vagas_garagem').value) || 0,
            andar: parseInt(document.getElementById('andar').value) || null,
            total_andares: parseInt(document.getElementById('total_andares').value) || null,
            mobiliado: document.getElementById('mobiliado').checked,
            destaque: document.getElementById('destaque').checked,
            endereco: document.getElementById('endereco').value.trim() || null,
            numero: document.getElementById('numero').value.trim() || null,
            complemento: document.getElementById('complemento').value.trim() || null,
            bairro: document.getElementById('bairro').value.trim(),
            cidade: document.getElementById('cidade').value.trim(),
            estado: document.getElementById('estado').value.trim().toUpperCase(),
            cep: document.getElementById('cep').value.trim() || null
        };

        // Se marcando como disponível e ainda não foi publicado, setar
        if (dados.status === 'disponivel' && !this._publishedAtOriginal) {
            dados.published_at = new Date().toISOString();
        }

        let resultado;
        if (id) {
            // Atualizar
            resultado = await this.atualizar(id, dados);
        } else {
            // Criar
            resultado = await this.criar(dados);
        }

        if (resultado.error) {
            AdminUI.toast('Erro: ' + resultado.error, 'error');
            return;
        }

        const imovelId = resultado.data.id;

        // Salvar amenidades
        const amenidades = AdminAmenidades.getSelecionadas();
        await this.salvarAmenidades(imovelId, amenidades);

        // Fotos: apagar as removidas e subir/atualizar as demais
        await AdminFotos.removerPendentes();
        if (AdminFotos.fotos.length > 0) {
            AdminUI.toast('Fazendo upload das fotos...', 'success');
            await AdminFotos.uploadTodas(imovelId);
        }

        AdminUI.toast(id ? 'Imóvel atualizado com sucesso!' : 'Imóvel criado com sucesso!', 'success');
        this.limparFormulario();
        AdminUI.switchView('imoveis');
        await this.renderTabela();
    },

    async confirmarDelete(id) {
        const { data: imovel } = await this.buscarPorId(id);
        if (!imovel) return;

        AdminUI.modal({
            titulo: 'Confirmar exclusão',
            body: `
                <p>Tem certeza que deseja excluir o imóvel:</p>
                <p><strong>${imovel.titulo}</strong> (${imovel.codigo || 's/ código'})?</p>
                <p style="color: var(--danger); margin-top: 1rem;">
                    <i class="fas fa-exclamation-triangle"></i>
                    Esta ação não pode ser desfeita. Todas as fotos serão apagadas.
                </p>
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.5rem;">
                    <button class="btn btn-outline" onclick="AdminUI.fecharModal()">Cancelar</button>
                    <button class="btn btn-danger" id="btn-confirmar-delete">
                        <i class="fas fa-trash"></i> Sim, excluir
                    </button>
                </div>
            `
        });

        document.getElementById('btn-confirmar-delete').addEventListener('click', async () => {
            const { error } = await this.deletar(id);
            if (error) {
                AdminUI.toast('Erro ao excluir: ' + error, 'error');
            } else {
                AdminUI.toast('Imóvel excluído', 'success');
                AdminUI.fecharModal();
                await this.renderTabela();
            }
        });
    },

    // Helpers
    formatarPreco(valor) {
        if (!valor) return 'R$ 0';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0
        }).format(valor);
    },

    formatarStatus(status) {
        const labels = {
            rascunho: 'Rascunho',
            disponivel: 'Disponível',
            reservado: 'Reservado',
            vendido: 'Vendido',
            alugado: 'Alugado'
        };
        return labels[status] || status;
    }
};

window.AdminImoveis = AdminImoveis;
