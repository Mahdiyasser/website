document.addEventListener('DOMContentLoaded', () => {
    console.log('mahdiyasser33@gmail.com تم التنغيذ بواسطة مهدي ياسر للتواصل');

    // --- NEW: Theme Toggle Logic ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    function saveThemePreference(theme) {
        localStorage.setItem('rabe3_theme', theme);
    }

    function loadThemePreference() {
        const savedTheme = localStorage.getItem('rabe3_theme');
        // Check if user has a preference, otherwise default to light
        if (savedTheme === 'dark') {
            body.classList.add('dark-theme');
            // Change icon to sun when dark theme is active
            themeToggleBtn.querySelector('i').className = 'fas fa-sun';
        } else {
            body.classList.remove('dark-theme');
            // Change icon to moon when light theme is active
            themeToggleBtn.querySelector('i').className = 'fas fa-moon';
        }
    }

    if (themeToggleBtn) {
        loadThemePreference(); // Load theme on startup

        themeToggleBtn.addEventListener('click', () => {
            const isDark = body.classList.toggle('dark-theme');

            if (isDark) {
                // Switched to dark
                themeToggleBtn.querySelector('i').className = 'fas fa-sun';
                saveThemePreference('dark');
            } else {
                // Switched to light
                themeToggleBtn.querySelector('i').className = 'fas fa-moon';
                saveThemePreference('light');
            }
        });
    }
    // --- END Theme Toggle Logic ---
});

