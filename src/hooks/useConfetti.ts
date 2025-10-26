import confetti from 'canvas-confetti';

export const useConfetti = () => {
  const fireConfetti = (intensity: 'normal' | 'intense' = 'normal') => {
    const count = intensity === 'intense' ? 200 : 150;
    const spread = intensity === 'intense' ? 90 : 70;

    confetti({
      particleCount: count,
      spread: spread,
      origin: { y: 0.6 },
      colors: ['#9b87f5', '#3b82f6', '#ffffff'],
      shapes: ['circle', 'square'],
      scalar: 1.2,
      gravity: 1,
      drift: 0,
      ticks: 300,
    });

    // Segundo disparo com delay para efeito mais rico
    setTimeout(() => {
      confetti({
        particleCount: count / 2,
        spread: spread - 20,
        origin: { y: 0.5 },
        colors: ['#9b87f5', '#3b82f6', '#ffffff'],
        shapes: ['circle', 'square'],
        scalar: 1.0,
        gravity: 1.2,
        drift: 0,
        ticks: 250,
      });
    }, 250);
  };

  return { fireConfetti };
};
