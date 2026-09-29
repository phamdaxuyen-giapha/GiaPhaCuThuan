// ============================================================
// MODULE PHẢ ĐỒ — Vẽ cây gia phả bằng D3.js
// Phiên bản: 6.0 (vẽ đường nối kiểu cây chuẩn)
// ============================================================

console.log('Module Phả đồ đang khởi động...');

let phadoData = null;
let phadoSvg = null;
let phadoG = null;
let phadoZoom = null;
let phadoSelectedId = null;
let phadoFilterChi = '';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 70;
const NODE_SPACING_X = 30;
const NODE_SPACING_Y = 100;

document.addEventListener('DOMContentLoaded', async function() {
  await new Promise(resolve => setTimeout(resolve, 500));

  if (!window.giaphaData) {
    console.warn('Phả đồ: Chưa có dữ liệu gia phả. Thử lại sau 1 giây...');
    setTimeout(khoiTaoPhado, 1000);
  } else {
    khoiTaoPhado();
  }
});

async function khoiTaoPhado() {
  console.log('Phả đồ: Bắt đầu khởi tạo...');

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

  phadoSvg = d3.select('#phado-svg');
  if (phadoSvg.empty()) {
    console.warn('Phả đồ: Không tìm thấy #phado-svg');
    return;
  }

  phadoG = phadoSvg.append('g').attr('class', 'phado-main-group');

  phadoZoom = d3.zoom()
    .scaleExtent([0.1, 3])
    .on('zoom', function(event) {
      phadoG.attr('transform', event.transform);
    });

  phadoSvg.call(phadoZoom);

  ganSuKienPhado();
  veCayPhado();

  console.log('Phả đồ: Khởi tạo xong!');
}

function ganSuKienPhado() {
  const nutTatCa = document.getElementById('phado-loc-tatca');
  const nutBaHe = document.getElementById('phado-loc-bahe');
  const nutQuat = document.getElementById('phado-loc-quat');
  const nutXuyen = document.getElementById('phado-loc-xuyen');

  if (nutTatCa) nutTatCa.addEventListener('click', () => locChiPhado('', nutTatCa));
  if (nutBaHe) nutBaHe.addEventListener('click', () => locChiPhado('Chi Bá Hệ', nutBaHe));
  if (nutQuat) nutQuat.addEventListener('click', () => locChiPhado('Chi Trọng Quát', nutQuat));
  if (nutXuyen) nutXuyen.addEventListener('click', () => locChiPhado('Chi Trọng Xuyên', nutXuyen));

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

function locChiPhado(chi, nutDuocChon) {
  phadoFilterChi = chi;
  phadoSelectedId = null;

  document.querySelectorAll('.thanh-cong-cu .nut-tool').forEach(b => b.classList.remove('active'));
  if (nutDuocChon) nutDuocChon.classList.add('active');

  const panel = document.getElementById('phado-panel');
  if (panel) panel.classList.add('an');

  veCayPhado();

  console.log('Phả đồ: Đã lọc theo chi:', chi || 'Tất cả');
}

// ============ TÌM TRỰC HỆ + BÀNG HỆ ============
function timToTien(nguoiId) {
  const dsToTien = new Set();
  let currentId = nguoiId;

  while (currentId) {
    const nguoi = phadoData.nguoi.find(n => n.id === currentId);
    if (!nguoi) break;
    dsToTien.add(nguoi.id);
    currentId = nguoi.cha_id;
  }

  return dsToTien;
}

function timConChau(nguoiId) {
  const dsConChau = new Set();
  const hangDoi = [nguoiId];

  while (hangDoi.length > 0) {
    const currentId = hangDoi.shift();
    dsConChau.add(currentId);

    const nguoi = phadoData.nguoi.find(n => n.id === currentId);
    if (nguoi && nguoi.con_ids && nguoi.con_ids.length > 0) {
      nguoi.con_ids.forEach(conId => {
        if (!dsConChau.has(conId)) {
          hangDoi.push(conId);
        }
      });
    }
  }

  return dsConChau;
}

function timTrucHe(nguoiId) {
  const toTien = timToTien(nguoiId);
  const conChau = timConChau(nguoiId);
  const trucHe = new Set([...toTien, ...conChau]);
  return trucHe;
}

// ============ CHỌN NODE + PANEL ============
function chonNodePhado(nguoiId) {
  phadoSelectedId = nguoiId;

  const nguoi = phadoData.nguoi.find(n => n.id === nguoiId);
  if (!nguoi) return;

  const trucHe = timTrucHe(nguoiId);

  d3.selectAll('.phado-node').each(function() {
    const nodeId = d3.select(this).attr('data-id');
    const node = d3.select(this);

    node.classed('dang-chon', nodeId === nguoiId);
    node.classed('truc-he', trucHe.has(nodeId) && nodeId !== nguoiId);
    node.classed('bang-he', !trucHe.has(nodeId));
  });

  hienThiPanelPhado(nguoi);

  console.log('Phả đồ: Đã chọn', nguoi.ho_ten, '— Trực hệ:', trucHe.size, 'người');
}

function hienThiPanelPhado(nguoi) {
  const panel = document.getElementById('phado-panel');
  if (!panel) return;

  let html = '<div style="float:right;display:flex;gap:8px;align-items:center;">';
  html += '<button onclick="chuyenSangDanhTinh(\'' + nguoi.id + '\')" class="nut-pha-do">📊 Danh tính</button>';
  html += '<button onclick="dongPanelPhado()" style="border:none;background:none;font-size:20pt;cursor:pointer;">×</button>';
  html += '</div>';

  html += '<h3>' + (nguoi.ho_ten || '(Không rõ tên)') + '</h3>';
  html += '<p><strong>Đời:</strong> ' + nguoi.doi + '</p>';
  html += '<p><strong>Chi:</strong> ' + (nguoi.chi || '—') + '</p>';

  if (nguoi.ten_chu) html += '<p><strong>Tên chữ:</strong> ' + nguoi.ten_chu + '</p>';
  if (nguoi.ten_hieu) html += '<p><strong>Tên hiệu:</strong> ' + nguoi.ten_hieu + '</p>';
  if (nguoi.ten_huy) html += '<p><strong>Tên hủy:</strong> ' + nguoi.ten_huy + '</p>';
  html += '<p><strong>Giới tính:</strong> ' + (nguoi.gioi_tinh === 'nam' ? 'Nam' : 'Nữ') + '</p>';

  if (nguoi.su_kien && nguoi.su_kien.length > 0) {
    html += '<p style="margin-top:12px;"><strong>Sự kiện:</strong></p>';
    html += '<ul style="padding-left:20px;font-size:10.5pt;">';
    nguoi.su_kien.forEach(sk => {
      let moTa = '';
      if (sk.ngay_am) moTa += sk.ngay_am;
      if (sk.ngay_duong) moTa += ' (' + sk.ngay_duong + ')';
      if (sk.gio) moTa += ' giờ ' + sk.gio;
      if (sk.dia_diem) moTa += ' — ' + sk.dia_diem;
      if (moTa) html += '<li>' + moTa + '</li>';
    });
    html += '</ul>';
  }

  panel.innerHTML = html;
  panel.classList.remove('an');
}

function dongPanelPhado() {
  const panel = document.getElementById('phado-panel');
  if (panel) panel.classList.add('an');
}

function chuyenSangDanhTinh(nguoiId) {
  const menuButtons = document.querySelectorAll('.menu-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const bannerImg = document.getElementById('banner-img');

  menuButtons.forEach(b => b.classList.remove('active'));
  const nutDanhTinh = document.querySelector('.menu-btn[data-tab="danhtinh"]');
  if (nutDanhTinh) nutDanhTinh.classList.add('active');

  tabContents.forEach(c => c.classList.remove('active'));
  const tabDanhTinh = document.getElementById('tab-danhtinh');
  if (tabDanhTinh) tabDanhTinh.classList.add('active');

  if (bannerImg) bannerImg.src = 'assets/banner-danhtinh.png';

  if (typeof hienThiChiTiet === 'function') {
    const nguoi = phadoData.nguoi.find(n => n.id === nguoiId);
    if (nguoi) hienThiChiTiet(nguoi);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ VẼ CÂY CHÍNH — SẮP XẾP THEO CÂY NHỊ PHÂN ============
function veCayPhado() {
  phadoG.selectAll('*').remove();

  // Lọc: người họ Phạm + ẩn Đời 7
  let dsNguoi = phadoData.nguoi.filter(n =>
    n.ho_ten && n.ho_ten.startsWith('Phạm') && n.doi <= 6
  );

  if (phadoFilterChi) {
    dsNguoi = dsNguoi.filter(n => n.chi === phadoFilterChi);
  }

  if (dsNguoi.length === 0) {
    console.warn('Phả đồ: Không có người nào để vẽ');
    return;
  }

  // Tạo map tra cứu nhanh
  const mapNguoi = {};
  dsNguoi.forEach(n => { mapNguoi[n.id] = n; });

  // Nhóm theo đời
  const theoDoi = {};
  dsNguoi.forEach(n => {
    if (!theoDoi[n.doi]) theoDoi[n.doi] = [];
    theoDoi[n.doi].push(n);
  });

  const dsDoi = Object.keys(theoDoi).map(Number).sort((a, b) => a - b);

  // ============ THUẬT TOÁN: SẮP XẾP THEO CÂY ============
  // Bước 1: Sắp xếp từng đời theo thứ tự cha_id
  const viTriNode = {};
  let y = 50;

  dsDoi.forEach((doi, idxDoi) => {
    const dsNguoiDoi = theoDoi[doi];

    // Nếu là đời 1 → sắp xếp theo tên
    if (idxDoi === 0) {
      dsNguoiDoi.sort((a, b) => (a.ho_ten || '').localeCompare(b.ho_ten || ''));
    } else {
      // Sắp xếp theo thứ tự cha trong đời trên
      dsNguoiDoi.sort((a, b) => {
        const chaA = viTriNode[a.cha_id];
        const chaB = viTriNode[b.cha_id];

        // Nếu cha chưa có vị trí → xếp cuối
        if (!chaA && !chaB) return 0;
        if (!chaA) return 1;
        if (!chaB) return -1;

        // Ưu tiên cha có vị trí x nhỏ hơn
        if (chaA.x !== chaB.x) return chaA.x - chaB.x;

        // Cùng cha → xếp theo thứ tự trong con_ids của cha
        const chaNguoi = mapNguoi[a.cha_id];
        if (chaNguoi && chaNguoi.con_ids) {
          const idxA = chaNguoi.con_ids.indexOf(a.id);
          const idxB = chaNguoi.con_ids.indexOf(b.id);
          return idxA - idxB;
        }
        return 0;
      });
    }

    const tongWidth = dsNguoiDoi.length * (NODE_WIDTH + NODE_SPACING_X);
    let x = -tongWidth / 2;

    dsNguoiDoi.forEach(nguoi => {
      viTriNode[nguoi.id] = { x: x, y: y, nguoi: nguoi };
      x += NODE_WIDTH + NODE_SPACING_X;
    });

    y += NODE_HEIGHT + NODE_SPACING_Y;
  });

  // ============ BƯỚC 2: TINH CHỈNH VỊ TRÍ X THEO CHA ============
  // Duyệt lại từng đời, kéo con về gần cha
  dsDoi.forEach((doi, idxDoi) => {
    if (idxDoi === 0) return;

    const dsNguoiDoi = theoDoi[doi];
    const dsNguoiDoiSorted = dsNguoiDoi.map(n => viTriNode[n.id]).sort((a, b) => a.x - b.x);

    // Nhóm con theo cha
    const nhomTheoCha = {};
    dsNguoiDoiSorted.forEach(viTri => {
      const chaId = viTri.nguoi.cha_id || 'khong_co_cha';
      if (!nhomTheoCha[chaId]) nhomTheoCha[chaId] = [];
      nhomTheoCha[chaId].push(viTri);
    });

    // Với mỗi nhóm con → căn giữa dưới cha
    Object.keys(nhomTheoCha).forEach(chaId => {
      const nhomCon = nhomTheoCha[chaId];
      const chaViTri = viTriNode[chaId];

      if (chaViTri) {
        // Tính tâm của nhóm con
        const tamNhomCon = (nhomCon[0].x + nhomCon[nhomCon.length - 1].x + NODE_WIDTH) / 2;
        const tamCha = chaViTri.x + NODE_WIDTH / 2;

        // Dịch chuyển nhóm con để căn giữa dưới cha
        const dichChuyen = tamCha - tamNhomCon;

        if (Math.abs(dichChuyen) < NODE_WIDTH * 2) {
          nhomCon.forEach(viTri => {
            viTri.x += dichChuyen;
            viTriNode[viTri.nguoi.id].x = viTri.x;
          });
        }
      }
    });
  });

  // ============ BƯỚC 3: VẼ ĐƯỜNG NỐI ============
  const duongNoi = phadoG.append('g').attr('class', 'phado-duong-noi');

  dsNguoi.forEach(nguoi => {
    if (nguoi.cha_id && viTriNode[nguoi.cha_id] && viTriNode[nguoi.id]) {
      const cha = viTriNode[nguoi.cha_id];
      const con = viTriNode[nguoi.id];

      const x1 = cha.x + NODE_WIDTH / 2;
      const y1 = cha.y + NODE_HEIGHT;
      const x2 = con.x + NODE_WIDTH / 2;
      const y2 = con.y;

      // Đường gấp khúc: Xuống → Ngang → Xuống
      const yMid = y1 + (NODE_SPACING_Y / 2);
      const duongPath = `M ${x1} ${y1} L ${x1} ${yMid} L ${x2} ${yMid} L ${x2} ${y2}`;

      duongNoi.append('path')
        .attr('d', duongPath)
        .attr('stroke', '#C9A961')
        .attr('stroke-width', 1.5)
        .attr('fill', 'none')
        .attr('opacity', 0.6);
    }
  });

  // Căn giữa cây
  const tongChieuRong = Object.values(viTriNode).reduce((max, v) =>
    Math.max(max, Math.abs(v.x) + NODE_WIDTH), 0);
  phadoG.attr('transform', `translate(${tongChieuRong + 50}, 30)`);

  // Vẽ node
  const nhomNode = phadoG.append('g').attr('class', 'phado-nhom-node');

  dsNguoi.forEach(nguoi => {
    const viTri = viTriNode[nguoi.id];
    if (viTri) {
      taoNodePhado(nguoi, viTri.x, viTri.y, nhomNode);
    }
  });

  console.log('Phả đồ: Đã vẽ', dsNguoi.length, 'node (Đời 1-6)');
}

function taoNodePhado(nguoi, x, y, nhomCha) {
  const nodeGroup = nhomCha.append('g')
    .attr('class', 'phado-node')
    .attr('transform', `translate(${x}, ${y})`)
    .attr('data-id', nguoi.id);

  nodeGroup.append('rect')
    .attr('width', NODE_WIDTH)
    .attr('height', NODE_HEIGHT)
    .attr('rx', 8)
    .attr('ry', 8)
    .attr('fill', '#FFF8F0')
    .attr('stroke', '#C9A961')
    .attr('stroke-width', 1.5)
    .attr('cursor', 'pointer');

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

  nodeGroup.append('text')
    .attr('x', NODE_WIDTH / 2)
    .attr('y', 62)
    .attr('text-anchor', 'middle')
    .attr('font-size', '10px')
    .attr('fill', '#C9A961')
    .text(`Đời ${nguoi.doi}`);

  nodeGroup.on('click', function(event) {
    event.stopPropagation();
    chonNodePhado(nguoi.id);
  });

  nodeGroup.on('mouseover', function() {
    if (phadoSelectedId !== nguoi.id) {
      d3.select(this).select('rect')
        .attr('fill', '#FFE8B0')
        .attr('stroke-width', 2.5);
    }
  });

  nodeGroup.on('mouseout', function() {
    if (phadoSelectedId !== nguoi.id && !d3.select(this).classed('truc-he')) {
      d3.select(this).select('rect')
        .attr('fill', '#FFF8F0')
        .attr('stroke-width', 1.5);
    }
  });

  return nodeGroup;
}
