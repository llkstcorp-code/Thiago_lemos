/**
 * Upload e gestão de Fotos dos Imóveis
 */

const AdminFotos = {
    fotos: [], // { id?, file, url, storage_path?, isNew, isCover, ordem }

    /**
     * Inicializar zona de upload
     */
    init() {
        const zone = document.getElementById('upload-zone');
        const input = document.getElementById('foto-input');
        if (!zone || !input) return;

        zone.addEventListener('click', () => input.click());

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });

        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            this.adicionarArquivos(files);
        });

        input.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.adicionarArquivos(files);
            e.target.value = ''; // reset
        });
    },

    /**
     * Adicionar arquivos selecionados (preview local)
     */
    async adicionarArquivos(files) {
        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                AdminUI.toast('Apenas imagens são permitidas', 'warning');
                continue;
            }
            if (file.size > 10 * 1024 * 1024) {
                AdminUI.toast('Imagem muito grande (max 10MB)', 'warning');
                continue;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                this.fotos.push({
                    file: file,
                    preview: e.target.result,
                    isNew: true,
                    isCover: this.fotos.length === 0, // primeira vira capa
                    ordem: this.fotos.length
                });
                this.render();
            };
            reader.readAsDataURL(file);
        }
    },

    /**
     * Carregar fotos existentes (edição)
     */
    carregar(fotos) {
        this.fotos = fotos.map((f, i) => ({
            id: f.id,
            url: f.url,
            storage_path: f.storage_path,
            isNew: false,
            isCover: f.is_cover,
            ordem: f.ordem ?? i
        }));
        this.fotos.sort((a, b) => a.ordem - b.ordem);
        this.render();
    },

    /**
     * Renderizar grid de fotos
     */
    render() {
        const grid = document.getElementById('fotos-grid');
        if (!grid) return;

        if (this.fotos.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">Nenhuma foto adicionada</p>';
            return;
        }

        grid.innerHTML = this.fotos.map((foto, i) => {
            const src = foto.preview || foto.url;
            return `
                <div class="foto-item ${foto.isCover ? 'cover' : ''}" data-index="${i}" draggable="true">
                    <img src="${src}" alt="Foto ${i + 1}">
                    ${foto.isCover ? '<div class="foto-cover-badge"><i class="fas fa-star"></i> CAPA</div>' : ''}
                    <div class="foto-actions">
                        <button type="button" data-action="cover" title="Definir como capa">
                            <i class="fas fa-star"></i>
                        </button>
                        <button type="button" data-action="remove" title="Remover" class="danger">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Ações
        grid.querySelectorAll('.foto-item').forEach(item => {
            const idx = parseInt(item.dataset.index);

            item.querySelector('[data-action="cover"]').addEventListener('click', () => this.definirCapa(idx));
            item.querySelector('[data-action="remove"]').addEventListener('click', () => this.remover(idx));

            // Drag and drop
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', idx);
                item.style.opacity = '0.4';
            });
            item.addEventListener('dragend', () => item.style.opacity = '1');
            item.addEventListener('dragover', (e) => e.preventDefault());
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                this.reordenar(fromIdx, idx);
            });
        });
    },

    definirCapa(idx) {
        this.fotos.forEach(f => f.isCover = false);
        this.fotos[idx].isCover = true;
        this.render();
    },

    remover(idx) {
        if (!confirm('Remover esta foto?')) return;
        this.fotos.splice(idx, 1);
        if (this.fotos.length > 0 && !this.fotos.some(f => f.isCover)) {
            this.fotos[0].isCover = true;
        }
        this.render();
    },

    reordenar(from, to) {
        const item = this.fotos.splice(from, 1)[0];
        this.fotos.splice(to, 0, item);
        this.fotos.forEach((f, i) => f.ordem = i);
        this.render();
    },

    /**
     * Upload de todas as fotos novas para o Supabase Storage
     */
    async uploadTodas(imovelId) {
        const uploaded = [];

        for (let i = 0; i < this.fotos.length; i++) {
            const foto = this.fotos[i];

            if (!foto.isNew) {
                // Foto existente - só atualizar ordem/capa
                await window.supabaseClient
                    .from('imovel_fotos')
                    .update({
                        ordem: foto.ordem,
                        is_cover: foto.isCover
                    })
                    .eq('id', foto.id);
                continue;
            }

            // Foto nova - upload
            const extensao = foto.file.name.split('.').pop();
            const path = `${imovelId}/${Date.now()}_${i}.${extensao}`;

            const { error: uploadError } = await window.supabaseClient.storage
                .from('imoveis-fotos')
                .upload(path, foto.file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Erro no upload:', uploadError);
                continue;
            }

            // Pegar URL pública
            const { data: { publicUrl } } = window.supabaseClient.storage
                .from('imoveis-fotos')
                .getPublicUrl(path);

            // Inserir no banco
            const { data, error } = await window.supabaseClient
                .from('imovel_fotos')
                .insert([{
                    imovel_id: imovelId,
                    url: publicUrl,
                    storage_path: path,
                    ordem: foto.ordem,
                    is_cover: foto.isCover
                }])
                .select();

            if (!error) uploaded.push(data[0]);
        }

        return uploaded;
    },

    /**
     * Deletar foto do Storage e do banco
     */
    async deletar(fotoId, storagePath) {
        try {
            // Remover do Storage
            if (storagePath) {
                await window.supabaseClient.storage
                    .from('imoveis-fotos')
                    .remove([storagePath]);
            }
            // Remover do banco
            await window.supabaseClient
                .from('imovel_fotos')
                .delete()
                .eq('id', fotoId);
        } catch (error) {
            console.error('Erro ao deletar foto:', error);
        }
    },

    reset() {
        this.fotos = [];
        this.render();
    }
};

window.AdminFotos = AdminFotos;
