// 현재 URL에 따라 활성화된 메뉴 강조
document.addEventListener('DOMContentLoaded', function () {
    const currentPath = window.location.pathname;
    const menuItems = document.querySelectorAll('nav ul li a');

    menuItems.forEach(item => {
        if (item.getAttribute('href') === currentPath) {
            item.classList.add('active');
        }
    });
});

