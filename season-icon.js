function addSeasonIcon() {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const button = document.querySelector(".btn-book");

    // Премахваме стара икона, ако има
    const oldIcon = button.querySelector(".season-icon");
    if (oldIcon) oldIcon.remove();

    let icon = "";

    if (month === 10) icon = "🎃";       // Halloween
    else if (month === 12) icon = "🎄";  // Christmas
    else if (month === 2) icon = "❤️";   // Valentine
    else if (month === 3) icon = "🌹";   // Women's day
    else if (month === 4 && now.getDate() === 10) icon = "🎂"; // РД Маникюристка
    // добави още празници ако искаш

    if (icon) {
        const span = document.createElement("span");
        span.classList.add("season-icon");
        span.textContent = icon;
        button.appendChild(span);
    }
}

// Извикваме при зареждане на страницата
window.addEventListener("DOMContentLoaded", addSeasonIcon);

function addSeasonIcon() {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const button = document.querySelector(".btn-book");

    // Премахваме стара икона, ако има
    const oldIcon = button.querySelector(".season-icon");
    if (oldIcon) oldIcon.remove();

    let icon = "";

    if (month === 10) icon = "🎃";       // Halloween
    else if (month === 12) icon = "🎄";  // Christmas
    else if (month === 2) icon = "❤️";   // Valentine
    else if (month === 3) icon = "🌹";   // Women's day
    else if (month === 4 && now.getDate() === 10) icon = "🎂"; // РД Маникюристка
    // добави още празници ако искаш

    if (icon) {
        const span = document.createElement("span");
        span.classList.add("season-icon");
        span.textContent = icon;
        button.appendChild(span);
    }
}

// Извикваме при зареждане на страницата
window.addEventListener("DOMContentLoaded", addSeasonIcon);
