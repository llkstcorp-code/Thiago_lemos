/**
 * ====================================================================
 * API DE IMÓVEIS - FRONTEND PÚBLICO
 * ====================================================================
 * Funções para listar, buscar e filtrar imóveis
 * Funções para salvar leads (formulário de contato)
 * ====================================================================
 */

// Verificar se Supabase foi inicializado
if (!window.supabaseClient) {
    console.warn('⚠️ Supabase não inicializado. As APIs funcionarão em modo offline (retornarão listas vazias).');
}

// Helper: verifica se o cliente está disponível
function clientOk() {
    return !!window.supabaseClient;
}

const ImoveisAPI = {

    /**
     * Buscar imóveis com filtros opcionais
     * @param {Object} filtros - { tipo, finalidade, bairro, precoMin, precoMax, busca }
     */
    async listar(filtros = {}) {
        if (!clientOk()) {
            return { data: [], error: new Error('Supabase não configurado') };
        }
        try {
            let query = window.supabaseClient
                .from('v_imoveis_publicados')
                .select('*')
                .eq('status', 'disponivel')
                .order('destaque', { ascending: false })
                .order('created_at', { ascending: false });

            // Filtro por destaque
            if (filtros.destaque === true) {
                query = query.eq('destaque', true);
            }

            // Filtro por tipo
            if (filtros.tipo && filtros.tipo !== 'all') {
                query = query.eq('tipo', filtros.tipo);
            }

            // Filtro por finalidade
            if (filtros.finalidade && filtros.finalidade !== 'all') {
                query = query.eq('finalidade', filtros.finalidade);
            }

            // Filtro por bairro
            if (filtros.bairro) {
                query = query.ilike('bairro', `%${filtros.bairro}%`);
            }

            // Filtro por preço
            if (filtros.precoMin) {
                query = query.gte('preco', filtros.precoMin);
            }
            if (filtros.precoMax) {
                query = query.lte('preco', filtros.precoMax);
            }

            // Busca textual
            if (filtros.busca) {
                query = query.or(
                    `titulo.ilike.%${filtros.busca}%,descricao.ilike.%${filtros.busca}%,bairro.ilike.%${filtros.busca}%`
                );
            }

            // Limite
            if (filtros.limite) {
                query = query.limit(filtros.limite);
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
     * Buscar imóvel por slug
     */
    async buscarPorSlug(slug) {
        if (!clientOk()) {
            return { data: null, error: new Error('Supabase não configurado') };
        }
        try {
            const { data, error } = await window.supabaseClient
                .from('v_imoveis_publicados')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error) throw error;

            // Buscar todas as fotos
            if (data) {
                const { data: fotos } = await window.supabaseClient
                    .from('imovel_fotos')
                    .select('*')
                    .eq('imovel_id', data.id)
                    .order('ordem', { ascending: true });

                data.fotos = fotos || [];
            }

            // Incrementar visualização
            if (data) {
                await window.supabaseClient.rpc('increment_imovel_view', { p_imovel_id: data.id });
            }

            return { data, error: null };
        } catch (error) {
            console.error('Erro ao buscar imóvel:', error);
            return { data: null, error };
        }
    },

    /**
     * Buscar imóveis em destaque
     */
    async destaques(limite = 6) {
        const resultado = await this.listar({ destaque: true, limite });
        return resultado;
    },

    /**
     * Renderizar card de imóvel (HTML)
     */
    renderCard(imovel) {
        const preco = this.formatarPreco(imovel.preco);
        const badge = imovel.destaque
            ? '<div class="imovel-badge">DESTAQUE</div>'
            : '';

        const coverUrl = imovel.cover_url
            ? `<img src="${imovel.cover_url}" alt="${imovel.titulo}" loading="lazy">`
            : `<div class="imovel-image-placeholder" style="background: linear-gradient(135deg, #1a1a2e, #16213e);">
                <i class="fas fa-${this.getIconePorTipo(imovel.tipo)}"></i>
               </div>`;

        return `
            <article class="imovel-card" data-category="${imovel.tipo}" data-aos="fade-up">
                <div class="imovel-image">
                    ${badge}
                    <button class="imovel-fav" data-id="${imovel.id}">
                        <i class="far fa-heart"></i>
                    </button>
                    ${coverUrl}
                </div>
                <div class="imovel-content">
                    <span class="imovel-type">${this.formatarTipo(imovel.tipo)}</span>
                    <h3 class="imovel-title">${imovel.titulo}</h3>
                    <p class="imovel-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${imovel.bairro}, ${imovel.cidade}
                    </p>
                    <div class="imovel-features">
                        ${imovel.quartos ? `<span><i class="fas fa-bed"></i> ${imovel.quartos} ${imovel.quartos > 1 ? 'quartos' : 'quarto'}</span>` : ''}
                        ${imovel.suites ? `<span><i class="fas fa-door-closed"></i> ${imovel.suites} ${imovel.suites > 1 ? 'suítes' : 'suíte'}</span>` : ''}
                        ${imovel.banheiros ? `<span><i class="fas fa-bath"></i> ${imovel.banheiros} ${imovel.banheiros > 1 ? 'banheiros' : 'banheiro'}</span>` : ''}
                        ${imovel.area_m2 ? `<span><i class="fas fa-ruler-combined"></i> ${imovel.area_m2}m²</span>` : ''}
                        ${imovel.vagas_garagem ? `<span><i class="fas fa-car"></i> ${imovel.vagas_garagem} ${imovel.vagas_garagem > 1 ? 'vagas' : 'vaga'}</span>` : ''}
                    </div>
                    <div class="imovel-footer">
                        <div class="imovel-price">
                            <span class="imovel-price-label">A partir de</span>
                            <span class="imovel-price-value">${preco}</span>
                        </div>
                        <a href="imovel.html?slug=${imovel.slug}" class="btn btn-primary btn-sm">
                            Ver Detalhes
                        </a>
                    </div>
                </div>
            </article>
        `;
    },

    /**
     * Renderizar lista de imóveis em um container
     */
    renderLista(imoveis, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!imoveis || imoveis.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-home"></i>
                    <h3>Nenhum imóvel encontrado</h3>
                    <p>Tente ajustar os filtros ou volte mais tarde.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = imoveis.map(i => this.renderCard(i)).join('');
    },

    /**
     * Buscar amenidades de um imóvel (join com a tabela amenidades)
     */
    async buscarAmenidades(imovelId) {
        if (!clientOk()) {
            return { data: [], error: new Error('Supabase não configurado') };
        }
        try {
            const { data, error } = await window.supabaseClient
                .from('imovel_amenidades')
                .select('amenidades(nome, icone, categoria)')
                .eq('imovel_id', imovelId);

            if (error) throw error;
            return { data: (data || []).map(row => row.amenidades), error: null };
        } catch (error) {
            console.error('Erro ao buscar amenidades:', error);
            return { data: [], error };
        }
    },

    /**
     * Formatação helpers
     */
    formatarPreco(valor) {
        if (!valor) return 'Consulte';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0
        }).format(valor);
    },

    formatarTipo(tipo) {
        const tipos = {
            apartamento: 'Apartamento',
            casa: 'Casa',
            cobertura: 'Cobertura',
            terreno: 'Terreno',
            comercial: 'Comercial',
            rural: 'Rural'
        };
        return tipos[tipo] || tipo;
    },

    getIconePorTipo(tipo) {
        const icones = {
            apartamento: 'building',
            casa: 'home',
            cobertura: 'city',
            terreno: 'map',
            comercial: 'briefcase',
            rural: 'tractor'
        };
        return icones[tipo] || 'home';
    }
};

// ====================================================================
// LEADS API
// ====================================================================

const LeadsAPI = {
    /**
     * Salvar lead do formulário de contato
     */
    async criar(dados) {
        if (!clientOk()) {
            return { data: null, error: new Error('Supabase não configurado') };
        }
        try {
            // Sem .select(): o RLS só deixa staff LER a tabela de leads, então
            // pedir a linha de volta faria o insert inteiro ser recusado.
            const { error } = await window.supabaseClient
                .from('leads')
                .insert([{
                    nome: dados.nome,
                    email: dados.email,
                    telefone: dados.telefone,
                    mensagem: dados.mensagem || null,
                    imovel_id: dados.imovel_id || null,
                    origem: dados.origem || 'site_formulario',
                    pagina_origem: window.location.href,
                    status: 'novo'
                }]);

            if (error) throw error;
            return { data: null, error: null };
        } catch (error) {
            console.error('Erro ao salvar lead:', error);
            return { data: null, error };
        }
    }
};

// ====================================================================
// FAVORITOS API
// ====================================================================

const FavoritosAPI = {
    /**
     * Obter session_id único para o visitante
     */
    getSessionId() {
        let sessionId = localStorage.getItem('tl_session_id');
        if (!sessionId) {
            sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem('tl_session_id', sessionId);
        }
        return sessionId;
    },

    /**
     * Adicionar imóvel aos favoritos
     */
    async adicionar(imovelId) {
        if (!clientOk()) {
            return { data: null, error: new Error('Supabase não configurado') };
        }
        try {
            const { data, error } = await window.supabaseClient
                .from('favoritos')
                .insert([{
                    imovel_id: imovelId,
                    session_id: this.getSessionId()
                }])
                .select();

            if (error && error.code !== '23505') throw error; // ignora duplicata
            return { data, error: null };
        } catch (error) {
            console.error('Erro ao favoritar:', error);
            return { data: null, error };
        }
    },

    /**
     * Remover dos favoritos
     */
    async remover(imovelId) {
        if (!clientOk()) {
            return { error: new Error('Supabase não configurado') };
        }
        try {
            const { error } = await window.supabaseClient
                .from('favoritos')
                .delete()
                .eq('imovel_id', imovelId)
                .eq('session_id', this.getSessionId());

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Erro ao desfavoritar:', error);
            return { error };
        }
    },

    /**
     * Listar favoritos do visitante
     */
    async listar() {
        if (!clientOk()) {
            return { data: [], error: new Error('Supabase não configurado') };
        }
        try {
            const { data, error } = await window.supabaseClient
                .from('favoritos')
                .select(`
                    imovel_id,
                    created_at,
                    imoveis:v_imoveis_publicados(*)
                `)
                .eq('session_id', this.getSessionId())
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Erro ao listar favoritos:', error);
            return { data: null, error };
        }
    },

    /**
     * Verificar se um imóvel está favoritado
     */
    async verificar(imovelId) {
        if (!clientOk()) {
            return { favoritado: false, error: new Error('Supabase não configurado') };
        }
        try {
            const { data, error } = await window.supabaseClient
                .from('favoritos')
                .select('id')
                .eq('imovel_id', imovelId)
                .eq('session_id', this.getSessionId())
                .maybeSingle();

            if (error) throw error;
            return { favoritado: !!data, error: null };
        } catch (error) {
            return { favoritado: false, error };
        }
    }
};

// Exportar para window
window.ImoveisAPI = ImoveisAPI;
window.LeadsAPI = LeadsAPI;
window.FavoritosAPI = FavoritosAPI;

console.log('✅ API Supabase carregada');
