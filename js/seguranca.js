/**
 * ====================================================================
 * PROTEÇÃO CONTRA CLICKJACKING (substituto do X-Frame-Options)
 * ====================================================================
 *
 * O GitHub Pages não permite configurar cabeçalhos HTTP, então não dá
 * para enviar X-Frame-Options nem CSP frame-ancestors. Este script faz
 * o "frame busting" no lado do navegador: se a página for carregada
 * dentro de um iframe de outro site, o conteúdo é escondido e tentamos
 * levar o visitante para o site real.
 *
 * Precisa ser carregado no <head>, antes de qualquer renderização.
 * ====================================================================
 */
(function () {
    'use strict';

    // Página aberta normalmente (não está embutida): nada a fazer.
    if (window.self === window.top) return;

    // Esconde o conteúdo imediatamente para o site malicioso não conseguir
    // sobrepor botões falsos em cima do nosso.
    document.documentElement.style.visibility = 'hidden';

    try {
        // Tenta escapar do iframe levando a janela de cima para o nosso site.
        window.top.location.replace(window.self.location.href);
    } catch (err) {
        // Navegador bloqueou a navegação (iframe com sandbox, por exemplo).
        // Nesse caso o conteúdo simplesmente continua escondido, e mostramos
        // um aviso com link para o site verdadeiro.
        window.addEventListener('DOMContentLoaded', function () {
            document.body.innerHTML =
                '<p style="font-family:sans-serif;padding:24px;text-align:center">' +
                'Este conteúdo não pode ser exibido aqui. ' +
                '<a href="' + window.self.location.href + '" target="_blank" rel="noopener">' +
                'Abrir o site oficial</a>.</p>';
            document.documentElement.style.visibility = 'visible';
        });
    }
})();
