<<<<<<< HEAD
// 🎨 Символи за празници / сезони
const THEMES = {
    newYear: ["🎆", "🎇", "🥂", "🎉"],
    halloween: ["🎃", "👻", "🕸️"],
    christmas: ["🎄", "🎅", "❄️", "🎁"],
    valentines: ["❤️", "💘", "💝"],
    easter: ["🥚", "🐰", "🌸"],
    womensDay: ["🌹", "💐", "👩‍🦰"],
    birthday: ["🎂", "🎉", "🥂"],
    nameDay: ["🌸", "🌹", "✨", "🎉"],
    autumn: ["🍂", "🍁"],
    winter: ["❄️"],
    spring: ["🌸", "🌷"],
    summer: ["☀️", "🌴", "🍉"]
};


// 📅 Определяне на текущия празник/сезон
function getTheme() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    // 👉 Специални дати
    if ((month === 12 && day === 31) || (month === 1 && day === 1)) return THEMES.newYear; // Нова година
    if (month === 2 && day === 14) return THEMES.valentines;       // Свети Валентин
    if (month === 3 && day === 8) return THEMES.womensDay;         // 8 март
    if (month === 4 && day === 10) return THEMES.birthday;         // рожден ден
    if (month === 6 && day === 29) return THEMES.nameDay;          // имен ден Павлина

    // 🎃 Halloween (25–31 октомври)
    if (month === 10 && day >= 25 && day <= 31) return THEMES.halloween;

    // 🎄 Christmas (15–31 декември)
    if (month === 12 && day >= 15 && day <= 31) return THEMES.christmas;

    // 🐣 Easter (примерно 11–20 април, без 10.04 защото е РД)
    if (month === 4 && day >= 11 && day <= 20) return THEMES.easter;

    // 🌞 Сезони (ако не е празник)
    if ([9, 10, 11].includes(month)) return THEMES.autumn;
    if ([12, 1, 2].includes(month)) return THEMES.winter;
    if ([3, 4, 5].includes(month)) return THEMES.spring;
    if ([6, 7, 8].includes(month)) return THEMES.summer;

    return THEMES.autumn; // fallback
}

const ACTIVE_THEME = getTheme();
const MAX_ELEMENTS = 7;   // максимум наведнъж
const INTERVAL = 1500;    // ново на 1.5 секунди

function createFallingElement() {
    if (document.querySelectorAll(".fall-element").length >= MAX_ELEMENTS) return;

    const element = document.createElement("div");
    element.classList.add("fall-element");

    // 🎲 Случаен символ от активната тема
    element.textContent = ACTIVE_THEME[Math.floor(Math.random() * ACTIVE_THEME.length)];

    // 🎨 Случайни настройки
    element.style.left = Math.random() * 100 + "vw";
    element.style.fontSize = 12 + Math.random() * 18 + "px"; // 12–30px
    element.style.animationDuration = 4 + Math.random() * 6 + "s"; // 4–10s

    document.body.appendChild(element);

    setTimeout(() => {
        element.remove();
    }, 12000);
}

setInterval(createFallingElement, INTERVAL);
=======
// 🎨 Символи за празници / сезони
const THEMES = {
    newYear: ["🎆", "🎇", "🥂", "🎉"],
    halloween: ["🎃", "👻", "🕸️"],
    christmas: ["🎄", "🎅", "❄️", "🎁"],
    valentines: ["❤️", "💘", "💝"],
    easter: ["🥚", "🐰", "🌸"],
    womensDay: ["🌹", "💐", "👩‍🦰"],
    birthday: ["🎂", "🎉", "🥂"],
    nameDay: ["🌸", "🌹", "✨", "🎉"],
    autumn: ["🍂", "🍁"],
    winter: ["❄️"],
    spring: ["🌸", "🌷"],
    summer: ["☀️", "🌴", "🍉"]
};


// 📅 Определяне на текущия празник/сезон
function getTheme() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    // 👉 Специални дати
    if ((month === 12 && day === 31) || (month === 1 && day === 1)) return THEMES.newYear; // Нова година
    if (month === 2 && day === 14) return THEMES.valentines;       // Свети Валентин
    if (month === 3 && day === 8) return THEMES.womensDay;         // 8 март
    if (month === 4 && day === 10) return THEMES.birthday;         // рожден ден
    if (month === 6 && day === 29) return THEMES.nameDay;          // имен ден Павлина

    // 🎃 Halloween (25–31 октомври)
    if (month === 10 && day >= 25 && day <= 31) return THEMES.halloween;

    // 🎄 Christmas (15–31 декември)
    if (month === 12 && day >= 15 && day <= 31) return THEMES.christmas;

    // 🐣 Easter (примерно 11–20 април, без 10.04 защото е РД)
    if (month === 4 && day >= 11 && day <= 20) return THEMES.easter;

    // 🌞 Сезони (ако не е празник)
    if ([9, 10, 11].includes(month)) return THEMES.autumn;
    if ([12, 1, 2].includes(month)) return THEMES.winter;
    if ([3, 4, 5].includes(month)) return THEMES.spring;
    if ([6, 7, 8].includes(month)) return THEMES.summer;

    return THEMES.autumn; // fallback
}

const ACTIVE_THEME = getTheme();
const MAX_ELEMENTS = 7;   // максимум наведнъж
const INTERVAL = 1500;    // ново на 1.5 секунди

function createFallingElement() {
    if (document.querySelectorAll(".fall-element").length >= MAX_ELEMENTS) return;

    const element = document.createElement("div");
    element.classList.add("fall-element");

    // 🎲 Случаен символ от активната тема
    element.textContent = ACTIVE_THEME[Math.floor(Math.random() * ACTIVE_THEME.length)];

    // 🎨 Случайни настройки
    element.style.left = Math.random() * 100 + "vw";
    element.style.fontSize = 12 + Math.random() * 18 + "px"; // 12–30px
    element.style.animationDuration = 4 + Math.random() * 6 + "s"; // 4–10s

    document.body.appendChild(element);

    setTimeout(() => {
        element.remove();
    }, 12000);
}

setInterval(createFallingElement, INTERVAL);
>>>>>>> ab64c21 ( Please enter the commit message for your changes. Lines starting)
