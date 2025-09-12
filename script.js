<<<<<<< HEAD
const galleryImages = document.querySelectorAll('.gallery-img');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.querySelector('.lightbox .close');
let floatAnim; // ще държи GSAP анимацията за плаващо движение

// Отваряне на лайтбокса с анимация (фон + изображение)
galleryImages.forEach(img => {
    img.addEventListener('click', () => {
        lightbox.classList.remove('hidden');

        // GSAP анимация за фон
        gsap.fromTo(lightbox, 
            { backgroundColor: "rgba(0,0,0,0)" }, 
            { backgroundColor: "rgba(0,0,0,0.8)", duration: 0.5 }
        );

        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;

        // GSAP анимация за изображението
        gsap.fromTo(lightboxImg, 
            { scale: 0.7, opacity: 0, y: 0 }, 
            { scale: 1, opacity: 1, duration: 0.5, ease: "power3.out", onComplete: startFloating }
        );
    });
});

// Функция за леко плаващо движение
function startFloating() {
    floatAnim = gsap.to(lightboxImg, {
        y: '+=10', // движе се нагоре и надолу
        repeat: -1, // безкрайно
        yoyo: true,
        duration: 2,
        ease: "sine.inOut"
    });
}

// Затваряне на лайтбокса с анимация (фон + изображение)
function closeLightbox() {
    if (floatAnim) floatAnim.kill(); // спираме плаващата анимация

    gsap.to(lightboxImg, {
        scale: 0.7,
        opacity: 0,
        duration: 0.4,
        ease: "power3.in"
    });

    gsap.to(lightbox, {
        backgroundColor: "rgba(0,0,0,0)",
        duration: 0.4,
        ease: "power3.in",
        onComplete: () => {
            lightbox.classList.add('hidden');
            lightboxImg.src = '';
            lightboxImg.alt = '';
        }
    });
}

closeBtn.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") closeLightbox();
});
=======
const galleryImages = document.querySelectorAll('.gallery-img');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.querySelector('.lightbox .close');
let floatAnim; // ще държи GSAP анимацията за плаващо движение

// Отваряне на лайтбокса с анимация (фон + изображение)
galleryImages.forEach(img => {
    img.addEventListener('click', () => {
        lightbox.classList.remove('hidden');

        // GSAP анимация за фон
        gsap.fromTo(lightbox, 
            { backgroundColor: "rgba(0,0,0,0)" }, 
            { backgroundColor: "rgba(0,0,0,0.8)", duration: 0.5 }
        );

        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;

        // GSAP анимация за изображението
        gsap.fromTo(lightboxImg, 
            { scale: 0.7, opacity: 0, y: 0 }, 
            { scale: 1, opacity: 1, duration: 0.5, ease: "power3.out", onComplete: startFloating }
        );
    });
});

// Функция за леко плаващо движение
function startFloating() {
    floatAnim = gsap.to(lightboxImg, {
        y: '+=10', // движе се нагоре и надолу
        repeat: -1, // безкрайно
        yoyo: true,
        duration: 2,
        ease: "sine.inOut"
    });
}

// Затваряне на лайтбокса с анимация (фон + изображение)
function closeLightbox() {
    if (floatAnim) floatAnim.kill(); // спираме плаващата анимация

    gsap.to(lightboxImg, {
        scale: 0.7,
        opacity: 0,
        duration: 0.4,
        ease: "power3.in"
    });

    gsap.to(lightbox, {
        backgroundColor: "rgba(0,0,0,0)",
        duration: 0.4,
        ease: "power3.in",
        onComplete: () => {
            lightbox.classList.add('hidden');
            lightboxImg.src = '';
            lightboxImg.alt = '';
        }
    });
}

closeBtn.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") closeLightbox();
});
>>>>>>> ab64c21 ( Please enter the commit message for your changes. Lines starting)
