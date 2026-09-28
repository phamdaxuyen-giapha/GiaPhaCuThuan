// ============================================================
// MODULE PHẢ ĐỒ — Vẽ cây gia phả bằng D3.js
// Phiên bản: 1.0
// Tác giả: Gia phả họ Phạm Đà Xuyên
// ============================================================

console.log('Module Phả đồ đang khởi động...');

// ============ BIẾN TOÀN CỤC ============
let phadoData = null;      // Dữ liệu gia phả
let phadoSvg = null;       // Thẻ SVG
let phadoG = null;         // Nhóm chính chứa cây
let phadoZoom = null;      // Hành vi zoom/pan
let phadoSelectedId = null; // ID người đang được chọn
let phadoFilterChi = '';    // Lọc theo chi (rỗng = tất cả)

// Kích thước node
const NODE_WIDTH = 180;
const NODE_HEIGHT = 70;
const NODE_SPACING_X = 30;
const NODE_SPACING_Y = 100;

// ============ KHỞI TẠO KHI DOM SẴN SÀNG ============
document.addEventListener('DOMContentLoaded', async function() {
  // Đợi app.js tải xong dữ liệu
  await new Promise(resolve => setTimeout(resolve, 500));

  // Kiểm tra dữ liệu đã tải chưa
  if (!window.giaphaData) {
    console.warn('Phả đồ: Chưa có dữ liệu gia phả. Thử lại sau 1 giây...');
    setTimeout(khoiTaoPhado, 1000);
  } else {
    khoiTaoPhado();
  }
});

// ============ HÀM KHỞI TẠO CHÍNH ============
async function khoiTaoPhado() {
  console.log('Phả đồ: Bắt đầu khởi tạo...');

  // Tải dữ liệu từ giapha.json (nếu chưa có)
  if (!window.giaphaData) {
    try {
      const response = await fetch('data/giapha.json');
      window.giaphaData = await response.json();
      console.log('Phả đồ: Đã tải gia phả:', window.giaphaData.nguoi.length, 'người');
    } catch (err) {
      console.error('Phả đồ: Lỗi tải gia phả:', err);
      return;
    }
  }

  phadoData = window.giaphaData;

  // Lấy thẻ SVG
  phadoSvg = d3.select('#phado-svg');
  if (phadoSvg.empty()) {
    console.warn('Phả đồ: Không tìm thấy #phado-svg');
    return;
  }

  // Khởi tạo nhóm chính
  phadoG = phadoSvg.append('g').attr('class', 'phado-main-group');

  // Cấu hình zoom
  phadoZoom = d3.zoom()
    .scaleExtent([0.1, 3])
    .on('zoom', function(event) {
      phadoG.attr('transform', event.transform);
    });

  phadoSvg.call(phadoZoom);

  // Gắn sự kiện cho các nút công cụ
  ganSuKienPhado();

  // Vẽ cây
  veCayPhado();

  console.log('Phả đồ: Khởi tạo xong!');
}

// ============ GẮN SỰ KIỆN CHO NÚT CÔNG CỤ ============
function ganSuKienPhado() {
  // Nút lọc chi
  const nutTatCa = document.getElementById('phado-loc-tatca');
  const nutBaHe = document.getElementById('phado-loc-bahe');
  const nutQuat = document.getElementById('phado-loc-quat');
  const nutXuyen = document.getElementById('phado-loc-xuyen');

  if (nutTatCa) nutTatCa.addEventListener('click', () => locChiPhado('', nutTatCa));
  if (nutBaHe) nutBaHe.addEventListener('click', () => locChiPhado('Chi Bá Hệ', nutBaHe));
  if (nutQuat) nutQuat.addEventListener('click', () => locChiPhado('Chi Trọng Quát', nutQuat));
  if (nutXuyen) nutXuyen.addEventListener('click', () => locChiPhado('Chi Trọng Xuyên', nutXuyen));

  // Nút zoom
  const nutZoomIn = document.getElementById('phado-zoom-in');
  const nutZoomOut = document.getElementById('phado-zoom-out');
  const nutZoomReset = document.getElementById('phado-zoom-reset');

  if (nutZoomIn) nutZoomIn.addEventListener('click', () => {
    phadoSvg.transition().duration(300).call(phadoZoom.scaleBy, 1.3);
  });
  if (nutZoomOut) nutZoomOut.addEventListener('click', () => {
    phadoSvg.transition().duration(300).call(phadoZoom.scaleBy, 0.7);
  });
  if (nutZoomReset) nutZoomReset.addEventListener('click', () => {
    phadoSvg.transition().duration(500).call(phadoZoom.transform, d3.zoomIdentity);
  });
}

// ============ LỌC THEO CHI ============
function locChiPhado(chi, nutDuocChon) {
  phadoFilterChi = chi;

  // Bỏ active tất cả nút
  document.querySelectorAll('.thanh-cong-cu .nut-tool').forEach(b => b.classList.remove('active'));

  // Thêm active cho nút được chọn
  if (nutDuocChon) nutDuocChon.classList.add('active');

  // Vẽ lại cây
  veCayPhado();

  console.log('Phả đồ: Đã lọc theo chi:', chi || 'Tất cả');
}

// ============ HÀM VẼ CÂY (định nghĩa ở Phần 2b) ============
function veCayPhado() {
  console.log('Phả đồ: veCayPhado() sẽ được định nghĩa ở Phần 2b');
  // TODO: Phần 2b sẽ thay thế hàm này
}

// ============ HÀM TẠO NODE (định nghĩa ở Phần 2b) ============
function taoNodePhado(nguoi) {
  // TODO: Phần 2b sẽ định nghĩa
}
