// src/utils/versionCheck.js

export async function checarNovaVersao() {
  // Desregistra Service Workers antigos que retêm arquivos em cache offline
  if ('serviceWorker' in navigator) {
    try {
      const registros = await navigator.serviceWorker.getRegistrations();
      for (const reg of registros) {
        await reg.unregister();
      }
    } catch (e) {
      console.debug('Falha ao desregistrar Service Worker:', e);
    }
  }

  // Compara a versão atual com a do servidor
  try {
    const resposta = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
    if (!resposta.ok) return;

    const info = await resposta.json();
    const versaoSalva = localStorage.getItem('APP_VERSAO');

    if (!versaoSalva) {
      localStorage.setItem('APP_VERSAO', info.versao);
      return;
    }

    if (versaoSalva !== info.versao) {
      localStorage.setItem('APP_VERSAO', info.versao);

      if ('caches' in window) {
        const nomes = await caches.keys();
        await Promise.all(nomes.map((nome) => caches.delete(nome)));
      }

      window.location.reload();
    }
  } catch (err) {
    console.debug('Verificação de versão ignorada:', err);
  }
}