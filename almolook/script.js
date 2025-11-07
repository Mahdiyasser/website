document.addEventListener('DOMContentLoaded', () => {
    console.log('قنبلة الملوك: الصفحة الرئيسية جاهزة للاستخدام!');

    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    function saveThemePreference(theme) {
        localStorage.setItem('almolook_theme', theme);
    }

    function loadThemePreference() {
        const savedTheme = localStorage.getItem('almolook_theme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-theme');
            themeToggleBtn.querySelector('i').className = 'fas fa-sun';
        } else {
            body.classList.remove('dark-theme');
            themeToggleBtn.querySelector('i').className = 'fas fa-moon';
        }
    }

    if (themeToggleBtn) {
        loadThemePreference();

        themeToggleBtn.addEventListener('click', () => {
            const isDark = body.classList.toggle('dark-theme');

            if (isDark) {
                themeToggleBtn.querySelector('i').className = 'fas fa-sun';
                saveThemePreference('dark');
            } else {
                themeToggleBtn.querySelector('i').className = 'fas fa-moon';
                saveThemePreference('light');
            }
        });
    }
});
