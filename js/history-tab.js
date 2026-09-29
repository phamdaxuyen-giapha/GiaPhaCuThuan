// ============================================================
// HISTORY TAB v2.0 — Đồng bộ tab + ID người với URL hash
// Hỗ trợ URL: #phado, #phado/P6-1, #danhtinh/P6-1...
// ============================================================

(function() {
  'use strict';

  const HASH_HOP_LE = ['trangchu', 'danhtinh', 'phahe', 'phado', 'ngoipha'];
  const TAB_MAC_DINH = 'trangchu';
  const TAB_CO_NGUOI = ['danhtinh', 'phahe', 'phado'];

  let dangDoiTab = false;
  let observerTab = null;
  let observerPanel = null;
  let lanCuoiHash = '';

  // --- Parse hash → { tabId, nguoiId } ---
  function parseHash() {
    const raw = (location.hash || '').replace('#', '').trim();
    if (!raw) return { tabId: TAB_MAC_DINH, nguoiId: null };

    const parts = raw.split('/');
    const tabId = HASH_HOP_LE.includes(parts[0]) ? parts[0] : TAB_MAC_DINH;
    const nguoiId = parts[1] ? decodeURIComponent(parts[1]) : null;
    return { tabId: tabId, nguoiId: nguoiId };
  }

  // --- Tạo hash string ---
  function taoHash(tabId, nguoiId) {
    if (nguoiId && TAB_CO_NGUOI.includes(tabId)) {
      return '#' + tabId + '/' + encodeURIComponent(nguoiId);
    }
    return '#' + tabId;
  }

  // --- Click nút menu tab ---
  function chuyenTab(tabId) {
    if (!HASH_HOP_LE.includes(tabId)) return;
    const nut = document.querySelector('.menu-btn[data-tab="' + tabId + '"]');
    if (!nut) return;
    if (nut.classList.contains('active')) return;

    dangDoiTab = true;
    nut.click();
    setTimeout(function() { dangDoiTab = false; }, 150);
  }

  // --- Focus vào người theo ID ---
  function focusNguoi(tabId, nguoiId) {
    if (!nguoiId || !window.giaphaData) return;
    const nguoi = window.giaphaData.nguoi.find(function(n) { return n.id === nguoiId; });
    if (!nguoi) {
      console.warn('History: Không tìm thấy người có ID:', nguoiId);
      return;
    }

    const batDau = Date.now();
    const wait = setInterval(function() {
      const hetGio = Date.now() - batDau > 8000;
      let xong = false;

      if (tabId === 'phado') {
        if (document.querySelectorAll('.phado-node').length > 0 &&
            typeof chonNodePhado === 'function') {
          chonNodePhado(nguoiId);
          xong = true;
        }
      } else if (tabId === 'danhtinh' || tabId === 'phahe') {
        if (typeof hienThiChiTiet === 'function') {
          hienThiChiTiet(nguoi);
          xong = true;
        }
      }

      if (xong || hetGio) clearInterval(wait);
    }, 200);
  }

  // --- Xử lý hash (load / popstate / hashchange) ---
  function xuLyHash() {
    const info = parseHash();
    lanCuoiHash = taoHash(info.tabId, info.nguoiId);

    chuyenTab(info.tabId);

    if (info.nguoiId) {
      setTimeout(function() {
        focusNguoi(info.tabId, info.nguoiId);
      }, 600);
    }
  }

  // --- Lấy tên người từ panel ---
  function layTenTuPanel(panel) {
    const h = panel.querySelector('h2, h3');
    return h ? h.textContent.trim() : '';
  }

  function timIdTheoTen(ten) {
    if (!window.giaphaData || !ten) return null;
    const tenSach = ten.replace(/^\(|\)$/g, '').trim();
    const nguoi = window.giaphaData.nguoi.find(function(n) { return n.ho_ten === tenSach; });
    return nguoi ? nguoi.id : null;
  }

  // --- Cập nhật hash khi panel mở/đóng ---
  function capNhatHashTuPanel() {
    const info = parseHash();
    const tabId = info.tabId;

    const panelChiTiet = document.getElementById('panel-chi-tiet');
    const panelPhado = document.getElementById('phado-panel');

    let nguoiId = null;

    if (panelChiTiet && !panelChiTiet.classList.contains('an')) {
      nguoiId = timIdTheoTen(layTenTuPanel(panelChiTiet));
    } else if (panelPhado && !panelPhado.classList.contains('an')) {
      nguoiId = timIdTheoTen(layTenTuPanel(panelPhado));
    }

    const hashMoi = taoHash(tabId, nguoiId);
    if (hashMoi !== lanCuoiHash) {
      lanCuoiHash = hashMoi;
      if (location.hash !== hashMoi) {
        history.replaceState({ tab: tabId, nguoi: nguoiId }, '', hashMoi);
      }
    }
  }

  // --- Theo dõi 2 panel ---
  function theoDoiPanel() {
    const panelChiTiet = document.getElementById('panel-chi-tiet');
    const panelPhado = document.getElementById('phado-panel');
    if (!panelChiTiet && !panelPhado) return;

    observerPanel = new MutationObserver(function() {
      if (dangDoiTab) return;
      capNhatHashTuPanel();
    });

    [panelChiTiet, panelPhado].forEach(function(p) {
      if (p) {
        observerPanel.observe(p, { attributes: true, attributeFilter: ['class'] });
      }
    });
  }

  // --- Theo dõi tab-content ---
  function theoDoiTab() {
    const dsTab = document.querySelectorAll('.tab-content');
    if (dsTab.length === 0) return;

    observerTab = new MutationObserver(function() {
      if (dangDoiTab) return;

      const activeTab = document.querySelector('.tab-content.active');
      if (!activeTab) return;

      const tabId = activeTab.id.replace('tab-', '');
      if (!HASH_HOP_LE.includes(tabId)) return;

      const hashMoi = '#' + tabId;
      if (location.hash !== hashMoi) {
        lanCuoiHash = hashMoi;
        history.pushState({ tab: tabId }, '', hashMoi);
      }
    });

    dsTab.forEach(function(el) {
      observerTab.observe(el, { attributes: true, attributeFilter: ['class'] });
    });
  }

  // --- Khởi tạo ---
  function khoiTao() {
    theoDoiTab();
    theoDoiPanel();

    const info = parseHash();
    if (info.tabId !== TAB_MAC_DINH || info.nguoiId) {
      setTimeout(function() { xuLyHash(); }, 400);
    } else if (location.hash === '' || location.hash === '#trangchu') {
      history.replaceState({ tab: 'trangchu' }, '', '#trangchu');
    }

    window.addEventListener('popstate', function() {
      xuLyHash();
    });

    window.addEventListener('hashchange', function() {
      if (dangDoiTab) return;
      xuLyHash();
    });

    console.log('History Tab v2.0: Đã kích hoạt (hỗ trợ #tab/ID)');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', khoiTao);
  } else {
    khoiTao();
  }
})();
