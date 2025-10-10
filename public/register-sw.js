// Script para registrar o Service Worker
// Este arquivo é carregado no navegador para ativar o PWA

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado com sucesso:', registration.scope);

        // Verifica por atualizações a cada 1 hora
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      })
      .catch((error) => {
        console.error('❌ Erro ao registrar Service Worker:', error);
      });

    // Detecta quando há uma nova versão disponível
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Nova versão do app disponível! Recarregando...');
      window.location.reload();
    });
  });

  // Mostra quando está offline/online
  window.addEventListener('online', () => {
    console.log('🌐 Você está ONLINE');
  });

  window.addEventListener('offline', () => {
    console.log('📡 Você está OFFLINE - Modo cache ativado');
  });
}

// Detecta se o app foi instalado
window.addEventListener('beforeinstallprompt', (event) => {
  console.log('💡 App pode ser instalado!');
  // Previne o prompt automático
  event.preventDefault();
  // Salva o evento para mostrar depois (você pode criar um botão "Instalar App")
  window.deferredPrompt = event;
});

// Detecta quando o app foi instalado
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA instalado com sucesso!');
  window.deferredPrompt = null;
});
