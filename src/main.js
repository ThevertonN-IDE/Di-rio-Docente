// Verifica se há uma versão mais recente na Vercel
async function checarNovaVersao() {
  try {
    // Adiciona timestamp na requisição para nunca pegar o version.json do cache
    const resposta = await fetch(`/version.json?t=${Date.now()}`);
    if (!resposta.ok) return;

    const info = await resposta.json();
    const versaoSalva = localStorage.getItem('APP_VERSAO');

    if (!versaoSalva) {
      localStorage.setItem('APP_VERSAO', info.versao);
      return;
    }

    if (versaoSalva !== info.versao) {
      localStorage.setItem('APP_VERSAO', info.versao);
      
      // Limpa os caches do navegador e recarrega a página do zero
      if ('caches' in window) {
        const nomes = await caches.keys();
        await Promise.all(nomes.map(n => caches.delete(n)));
      }
      
      window.location.reload(true);
    }
  } catch (e) {
    console.debug('Falha ao checar versão:', e);
  }
}

// Checa ao abrir o aplicativo
checarNovaVersao();

// E verifica a cada 10 minutos se a aba continuar aberta
setInterval(checarNovaVersao, 10 * 60 * 1000);