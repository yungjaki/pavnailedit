function scrollAnimate() {
    const elements = document.querySelectorAll('.scroll-animate');

    elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        if (rect.top < windowHeight * 0.85) { // 85% от височината на екрана
            el.classList.add('active');
        }
    });
}

// Стартираме при скрол и при зареждане
window.addEventListener('scroll', scrollAnimate);
window.addEventListener('load', scrollAnimate);
function scrollAnimate() {
    const elements = document.querySelectorAll('.scroll-animate');

    elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        if (rect.top < windowHeight * 0.85) { // 85% от височината на екрана
            el.classList.add('active');
        }
    });
}

// Стартираме при скрол и при зареждане
window.addEventListener('scroll', scrollAnimate);
window.addEventListener('load', scrollAnimate);
