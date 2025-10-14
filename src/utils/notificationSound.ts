// Função para tocar som de notificação usando Web Audio API
export function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Criar oscilador para o som
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Conectar os nós
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configurar o som (frequência e tipo de onda)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Nota mais alta
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1); // Nota mais baixa

    // Configurar volume (fade in e fade out)
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);

    // Tocar o som
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    console.warn('Não foi possível tocar o som de notificação:', error);
  }
}

// Função alternativa usando arquivo de áudio (caso você adicione um arquivo .mp3 ou .wav)
export function playNotificationSoundFromFile() {
  try {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => {
      console.warn('Não foi possível tocar o som:', err);
    });
  } catch (error) {
    console.warn('Erro ao tentar tocar som de notificação:', error);
  }
}
