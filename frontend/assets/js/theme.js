
const THEME_KEY = 'edusystem-theme';

function applyTheme(theme) {
    const isDark = theme === 'dark';

    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
    document.documentElement.style.colorScheme = isDark
        ? 'dark'
        : 'light';

    const icon = document.getElementById('theme-toggle-icon');
    const button = document.getElementById('theme-toggle');

    if (icon) {
        icon.classList.toggle('fa-moon', !isDark);
        icon.classList.toggle('fa-sun', isDark);
    }

    if (button) {
        const label = isDark
            ? 'Chuyển sang giao diện sáng'
            : 'Chuyển sang giao diện tối';

        button.setAttribute('aria-label', label);
        button.setAttribute('title', label);
    }
}

let savedTheme = null;

try {
    savedTheme = localStorage.getItem(THEME_KEY);
} catch (error) {
    console.warn('Không thể đọc tùy chọn giao diện.');
}

const initialTheme =
    savedTheme === 'dark' || savedTheme === 'light'
        ? savedTheme
        : (
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light'
        );

applyTheme(initialTheme);

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('theme-toggle');

    if (button) {
        button.addEventListener('click', () => {
            const nextTheme =
                document.documentElement.classList.contains('dark')
                    ? 'light'
                    : 'dark';

            applyTheme(nextTheme);

            try {
                localStorage.setItem(THEME_KEY, nextTheme);
            } catch (error) {
                console.warn('Không thể lưu tùy chọn giao diện.');
            }
        });
    }

    const year = document.getElementById('current-year');

    if (year) {
        year.textContent = String(new Date().getFullYear());
    }
});
