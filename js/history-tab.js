// ============================================================
// HISTORY TAB — Đồng bộ tab với URL hash
// Cho phép nút back/forward của trình duyệt chuyển tab
// Không cần sửa app.js
// ============================================================

(function() {
  'use strict';

  const HASH_HOP_LE = ['trangchu', 'danhtinh', 'phahe', 'phado', 'ngoipha'];
  const TAB_MAC_DINH = 'trangchu';

  let dangDoiTab = false;
  let observer = null;

  // Đọc hash hiện tại → trả về tabId hợp lệ
  function layTabTuHash() {
    const hash = (location.hash || '').replace('#', '').trim();
    return HASH_HOP_LE.includes(hash) ? hash : TAB_MAC_DINH;
  }

  // Chuyển tab bằng cách click nút menu (để app.js xử lý)
  function chuyenTab(tabId, capNhatHash) {
    if (!HASH_HOP_LE.includes(tabId)) return;

    const nut = document.querySelector('.menu-btn[data-tab="' + tabId + '"]');
    if (!nut) return;

    // Nếu tab này đã active rồi → chỉ đồng bộ hash nếu cần
    if (nut.classList.contains('active')) {
      if (capNhatHash && location.hash !== '#' + tabId) {
        history.replaceState({ tab: tabId }, '', '#' + tabId);
      }
      return;
    }

    dangDoiTab = true;
    nut.click();

    if (capNhatHash) {
      const hashMoi = '#' + tabId;
      if (location.hash !== hashMoi) {
        history.pushState({ tab: tabId }, '', hashMoi);
      }
    }

    setTimeout(function() { dangDoiTab = false; }, 150);
  }

  // Theo dõi thay đổi class của các tab-content
  function batDauTheoDoi() {
    const dsTab = document.querySelectorAll('.tab-content');
    if (dsTab.length === 0) return;

    observer = new MutationObserver(function() {
      if (dangDoiTab) return;

      const activeTab = document.querySelector('.tab-content.active');
      if (!activeTab) return;

      const tabId = activeTab.id.replace('tab-', '');
      if (!HASH_HOP_LE.includes(tabId)) return;

      const hashMoi = '#' + tabId;
      if (location.hash !== hashMoi) {
        history.pushState({ tab: tabId }, '', hashMoi);
      }
    });

    dsTab.forEach(function(el) {
      observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    });
  }

  // Khởi tạo
  function khoiTao() {
    // 1. Mở đúng tab theo hash khi vào trang
    const tabId = layTabTuHash();
    if (tabId !== TAB_MAC_DINH) {
      setTimeout(function() { chuyenTab(tabId, false); }, 200);
    } else if (location.hash === '' || location.hash === '#trangchu') {
      history.replaceState({ tab: 'trangchu' }, '', '#trangchu');
    }

    // 2. Bắt đầu theo dõi
    batDauTheoDoi();

    // 3. Nghe sự kiện back/forward của trình duyệt
    window.addEventListener('popstate', function() {
      const tabIdMoi = layTabTuHash();
      chuyenTab(tabIdMoi, false);
    });

    // 4. Nghe hashchange (khi user gõ URL trực tiếp)
    window.addEventListener('hashchange', function() {
      if (dangDoiTab) return;
      const tabIdMoi = layTabTuHash();
      chuyenTab(tabIdMoi, false);
    });

    console.log('History Tab: Đã kích hoạt đồng bộ tab ↔ URL');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', khoiTao);
  } else {
    khoiTao();
  }
})();
