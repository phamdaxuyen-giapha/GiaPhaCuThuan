// ============================================================
// GALLERY TƯ LIỆU — Đọc data/tulieu.json và hiển thị gallery
// ============================================================

(function() {
  'use strict';

  let dsAnh = [];
  let chiSoHienTai = 0;

  async function loadTuLieu() {
    try {
      const response = await fetch('data/tulieu.json');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      dsAnh = data.anh || [];
      console.log('Gallery Tư liệu: Đã tải', dsAnh.length, 'ảnh');
      return true;
    } catch (err) {
      console.warn('Gallery Tư liệu: Không tải được tulieu.json —', err.message);
      return false;
    }
  }
  
  function renderGallery() {
    const gallery = document.getElementById('tl-gallery');
    if (!gallery) return;

    if (dsAnh.length === 0) {
      gallery.innerHTML = '<p style="text-align:center;color:#999;font-style:italic;padding:20px;grid-column:1/-1;">Chưa có tư liệu ảnh.</p>';
      return;
    }

    gallery.innerHTML = '';
    dsAnh.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = 'tl-item';
      el.innerHTML = `
        <div class="tl-thumb-wrap">
          <img class="tl-thumb" src="${item.file}" alt="${item.chuthich || 'Tư liệu'}" loading="lazy">
        </div>
        <div class="tl-chuthich">${item.chuthich || '(Chưa có chú thích)'}</div>
      `;
      el.addEventListener('click', () => moLightbox(idx));
      gallery.appendChild(el);
    });
  }
  
  function moLightbox(idx) {
    if (!dsAnh[idx]) return;
    chiSoHienTai = idx;

    let lb = document.getElementById('tl-lightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'tl-lightbox';
      lb.className = 'tl-lightbox';
      lb.innerHTML = `
        <span class="tl-lb-close" title="Đóng (ESC)">×</span>
        <span class="tl-lb-prev" title="Ảnh trước (←)">‹</span>
        <span class="tl-lb-next" title="Ảnh sau (→)">›</span>
        <div class="tl-lb-body">
          <img class="tl-lb-img" src="" alt="">
          <div class="tl-lb-caption"></div>
          <div class="tl-lb-counter"></div>
        </div>
      `;
      document.body.appendChild(lb);

      lb.querySelector('.tl-lb-close').addEventListener('click', dongLightbox);
      lb.querySelector('.tl-lb-prev').addEventListener('click', (e) => {
        e.stopPropagation();
        chuyenAnh(-1);
      });
      lb.querySelector('.tl-lb-next').addEventListener('click', (e) => {
        e.stopPropagation();
        chuyenAnh(1);
      });
      lb.addEventListener('click', (e) => {
        if (e.target === lb) dongLightbox();
      });

      document.addEventListener('keydown', (e) => {
        if (!document.getElementById('tl-lightbox')) return;
        if (e.key === 'Escape') dongLightbox();
        if (e.key === 'ArrowLeft') chuyenAnh(-1);
        if (e.key === 'ArrowRight') chuyenAnh(1);
      });
    }

    capNhatLightbox();
    lb.classList.add('hien');
  }

  function capNhatLightbox() {
    const lb = document.getElementById('tl-lightbox');
    if (!lb) return;
    const item = dsAnh[chiSoHienTai];
    if (!item) return;

    lb.querySelector('.tl-lb-img').src = item.file;
    lb.querySelector('.tl-lb-caption').textContent = item.chuthich || '(Chưa có chú thích)';
    lb.querySelector('.tl-lb-counter').textContent = (chiSoHienTai + 1) + ' / ' + dsAnh.length;
  }

  function chuyenAnh(huong) {
    chiSoHienTai = (chiSoHienTai + huong + dsAnh.length) % dsAnh.length;
    capNhatLightbox();
  }

  function dongLightbox() {
    const lb = document.getElementById('tl-lightbox');
    if (lb) lb.classList.remove('hien');
  }
  
  function themCSS() {
    if (document.getElementById('tl-style')) return;
    const style = document.createElement('style');
    style.id = 'tl-style';
    style.textContent = `
      .tl-wrap { margin-top: 16px; margin-bottom: 24px; }
      .tl-title {
        font-size: 13pt; font-weight: 700; color: #E23B3A;
        margin-bottom: 12px; padding-left: 12px; border-left: 4px solid #7A6320;
      }
      .tl-gallery {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 14px;
      }
      .tl-item {
        background: #fff; border: 1px solid #E5DDD0;
        border-radius: 8px; padding: 10px; cursor: pointer;
        transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      }
      .tl-item:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 16px rgba(0,0,0,0.15);
        border-color: #C9A961;
      }
      .tl-thumb-wrap {
        width: 100%; aspect-ratio: 4 / 3; overflow: hidden;
        border-radius: 4px; background: #f5f5f5; margin-bottom: 8px;
      }
      .tl-thumb {
        width: 100%; height: 100%; object-fit: cover;
        display: block; transition: transform 0.3s;
      }
      .tl-item:hover .tl-thumb { transform: scale(1.05); }
      .tl-chuthich {
        font-size: 10pt; color: #3A3A3A; line-height: 1.4;
        text-align: center; min-height: 2.8em;
      }
      .tl-lightbox {
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.92); display: none;
        align-items: center; justify-content: center;
        z-index: 10000; padding: 20px;
      }
      .tl-lightbox.hien { display: flex; }
      .tl-lb-body {
        max-width: 90vw; max-height: 90vh;
        display: flex; flex-direction: column;
        align-items: center; gap: 12px;
      }
      .tl-lb-img {
        max-width: 90vw; max-height: 75vh; object-fit: contain;
        border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        background: #fff;
      }
      .tl-lb-caption {
        color: #fff; font-size: 12pt; text-align: center;
        max-width: 80vw; font-family: 'Noto Serif', serif;
      }
      .tl-lb-counter { color: #C9A961; font-size: 10pt; font-weight: 600; }
      .tl-lb-close {
        position: absolute; top: 20px; right: 30px;
        color: #fff; font-size: 40pt; cursor: pointer;
        line-height: 1; font-weight: 300; transition: color 0.15s;
      }
      .tl-lb-close:hover { color: #C9A961; }
      .tl-lb-prev, .tl-lb-next {
        position: absolute; top: 50%; transform: translateY(-50%);
        color: #fff; font-size: 60pt; cursor: pointer;
        line-height: 1; font-weight: 300; padding: 0 20px;
        user-select: none; transition: color 0.15s;
      }
      .tl-lb-prev { left: 20px; }
      .tl-lb-next { right: 20px; }
      .tl-lb-prev:hover, .tl-lb-next:hover { color: #C9A961; }
      @media (max-width: 600px) {
        .tl-gallery { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
        .tl-chuthich { font-size: 9pt; }
        .tl-lb-prev, .tl-lb-next { font-size: 40pt; padding: 0 10px; }
        .tl-lb-close { font-size: 30pt; top: 12px; right: 16px; }
      }
    `;
    document.head.appendChild(style);
  }
  
  function chenUI() {
    const container = document.getElementById('ds-ngoai-pha');
    if (!container) return;
    if (document.getElementById('tl-gallery')) return;

    themCSS();

    const wrap = document.createElement('div');
    wrap.className = 'tl-wrap';
    wrap.innerHTML = `
      <div class="tl-title">📚 Tư liệu ảnh gia phả (${dsAnh.length} ảnh)</div>
      <div class="tl-gallery" id="tl-gallery"></div>
    `;
    container.parentNode.insertBefore(wrap, container);
    renderGallery();
  }

  async function khoiTao() {
    const wait = setInterval(async () => {
      if (document.getElementById('ds-ngoai-pha')) {
        clearInterval(wait);
        const ok = await loadTuLieu();
        if (ok && dsAnh.length > 0) {
          chenUI();
          console.log('Gallery Tư liệu: Đã hiển thị', dsAnh.length, 'ảnh');
        }
      }
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', khoiTao);
  } else {
    khoiTao();
  }
})();
