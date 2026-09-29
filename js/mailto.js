// ============================================================
// PANEL TOOLS — Nút "Gửi góp ý" + "Copy link"
// Tự động chèn vào panel chi tiết và panel phả đồ
// ============================================================

(function() {
  'use strict';

  const EMAIL_NHAN = 'hsnampham@gmail.com';

  // --- Tìm người theo tên ---
  function timNguoiTheoTen(ten) {
    if (!window.giaphaData || !ten) return null;
    const tenSach = ten.replace(/^\(|\)$/g, '').trim();
    return window.giaphaData.nguoi.find(function(n) { return n.ho_ten === tenSach; });
  }

  function layTenTuPanel(panel) {
    const h = panel.querySelector('h2, h3');
    return h ? h.textContent.trim() : '';
  }

  // --- Tạo nội dung email ---
  function taoNoiDungMail(nguoi) {
    const subject = 'Góp ý gia phả — ' + nguoi.ho_ten +
                    ' (Đời ' + nguoi.doi + ', ID: ' + nguoi.id + ')';

    const body = [
      'Kính gửi Ban quản trị gia phả họ Phạm Đà Xuyên,',
      '',
      'Tôi có góp ý / đính chính cho thông tin của cụ:',
      '  • Họ tên: ' + nguoi.ho_ten,
      '  • Đời: ' + nguoi.doi,
      '  • Chi: ' + (nguoi.chi || '—'),
      '  • ID: ' + nguoi.id,
      '',
      '─── NỘI DUNG GÓP Ý ───',
      '[Xin gõ nội dung góp ý vào đây]',
      '',
      '',
      '─── THÔNG TIN NGƯỜI GỬI ───',
      'Họ tên: ',
      'Đời: ',
      'Chi: ',
      'SĐT hoặc Email liên hệ: ',
      '',
      'Xin trân trọng cảm ơn!'
    ].join('\n');

    return {
      subject: encodeURIComponent(subject),
      body: encodeURIComponent(body)
    };
  }

  function guiGopY(nguoi) {
    if (!nguoi) {
      alert('Không xác định được người cần góp ý.');
      return;
    }
    const x = taoNoiDungMail(nguoi);
    const mailtoLink = 'mailto:' + EMAIL_NHAN +
                       '?subject=' + x.subject +
                       '&body=' + x.body;
    window.location.href = mailtoLink;
    console.log('Mailto: Đã mở email cho', nguoi.ho_ten);
  }

  // --- Copy link với hash ---
  function copyLink(nguoi) {
    let url = location.origin + location.pathname;

    if (nguoi) {
      // Tìm tab hiện tại
      const activeTab = document.querySelector('.tab-content.active');
      const tabId = activeTab ? activeTab.id.replace('tab-', '') : 'trangchu';
      url += '#' + tabId + '/' + nguoi.id;
    } else {
      url += location.hash || '#trangchu';
    }

    // Thử dùng Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function() {
        hienToast('✅ Đã copy link: ' + url);
      }).catch(function() {
        fallbackCopy(url);
      });
    } else {
      fallbackCopy(url);
    }

    console.log('Copy link:', url);
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      hienToast('✅ Đã copy link!');
    } catch (e) {
      hienToast('❌ Không copy được. Link: ' + text);
    }
    document.body.removeChild(ta);
  }

  // --- Toast notification ---
  function hienToast(msg) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = [
      'position:fixed',
      'top:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:#7A6320',
      'color:#fff',
      'padding:12px 24px',
      'border-radius:8px',
      'font-size:12pt',
      'font-family:Noto Serif, serif',
      'z-index:9999',
      'box-shadow:0 4px 16px rgba(0,0,0,0.25)',
      'opacity:0',
      'transition:opacity 0.3s ease',
      'max-width:80%',
      'word-break:break-all',
      'text-align:center'
    ].join(';');

    document.body.appendChild(toast);

    setTimeout(function() { toast.style.opacity = '1'; }, 10);
    setTimeout(function() {
      toast.style.opacity = '0';
      setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 2500);
  }

  // --- Tạo nút ---
  function taoNut(text, title, onClick) {
    const nut = document.createElement('button');
    nut.className = 'nut-panel-tool';
    nut.title = title;
    nut.textContent = text;
    nut.style.cssText = [
      'border:1px solid #C9A961',
      'background:#FAF6EC',
      'color:#7A6320',
      'border-radius:4px',
      'cursor:pointer',
      'padding:6px 12px',
      'font-size:11pt',
      'font-family:inherit',
      'transition:all 0.15s',
      'margin-right:6px'
    ].join(';');

    nut.addEventListener('mouseenter', function() {
      nut.style.background = '#C9A961';
      nut.style.color = '#fff';
    });
    nut.addEventListener('mouseleave', function() {
      nut.style.background = '#FAF6EC';
      nut.style.color = '#7A6320';
    });

    nut.addEventListener('click', function(e) {
      e.stopPropagation();
      onClick();
    });

    return nut;
  }

  // --- Chèn 2 nút vào panel ---
  function chenNutVaoPanel(panel) {
    if (!panel) return;
    if (panel.classList.contains('an')) return;
    if (panel.querySelector('.nut-panel-tool')) return; // Đã chèn

    const ten = layTenTuPanel(panel);
    const nguoi = timNguoiTheoTen(ten);
    if (!nguoi) return;

    const divNut = panel.querySelector('div[style*="float:right"]');
    if (!divNut) return;

    const nutMail = taoNut('Gửi góp ý', 'Gửi góp ý cho cụ này qua email',
      function() { guiGopY(nguoi); });

    const nutCopy = taoNut('Copy link', 'Copy link chia sẻ trang này',
      function() { copyLink(nguoi); });

    divNut.insertBefore(nutCopy, divNut.firstChild);
    divNut.insertBefore(nutMail, divNut.firstChild);

    console.log('Panel Tools: Đã chèn 2 nút cho', nguoi.ho_ten);
  }

  // --- Theo dõi panel ---
  function theoDoiPanel(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    const obs = new MutationObserver(function() {
      chenNutVaoPanel(panel);
    });

    obs.observe(panel, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    chenNutVaoPanel(panel);
  }

  function khoiTao() {
    const wait = setInterval(function() {
      if (window.giaphaData) {
        clearInterval(wait);
        theoDoiPanel('panel-chi-tiet');
        theoDoiPanel('phado-panel');
        console.log('Panel Tools: Đã kích hoạt (Gửi góp ý + Copy link)');
      }
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', khoiTao);
  } else {
    khoiTao();
  }
})();
