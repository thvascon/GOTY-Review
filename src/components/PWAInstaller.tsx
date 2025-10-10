"use client";

import { useEffect } from 'react';

export function PWAInstaller() {
  useEffect(() => {
    // Registra o Service Worker
    if ('serviceWorker' in navigator) {
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
    }

    // Mostra quando está offline/online
    const handleOnline = () => console.log('🌐 Você está ONLINE');
    const handleOffline = () => console.log('📡 Você está OFFLINE - Modo cache ativado');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Detecta se o app pode ser instalado
    const handleBeforeInstallPrompt = (event: Event) => {
      console.log('💡 App pode ser instalado!');
      event.preventDefault();
      // @ts-ignore
      window.deferredPrompt = event;
    };

    // Detecta quando o app foi instalado
    const handleAppInstalled = () => {
      console.log('✅ PWA instalado com sucesso!');
      // @ts-ignore
      window.deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Este componente não renderiza nada visível
  return null;
}
