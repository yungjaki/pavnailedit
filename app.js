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

// --- Wall of Love ---
const wallForm = document.getElementById("wall-form");
const wallMessagesDiv = document.getElementById("wall-messages");

async function loadWallMessages() {
    if (!wallMessagesDiv) return;

    try {
        const res = await fetch("/api/wall");
        const data = await res.json();
        wallMessagesDiv.innerHTML = "";

        data.messages.forEach(msg => {
            const div = document.createElement("div");
            div.className = "wall-message";
            div.innerHTML = `<strong>${msg.name}:</strong> ${msg.message}`;
            wallMessagesDiv.appendChild(div);
        });
    } catch (err) {
        console.error("Грешка при зареждане на Wall of Love:", err);
    }
}

if (wallForm) {
    wallForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("wall-name").value.trim();
        const message = document.getElementById("wall-message").value.trim();

        if (!name || !message) return;

        try {
            await fetch("/api/wall", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, message }),
            });

            wallForm.reset();
            loadWallMessages();
        } catch (err) {
            console.error("Грешка при изпращане на съобщение:", err);
        }
    });
}

// Зареждане на съобщенията при стартиране
loadWallMessages();
