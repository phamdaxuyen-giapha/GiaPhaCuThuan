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

function veCayPhado() {
  // Xóa cây cũ
  phadoG.selectAll('*').remove();

  // Lấy danh sách người
  let dsNguoi = phadoData.nguoi.filter(n => n.ho_ten && n.ho_ten.startsWith('Phạm'));

  // Lọc theo chi nếu có
  if (phadoFilterChi) {
    dsNguoi = dsNguoi.filter(n => n.chi === phadoFilterChi);
  }

  // Sắp xếp theo đời
  dsNguoi.sort((a, b) => a.doi - b.doi);

  if (dsNguoi.length === 0) {
    console.warn('Phả đồ: Không có người nào để vẽ');
    return;
  }

  // Nhóm theo đời
  const theoDoi = {};
  dsNguoi.forEach(n => {
    if (!theoDoi[n.doi]) theoDoi[n.doi] = [];
    theoDoi[n.doi].push(n);
  });

  // Tính vị trí từng node
  const dsDoi = Object.keys(theoDoi).map(Number).sort((a, b) => a - b);
  let y = 50;
  const viTriNode = {};

  dsDoi.forEach(doi => {
    const dsNguoiDoi = theoDoi[doi];
    const tongWidth = dsNguoiDoi.length * (NODE_WIDTH + NODE_SPACING_X);
    let x = -tongWidth / 2;

    dsNguoiDoi.forEach(nguoi => {
      viTriNode[nguoi.id] = { x: x, y: y, nguoi: nguoi };
      x += NODE_WIDTH + NODE_SPACING_X;
    });
    y += NODE_HEIGHT + NODE_SPACING_Y;
  });

  // Vẽ đường nối cha-con
  const duongNoi = phadoG.append('g').attr('class', 'phado-duong-noi');

  dsNguoi.forEach(nguoi => {
    if (nguoi.cha_id && viTriNode[nguoi.cha_id] && viTriNode[nguoi.id]) {
      const cha = viTriNode[nguoi.cha_id];
      const con = viTriNode[nguoi.id];

      // Đường từ đáy cha xuống đỉnh con
      const x1 = cha.x + NODE_WIDTH / 2;
      const y1 = cha.y + NODE_HEIGHT;
      const x2 = con.x + NODE_WIDTH / 2;
      const y2 = con.y;

      // Vẽ đường gấp khúc (đi xuống, sang ngang, xuống tiếp)
      const duongPath = `M ${x1} ${y1} L ${x1} ${y1 + 30} L ${x2} ${y1 + 30} L ${x2} ${y2}`;

      duongNoi.append('path')
        .attr('d', duongPath)
        .attr('stroke', '#C9A961')
        .attr('stroke-width', 1.5)
        .attr('fill', 'none')
        .attr('opacity', 0.5);
    }
  });

  // Vẽ các node
  const nhomNode = phadoG.append('g').attr('class', 'phado-nhom-node');

  dsNguoi.forEach(nguoi => {
    const viTri = viTriNode[nguoi.id];
    if (viTri) {
      taoNodePhado(nguoi, viTri.x, viTri.y, nhomNode);
    }
  });

  console.log('Phả đồ: Đã vẽ', dsNguoi.length, 'node');
}

// ============ HÀM TẠO NODE ============
function taoNodePhado(nguoi, x, y, nhomCha) {
  const nodeGroup = nhomCha.append('g')
    .attr('class', 'phado-node')
    .attr('transform', `translate(${x}, ${y})`)
    .attr('data-id', nguoi.id);

  // Hình chữ nhật nền
  nodeGroup.append('rect')
    .attr('width', NODE_WIDTH)
    .attr('height', NODE_HEIGHT)
    .attr('rx', 8)
    .attr('ry', 8)
    .attr('fill', '#FFF8F0')
    .attr('stroke', '#C9A961')
    .attr('stroke-width', 1.5)
    .attr('cursor', 'pointer');

  // Tên
  nodeGroup.append('text')
    .attr('x', NODE_WIDTH / 2)
    .attr('y', 25)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'Noto Serif, serif')
    .attr('font-size', '13px')
    .attr('font-weight', 'bold')
    .attr('fill', '#7A6320')
    .attr('cursor', 'pointer')
    .text(nguoi.ho_ten.length > 22 ? nguoi.ho_ten.substring(0, 20) + '...' : nguoi.ho_ten);

  // Tên chữ
  if (nguoi.ten_chu) {
    nodeGroup.append('text')
      .attr('x', NODE_WIDTH / 2)
      .attr('y', 45)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Noto Serif, serif')
      .attr('font-size', '11px')
      .attr('font-style', 'italic')
      .attr('fill', '#999')
      .text(nguoi.ten_chu.length > 24 ? nguoi.ten_chu.substring(0, 22) + '...' : nguoi.ten_chu);
  }

  // Đời
  nodeGroup.append('text')
    .attr('x', NODE_WIDTH / 2)
    .attr('y', 62)
    .attr('text-anchor', 'middle')
    .attr('font-size', '10px')
    .attr('fill', '#C9A961')
    .text(`Đời ${nguoi.doi}`);

  // Sự kiện click
  nodeGroup.on('click', function(event) {
    event.stopPropagation();
    chonNodePhado(nguoi.id);
  });

  // Sự kiện hover
  nodeGroup.on('mouseover', function() {
    d3.select(this).select('rect')
      .attr('fill', '#FFE8B0')
      .attr('stroke-width', 2.5);
  });

  nodeGroup.on('mouseout', function() {
    if (phadoSelectedId !== nguoi.id) {
      d3.select(this).select('rect')
        .attr('fill', '#FFF8F0')
        .attr('stroke-width', 1.5);
    }
  });

  return nodeGroup;
}
