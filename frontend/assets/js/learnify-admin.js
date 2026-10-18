/* Learnify Admin Dashboard UI adapter.
   Uses existing admin tab buttons and app.js event handlers; does not replace API logic. */
(() => {
  const TAB_META = [
    ['admin-tab-stats-btn', 'chart-column', 'Thống kê tổng quan'],
    ['admin-tab-exams-btn', 'file-text', 'Quản lý đề thi'],
    ['admin-tab-history-btn', 'clock-3', 'Lịch sử làm bài'],
    ['admin-tab-leaderboard-btn', 'trophy', 'Bảng xếp hạng']
  ];

  function enhanceAdminDashboard() {
    const appView = document.getElementById('app-view');
    if (!appView) return;

    const root = appView.querySelector(':scope > .space-y-6');
    const content = appView.querySelector('#admin-main-content');
    if (!root || !content || root.dataset.learnifyEnhanced === 'true') return;

    const heading = root.firstElementChild;
    if (!heading) return;
    const tabStrip = heading.querySelector('.scrollbar-none');
    if (!tabStrip) return;

    root.dataset.learnifyEnhanced = 'true';
    heading.classList.add('learnify-admin-heading');

    const layout = document.createElement('div');
    layout.className = 'learnify-admin-layout';

    const sidebar = document.createElement('aside');
    sidebar.className = 'learnify-admin-sidebar';
    sidebar.setAttribute('aria-label', 'Điều hướng quản trị');
    sidebar.innerHTML = `
      <div class="learnify-sidebar-brand">
        <span class="learnify-sidebar-logo"><i class="fa-solid fa-graduation-cap" aria-hidden="true"></i></span>
        <div><div class="learnify-sidebar-name">Learnify</div><div class="learnify-sidebar-caption">ADMIN WORKSPACE</div></div>
      </div>
      <div class="learnify-nav-label">Không gian quản trị</div>
      <nav class="learnify-admin-nav" aria-label="Các mục quản trị"></nav>
    `;

    const nav = sidebar.querySelector('.learnify-admin-nav');
    TAB_META.forEach(([id, icon, label]) => {
      const button = tabStrip.querySelector('#' + id);
      if (!button) return;
      button.classList.add('learnify-nav-button');
      button.innerHTML = '<i class="fa-solid fa-' + icon + '" aria-hidden="true"></i><span>' + label + '</span>';
      button.setAttribute('aria-label', label);
      nav.appendChild(button);
    });

    const main = document.createElement('div');
    main.className = 'learnify-admin-main';
    root.parentNode.insertBefore(layout, root);
    layout.append(sidebar, main);
    main.appendChild(root);

    function syncActiveTab() {
      TAB_META.forEach(([id]) => {
        const button = document.getElementById(id);
        if (!button) return;
        const active = button.classList.contains('bg-blue-600');
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-current', active ? 'page' : 'false');
      });
    }

    nav.addEventListener('click', () => requestAnimationFrame(syncActiveTab));
    const tabObserver = new MutationObserver(syncActiveTab);
    tabObserver.observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] });
    syncActiveTab();
  }

  function start() {
    const appView = document.getElementById('app-view');
    if (!appView) return;
    const observer = new MutationObserver(() => enhanceAdminDashboard());
    observer.observe(appView, { childList: true, subtree: true });
    enhanceAdminDashboard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
