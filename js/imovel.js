/**
 * ====================================================================
 * PÁGINA DE DETALHES DO IMÓVEL
 * ====================================================================
 * Lê o slug da URL (?slug=...), busca o imóvel no Supabase e
 * preenche a página. Também envia o formulário de contato como lead.
 * ====================================================================
 */

(function () {
    const estadoCarregando = document.getElementById('estado-carregando');
    const estadoErro = document.getElementById('estado-erro');
    const conteudo = document.getElementById('imovel-conteudo');

    function mostrarErro() {
        estadoCarregando.style.display = 'none';
        estadoErro.style.display = 'flex';
    }

    function getSlug() {
        const params = new URLSearchParams(window.location.search);
        return params.get('slug');
    }

    function formatarWhatsapp(numero) {
        // remove tudo que não é dígito
        return (numero || '').replace(/\D/g, '');
    }

    function pluralizar(quantidade, singular, plural) {
        // em pt-BR só o 1 usa singular ("0 quartos", "2 quartos")
        return `${quantidade} ${quantidade === 1 ? singular : plural}`;
    }

    let fotos = [];
    let indiceFoto = 0;

    function renderFotoAtual() {
        const principal = document.getElementById('foto-principal');
        const contador = document.getElementById('galeria-contador');

        if (fotos.length === 0) {
            principal.src = 'img/logo.jpeg';
            contador.textContent = '1 / 1';
            return;
        }

        principal.src = fotos[indiceFoto].url;
        contador.textContent = `${indiceFoto + 1} / ${fotos.length}`;

        document.querySelectorAll('.galeria-thumbs img').forEach((img, i) => {
            img.classList.toggle('ativa', i === indiceFoto);
        });
    }

    function montarGaleria() {
        const thumbsContainer = document.getElementById('galeria-thumbs');

        if (fotos.length === 0) {
            thumbsContainer.style.display = 'none';
            document.getElementById('galeria-prev').style.display = 'none';
            document.getElementById('galeria-next').style.display = 'none';
            renderFotoAtual();
            return;
        }

        thumbsContainer.innerHTML = fotos
            .map((f, i) => `<img src="${f.url}" alt="Foto ${i + 1}" data-index="${i}">`)
            .join('');

        thumbsContainer.querySelectorAll('img').forEach(img => {
            img.addEventListener('click', () => {
                indiceFoto = parseInt(img.dataset.index, 10);
                renderFotoAtual();
            });
        });

        renderFotoAtual();
    }

    function preencherPagina(imovel) {
        document.getElementById('page-title').textContent =
            `${imovel.titulo} | Thiago Lemos Imóveis`;
        document.getElementById('bc-titulo').textContent = imovel.titulo;
        document.getElementById('info-tipo').textContent = ImoveisAPI.formatarTipo(imovel.tipo);
        document.getElementById('info-titulo').textContent = imovel.titulo;

        const enderecoPartes = [imovel.bairro, imovel.cidade].filter(Boolean);
        document.getElementById('info-endereco').textContent = enderecoPartes.join(', ');

        document.getElementById('feat-quartos').innerHTML =
            `<i class="fas fa-bed"></i> ${pluralizar(imovel.quartos || 0, 'quarto', 'quartos')}`;
        document.getElementById('feat-suites').innerHTML =
            `<i class="fas fa-door-closed"></i> ${pluralizar(imovel.suites || 0, 'suíte', 'suítes')}`;
        document.getElementById('feat-banheiros').innerHTML =
            `<i class="fas fa-bath"></i> ${pluralizar(imovel.banheiros || 0, 'banheiro', 'banheiros')}`;
        document.getElementById('feat-area').innerHTML =
            `<i class="fas fa-ruler-combined"></i> ${imovel.area_m2 || '--'} m²`;
        document.getElementById('feat-vagas').innerHTML =
            `<i class="fas fa-car"></i> ${pluralizar(imovel.vagas_garagem || 0, 'vaga', 'vagas')}`;

        document.getElementById('info-descricao').textContent =
            imovel.descricao || 'Sem descrição cadastrada para este imóvel.';

        document.getElementById('info-codigo').textContent = imovel.codigo || '--';

        document.getElementById('info-preco').textContent = ImoveisAPI.formatarPreco(imovel.preco);

        const extras = [];
        if (imovel.preco_condominio) {
            extras.push(`Condomínio: ${ImoveisAPI.formatarPreco(imovel.preco_condominio)}`);
        }
        if (imovel.preco_iptu) {
            extras.push(`IPTU: ${ImoveisAPI.formatarPreco(imovel.preco_iptu)}`);
        }
        document.getElementById('info-condominio-iptu').textContent = extras.join(' · ');

        if (imovel.destaque) {
            document.getElementById('galeria-badge').style.display = 'block';
        }

        // Corretor
        if (imovel.corretor_nome) {
            document.getElementById('corretor-card').style.display = 'block';
            document.getElementById('corretor-nome').textContent = imovel.corretor_nome;
            document.getElementById('corretor-creci').textContent =
                imovel.corretor_creci ? `CRECI ${imovel.corretor_creci}` : '';
        }

        // Botão WhatsApp
        const numeroWpp = formatarWhatsapp(imovel.corretor_telefone) || '5535997418298';
        const mensagem = encodeURIComponent(
            `Olá! Tenho interesse no imóvel "${imovel.titulo}" (código ${imovel.codigo || ''}).`
        );
        const linkWhatsapp = `https://wa.me/${numeroWpp}?text=${mensagem}`;
        document.getElementById('btn-whatsapp').addEventListener('click', () => {
            window.open(linkWhatsapp, '_blank');
        });
        document.getElementById('whatsapp-float').href = linkWhatsapp;

        // Fotos
        fotos = imovel.fotos && imovel.fotos.length > 0
            ? imovel.fotos.map(f => ({ url: f.url }))
            : (imovel.cover_url ? [{ url: imovel.cover_url }] : []);
        montarGaleria();

        // Amenidades
        ImoveisAPI.buscarAmenidades(imovel.id).then(({ data: amenidades }) => {
            if (amenidades && amenidades.length > 0) {
                const bloco = document.getElementById('bloco-amenidades');
                const lista = document.getElementById('lista-amenidades');
                lista.innerHTML = amenidades
                    .map(a => `<li><i class="${a.icone || 'fas fa-check'}"></i> ${a.nome}</li>`)
                    .join('');
                bloco.style.display = 'block';
            }
        });

        // Formulário de lead
        const leadForm = document.getElementById('lead-form');
        leadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const dados = {
                nome: document.getElementById('lead-nome').value,
                email: document.getElementById('lead-email').value,
                telefone: document.getElementById('lead-telefone').value,
                mensagem: document.getElementById('lead-mensagem').value,
                imovel_id: imovel.id,
                origem: 'pagina_imovel'
            };

            const submitBtn = leadForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';

            const { error } = await LeadsAPI.criar(dados);

            submitBtn.disabled = false;
            if (error) {
                submitBtn.textContent = 'Erro ao enviar, tente novamente';
            } else {
                submitBtn.textContent = 'Mensagem enviada!';
                leadForm.reset();
            }
        });

        estadoCarregando.style.display = 'none';
        conteudo.style.display = 'block';
    }

    async function init() {
        const slug = getSlug();

        if (!slug) {
            mostrarErro();
            return;
        }

        if (!window.ImoveisAPI || !window.supabaseClient) {
            mostrarErro();
            return;
        }

        const { data: imovel, error } = await ImoveisAPI.buscarPorSlug(slug);

        if (error || !imovel) {
            mostrarErro();
            return;
        }

        preencherPagina(imovel);
    }

    document.addEventListener('DOMContentLoaded', () => {
        init();

        document.getElementById('galeria-prev')?.addEventListener('click', () => {
            if (fotos.length === 0) return;
            indiceFoto = (indiceFoto - 1 + fotos.length) % fotos.length;
            renderFotoAtual();
        });
        document.getElementById('galeria-next')?.addEventListener('click', () => {
            if (fotos.length === 0) return;
            indiceFoto = (indiceFoto + 1) % fotos.length;
            renderFotoAtual();
        });

        // Voltar ao topo
        const backToTop = document.getElementById('back-to-top');
        window.addEventListener('scroll', () => {
            backToTop.classList.toggle('show', window.scrollY > 400);
        });
        backToTop?.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
})();
