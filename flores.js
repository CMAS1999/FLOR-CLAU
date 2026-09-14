document.addEventListener('DOMContentLoaded', function () {
    const startBtn = document.getElementById('startBtn');
    const openLetter = document.getElementById('openLetter');
    const closeLetter = document.getElementById('closeLetter');
    const letterModal = document.getElementById('letterModal');
    const gardenSound = document.getElementById('gardenSound');
    const music = document.getElementById('bgMusic');

    // Después de iniciar, la galaxia dura 5 segundos y aparece la carta.
    if (startBtn) {
        startBtn.addEventListener('click', function () {
            setTimeout(function () {
                document.body.classList.add('garden-visible');
            }, 5000);
        }, { once: true });
    }

    function showLetter(show) {
        if (!letterModal) return;
        letterModal.classList.toggle('open', show);
        letterModal.setAttribute('aria-hidden', String(!show));
        if (show && closeLetter) closeLetter.focus();
    }

    if (openLetter) openLetter.addEventListener('click', function () { showLetter(true); });
    if (closeLetter) closeLetter.addEventListener('click', function () { showLetter(false); });

    if (letterModal) {
        letterModal.addEventListener('click', function (event) {
            if (event.target === letterModal) showLetter(false);
        });
    }

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') showLetter(false);
    });

    if (gardenSound && music) {
        gardenSound.addEventListener('click', function () {
            music.muted = !music.muted;
            gardenSound.textContent = music.muted ? '♫ Activar música' : '♫ Silenciar música';
        });
    }
});
