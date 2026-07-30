/**
 * Gestão de Amenidades
 */

const AdminAmenidades = {

    // Listar todas as amenidades
    async listar() {
        try {
            const { data, error } = await window.supabaseClient
                .from('amenidades')
                .select('*')
                .order('categoria', { ascending: true })
                .order('ordem', { ascending: true });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Erro ao listar amenidades:', error);
            return { data: null, error };
        }
    },

    // Renderizar checkboxes no formulário de imóvel
    async renderizarCheckboxes(containerId) {
        const { data } = await this.listar();
        if (!data) return;

        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = data.map(a => `
            <label class="amenidade-item" data-id="${a.id}">
                <input type="checkbox" value="${a.id}">
                <i class="${a.icone || 'fas fa-check'}"></i>
                <span>${a.nome}</span>
            </label>
        `).join('');

        // Marcar visualmente ao clicar
        container.querySelectorAll('.amenidade-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT') {
                    const input = item.querySelector('input');
                    input.checked = !input.checked;
                }
                item.classList.toggle('selected', item.querySelector('input').checked);
            });
        });
    },

    // Marcar amenidades selecionadas (edição)
    marcarSelecionadas(amenidadesIds) {
        if (!amenidadesIds || !amenidadesIds.length) return;
        amenidadesIds.forEach(id => {
            const item = document.querySelector(`.amenidade-item[data-id="${id}"]`);
            if (item) {
                const input = item.querySelector('input');
                input.checked = true;
                item.classList.add('selected');
            }
        });
    },

    // Obter IDs selecionados
    getSelecionadas() {
        const checks = document.querySelectorAll('#amenidades-grid input:checked');
        return Array.from(checks).map(c => c.value);
    },

    // Renderizar tabela de amenidades
    async renderTabela() {
        const { data } = await this.listar();
        const tbody = document.querySelector('#table-amenidades tbody');
        if (!tbody) return;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state-mini">Nenhuma amenidade cadastrada</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(a => `
            <tr>
                <td><strong>${a.nome}</strong></td>
                <td><i class="${a.icone || 'fas fa-check'}"></i> <code>${a.icone || '-'}</code></td>
                <td>${a.categoria || '-'}</td>
                <td>
                    <span class="badge ${a.ativo ? 'badge-disponivel' : 'badge-rascunho'}">
                        ${a.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
            </tr>
        `).join('');
    }
};

window.AdminAmenidades = AdminAmenidades;
