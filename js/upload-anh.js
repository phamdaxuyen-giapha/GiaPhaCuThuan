// ============================================================
// MODULE UPLOAD ẢNH TƯ LIỆU — Tab Ngoại phả
// Tự động crop 4:3 (ngang) / 3:4 (dọc) + nén WebP
// ============================================================

(function() {
  'use strict';

  // ===== CẤU HÌNH =====
  const KICH_THUOC_NGANG = { w: 1200, h: 900 };   // 4:3
  const KICH_THUOC_DOC   = { w: 900, h: 1200 };   // 3:4
  const CHAT_LUONG_WEBP  = 0.88;   // Chất lượng cao giữ nét chữ Hán Nôm
  const THUMB_MAX        = 320;
  const DELAY_DOWNLOAD   = 500;    // ms giữa các download

  let dsAnhMoi = [];

  // ===== TIỆN ÍCH =====
  function dinhDangSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), type, quality);
    });
  }

  // ===== XỬ LÝ ẢNH =====
  async function xuLyAnh(file, soThuTu) {
    const img = await loadImage(file);
    const W = img.width, H = img.height;
    const laNgang = W >= H;

    const dich = laNgang ? KICH_THUOC_NGANG : KICH_THUOC_DOC;
    const tyLeDich = dich.w / dich.h;
    const tyLeGoc = W / H;

    // Crop center theo tỷ lệ đích
    let cropW, cropH, cropX, cropY;
    if (tyLeGoc > tyLeDich) {
      cropH = H;
      cropW = H * tyLeDich;
      cropX = (W - cropW) / 2;
      cropY = 0;
    } else {
      cropW = W;
      cropH = W / tyLeDich;
      cropX = 0;
      cropY = (H - cropH) / 2;
    }

    const canvas = document.createElement('canvas');
    canvas.width = dich.w;
    canvas.height = dich.h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, dich.w, dich.h);

    const blob = await canvasToBlob(canvas, 'image/webp', CHAT_LUONG_WEBP);

    // Tạo thumbnail
    const thumbCanvas = document.createElement('canvas');
    const thumbRatio = THUMB_MAX / Math.max(dich.w, dich.h);
    thumbCanvas.width = Math.round(dich.w * thumbRatio);
    thumbCanvas.height = Math.round(dich.h * thumbRatio);
    const thumbCtx = thumbCanvas.getContext('2d');
    thumbCtx.imageSmoothingEnabled = true;
    thumbCtx.imageSmoothingQuality = 'high';
    thumbCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    const thumbDataUrl = thumbCanvas.toDataURL('image/webp', 0.7);

    URL.revokeObjectURL(img.src);

    return {
      id: 'ua-' + Date.now() + '-' + soThuTu,
      filename: 'tu-lieu-' + String(soThuTu).padStart(2, '0') + '.webp',
      blob,
      thumbnail: thumbDataUrl,
      sizeBefore: file.size,
      sizeAfter: blob.size,
      chuthich: '',
      huong: laNgang ? 'ngang' : 'doc',
      kichThuoc: dich.w + '×' + dich.h
    };
  }

  // ===== RENDER GALLERY =====
  function renderGallery() {
    const gallery = document.getElementById('ua-gallery');
    if (!gallery) return;

    if (dsAnhMoi.length === 0) {
      gallery.innerHTML = '<p style="text-align:center;color:#999;font-style:italic;padding:20px;grid-column:1/-1;">Chưa có ảnh. Bấm "📷 Upload ảnh mới" để bắt đầu.</p>';
      return;
    }

    gallery.innerHTML = '';
    dsAnhMoi.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = 'ua-item';
      el.innerHTML = `
        <div class="ua-thumb-wrap">
          <img class="ua-thumb" src="${item.thumbnail}" alt="${item.filename}">
          <span class="ua-badge">${item.huong === 'ngang' ? '4:3' : '3:4'}</span>
        </div>
        <div class="ua-info">
          <div class="ua-fname">${item.filename}</div>
          <div class="ua-size">${dinhDangSize(item.sizeBefore)} → <strong>${dinhDangSize(item.sizeAfter)}</strong></div>
        </div>
        <textarea class="ua-chuthich" placeholder="Nhập chú thích cho ảnh này..." data-idx="${idx}">${item.chuthich}</textarea>
        <div class="ua-actions">
          <button class="ua-btn ua-tai" data-idx="${idx}">📥 Tải</button>
          <button class="ua-btn ua-xoa" data-idx="${idx}">🗑️ Xóa</button>
        </div>
      `;
      gallery.appendChild(el);
    });

    gallery.querySelectorAll('.ua-chuthich').forEach(ta => {
      ta.addEventListener('input', function() {
        const idx = parseInt(this.dataset.idx);
        if (dsAnhMoi[idx]) dsAnhMoi[idx].chuthich = this.value;
      });
    });

    gallery.querySelectorAll('.ua-tai').forEach(btn => {
      btn.addEventListener('click', function() {
        const idx = parseInt(this.dataset.idx);
        if (dsAnhMoi[idx]) taiAnh(dsAnhMoi[idx]);
      });
    });

    gallery.querySelectorAll('.ua-xoa').forEach(btn => {
      btn.addEventListener('click', function() {
        const idx = parseInt(this.dataset.idx);
        if (!dsAnhMoi[idx]) return;
        if (!confirm('Xóa ảnh "' + dsAnhMoi[idx].filename + '" khỏi danh sách?')) return;
        dsAnhMoi.splice(idx, 1);
        danhSoLaiAnh();
        renderGallery();
      });
    });
  }

  function danhSoLaiAnh() {
    dsAnhMoi.forEach((item, idx) => {
      item.filename = 'tu-lieu-' + String(idx + 1).padStart(2, '0') + '.webp';
    });
  }

  // ===== DOWNLOAD =====
  function taiAnh(item) {
    const url = URL.createObjectURL(item.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function taiTatCa() {
    if (dsAnhMoi.length === 0) {
      alert('Chưa có ảnh nào để tải.');
      return;
    }
    if (!confirm('Tải về ' + dsAnhMoi.length + ' ảnh?\n\nTrình duyệt sẽ hỏi cho phép tải nhiều file — bạn bấm "Allow" (Cho phép).')) return;

    for (let i = 0; i < dsAnhMoi.length; i++) {
      taiAnh(dsAnhMoi[i]);
      await new Promise(r => setTimeout(r, DELAY_DOWNLOAD));
    }
  }

  // ===== EXPORT JSON =====
  function xuatJSON() {
    if (dsAnhMoi.length === 0) {
      alert('Chưa có ảnh nào để xuất.');
      return;
    }
    const data = {
      metadata: {
        ten: 'Tư liệu ảnh gia phả họ Phạm Đà Xuyên',
        ngay_cap_nhat: new Date().toISOString().split('T')[0],
        tong_so: dsAnhMoi.length
      },
      anh: dsAnhMoi.map(a => ({
        file: 'assets/tu-lieu/' + a.filename,
        chuthich: a.chuthich || '',
        huong: a.huong,
        kich_thuoc: a.kichThuoc
      }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tulieu.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ===== XỬ LÝ UPLOAD =====
  async function xuLyUpload(files) {
    const status = document.getElementById('ua-status');
    const mangFiles = Array.from(files);

    if (mangFiles.length === 0) return;

    const batDau = dsAnhMoi.length;

    for (let i = 0; i < mangFiles.length; i++) {
      const file = mangFiles[i];
      const soThuTu = batDau + i + 1;

      if (status) status.textContent = `⏳ Đang xử lý ${i + 1}/${mangFiles.length}...`;

      try {
        const item = await xuLyAnh(file, soThuTu);
        dsAnhMoi.push(item);
        renderGallery();
      } catch (err) {
        console.error('Lỗi xử lý ảnh:', file.name, err);
      }
    }

    if (status) {
      status.textContent = `✅ Đã thêm ${mangFiles.length} ảnh`;
      setTimeout(() => { status.textContent = ''; }, 5000);
    }
  }

  // ===== KHỞI TẠO UI =====
  function chenUI() {
    const container = document.getElementById('ds-ngoai-pha');
    if (!container) return;

    if (!document.getElementById('ua-style')) {
      const style = document.createElement('style');
      style.id = 'ua-style';
      style.textContent = `
        .ua-wrap { margin-top: 16px; }
        .ua-toolbar {
          display: flex; flex-wrap: wrap; gap: 10px;
          margin-bottom: 20px; padding: 16px;
          background: #FAF6EC; border-radius: 8px;
          border-left: 4px solid #7A6320;
          align-items: center;
        }
        .ua-btn-main {
          padding: 10px 18px; border-radius: 6px;
          border: none; cursor: pointer;
          font-family: inherit; font-size: 11pt; font-weight: 600;
          transition: all 0.15s;
        }
        .ua-chon { background: #7A6320; color: #fff; }
        .ua-chon:hover { background: #5f4d19; }
        .ua-taitatca { background: #C9A961; color: #fff; }
        .ua-taitatca:hover { background: #a8893e; }
        .ua-xuatjson { background: #E23B3A; color: #fff; }
        .ua-xuatjson:hover { background: #c9282d; }
        #ua-status { font-style: italic; color: #7A6320; margin-left: auto; }
        .ua-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }
        .ua-item {
          background: #fff; border: 1px solid #E5DDD0;
          border-radius: 8px; padding: 12px;
          display: flex; flex-direction: column; gap: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .ua-thumb-wrap { position: relative; width: 100%; }
        .ua-thumb {
          width: 100%; height: auto; border-radius: 4px;
          display: block; background: #f5f5f5;
        }
        .ua-badge {
          position: absolute; top: 6px; right: 6px;
          background: rgba(122, 99, 32, 0.9); color: #fff;
          padding: 2px 8px; border-radius: 10px;
          font-size: 9pt; font-weight: 600;
        }
        .ua-info { font-size: 10pt; }
        .ua-fname {
          font-weight: 600; color: #7A6320;
          font-family: monospace;
        }
        .ua-size { color: #888; font-size: 9.5pt; }
        .ua-size strong { color: #E23B3A; }
        .ua-chuthich {
          width: 100%; min-height: 50px;
          border: 1px solid #E5DDD0; border-radius: 4px;
          padding: 6px 8px; font-family: inherit; font-size: 10pt;
          resize: vertical; color: #3A3A3A;
        }
        .ua-chuthich:focus { outline: none; border-color: #7A6320; }
        .ua-actions { display: flex; gap: 6px; }
        .ua-btn {
          flex: 1; padding: 6px 10px;
          border-radius: 4px; cursor: pointer;
          font-family: inherit; font-size: 10pt;
          border: 1px solid #E5DDD0; background: #fff;
          transition: all 0.15s;
        }
        .ua-tai { color: #7A6320; border-color: #C9A961; }
        .ua-tai:hover { background: #C9A961; color: #fff; }
        .ua-xoa { color: #E23B3A; border-color: #E23B3A; }
        .ua-xoa:hover { background: #E23B3A; color: #fff; }
        @media (max-width: 600px) {
          .ua-gallery { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
          #ua-status { margin-left: 0; width: 100%; }
        }
      `;
      document.head.appendChild(style);
    }

    container.innerHTML = `
      <div class="ua-wrap">
        <div class="ua-toolbar">
          <button type="button" class="ua-btn-main ua-chon" id="ua-chon">📷 Upload ảnh mới</button>
          <button type="button" class="ua-btn-main ua-taitatca" id="ua-taitatca">📥 Tải tất cả</button>
          <button type="button" class="ua-btn-main ua-xuatjson" id="ua-xuatjson">📄 Xuất tulieu.json</button>
          <span id="ua-status"></span>
        </div>
        <input type="file" id="ua-input" accept="image/*" multiple hidden>
        <div class="ua-gallery" id="ua-gallery"></div>
      </div>
    `;

    document.getElementById('ua-chon').addEventListener('click', () => {
      document.getElementById('ua-input').click();
    });

    document.getElementById('ua-input').addEventListener('change', function(e) {
      xuLyUpload(e.target.files);
      this.value = '';
    });

    document.getElementById('ua-taitatca').addEventListener('click', taiTatCa);
    document.getElementById('ua-xuatjson').addEventListener('click', xuatJSON);

    renderGallery();
  }

  function khoiTao() {
    const wait = setInterval(() => {
      if (document.getElementById('ds-ngoai-pha')) {
        clearInterval(wait);
        chenUI();
        console.log('Upload Ảnh: Đã kích hoạt module');
      }
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', khoiTao);
  } else {
    khoiTao();
  }
})();
