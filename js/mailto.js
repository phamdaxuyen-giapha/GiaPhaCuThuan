// ============================================================
// MAILTO — Nút "Gửi góp ý" qua email
// Tự động chèn vào panel chi tiết và panel phả đồ
// Không cần sửa app.js hay phado.js
// ============================================================

(function() {
  'use strict';

  // ⚠️ ĐỔI EMAIL NÀY THÀNH EMAIL CỦA BẠN
  const EMAIL_NHAN = 'hsnampham@gmail.com';

  // Tìm người theo tên (dùng để lấy ID từ tên hiển thị)
  function timNguoiTheoTen(ten) {
    if (!window.giaphaData || !ten) return null;
    // Bỏ ký tự đặc biệt ở đầu (như "(Không rõ tên)")
    const tenSach = ten.replace(/^\(|\)$/g, '').trim();
    return window.giaphaData.nguoi.find(n => n.ho_ten === tenSach);
  }

  // Lấy tên người từ panel (h2 hoặc h3 đầu tiên)
  function layTenTuPanel(panel) {
    const h = panel.querySelector('h2, h3');
    return h ? h.textContent.trim() : '';
  }

  // Tạo nội dung email
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

  // Mở Gmail với nội dung điền sẵn
  function guiGopY(nguoi) {
    if (!nguoi) {
      alert('Không xác định được người cần góp ý.');
      return;
    }
    const { subject, body } = taoNoiDungMail(nguoi);
    const mailtoLink = 'mailto:' + EMAIL_NHAN +
                       '?subject=' + subject +
                       '&body=' + body;
    window.location.href = mailtoLink;
    console.log('Mailto: Đã mở email cho', nguoi.ho_ten);
  }

  // Chèn nút Mailto vào panel
  function chenNutMailto(panel) {
    if (!panel) return;

    // Không chèn 2 lần
    if (panel.querySelector('.nut-mailto')) return;

    // Panel phải đang mở (không có class 'an')
    if (panel.classList.contains('an')) return;

    // Lấy tên người → tìm ID
    const ten = layTenTuPanel(panel);
    const nguoi = timNguoiTheoTen(ten);
    if (!nguoi) {
      // Không phải panel chi tiết người → bỏ qua
      return;
    }

    // Tìm khối chứa các nút (float:right)
    const divNut = panel.querySelector('div[style*="float:right"]');
    if (!divNut) return;

    // Tạo nút Mailto
    const nut = document.createElement('button');
    nut.className = 'nut-mailto';
    nut.title = 'Gửi góp ý cho cụ này qua email';
    nut.textContent = '📧 Gửi góp ý';
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
      guiGopY(nguoi);
    });

    // Chèn vào đầu khối nút (trước nút Danh tính / Đính chính / ×)
    divNut.insertBefore(nut, divNut.firstChild);

    console.log('Mailto: Đã chèn nút gửi góp ý cho', nguoi.ho_ten);
  }

  // Theo dõi 2 panel
  function theoDoiPanel(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    // MutationObserver theo dõi sự thay đổi nội dung
    const observer = new MutationObserver(function() {
      chenNutMailto(panel);
    });

    observer.observe(panel, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    // Chèn ngay nếu panel đã mở sẵn
    chenNutMailto(panel);
  }

  // Khởi tạo
  function khoiTao() {
    // Chờ dữ liệu gia phả load xong (window.giaphaData)
    const kiemTraDuLieu = setInterval(function() {
      if (window.giaphaData) {
        clearInterval(kiemTraDuLieu);
        theoDoiPanel('panel-chi-tiet');
        theoDoiPanel('phado-panel');
        console.log('Mailto: Đã kích hoạt nút "📧 Gửi góp ý" trên 2 panel');
      }
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', khoiTao);
  } else {
    khoiTao();
  }
})();
