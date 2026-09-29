// ============================================================
// MODULE PHẢ ĐỒ — Vẽ cây gia phả bằng D3.js
// Phiên bản: 7.0 — Tree Layout đệ quy (Reingold–Tilford rút gọn)
// ============================================================

console.log('Module Phả đồ đang khởi động...');

let phadoData = null;
let phadoSvg = null;
let phadoG = null;
let phadoZoom = null;
let phadoSelectedId = null;
let phadoFilterChi = '';

// ===== HẰNG SỐ BỐ CỤC =====
const NODE_WIDTH = 180;
const NODE_HEIGHT = 70;
const SPOUSE_WIDTH = 160;
const SPOUSE_HEIGHT = 60;
const COUPLE_GAP = 20;
const SPOUSE_STACK_GAP = 10;
const SIBLING_GAP = 30;
const LEVEL_GAP = 90;
const PADDING_X = 200;
const PADDING_Y = 60;

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
    .scaleExtent([0.05, 3])
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
    fitCayVaoKhung();
  });
}

function locChiPhado(chi, nutDuocChon) {
  phadoFilterChi = chi;
  phadoSelectedId = null;

  document.querySelectorAll('.thanh-cong-cu .nut-tool').forEach(b => b.classList.remove('active'));
  if (nutDuocChon) nutDuocChon.classList.add('active');

  const panel = document.getElementById('phado-panel');
  if (panel) panel.classList.add('an');

  if (phadoSvg && phadoZoom) {
    phadoSvg.call(phadoZoom.transform, d3.zoomIdentity);
  }

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
  return new Set([...toTien, ...conChau]);
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
      if (sk.ghi_chu) moTa += ' [' + sk.ghi_chu + ']';
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

// ============================================================
// TREE LAYOUT ĐỆ QUY (Reingold–Tilford rút gọn)
// ============================================================

function veCayPhado() {
  phadoG.selectAll('*').remove();

  const mapNguoi = locVaTaoMap();
  if (Object.keys(mapNguoi).length === 0) {
    console.warn('Phả đồ: Không có người nào để vẽ');
    return;
  }

  const rootId = xacDinhRootId(mapNguoi);
  if (!rootId) {
    console.warn('Phả đồ: Không xác định được root');
    return;
  }

  const visited = new Set();
  const tree = buildTree(rootId, mapNguoi, visited);
  if (!tree) return;

  tinhSubtreeWidth(tree);
  ganViTri(tree, 0, PADDING_Y);
  dichCanGiua(tree);
  veDuongNoi(tree);
  veNode(tree);

  setTimeout(fitCayVaoKhung, 500);

  console.log('Phả đồ: Đã vẽ', demSoNode(tree), 'node — root:', tree.nguoi.ho_ten);
}

function locVaTaoMap() {
  const mapNguoi = {};

  let dsNguoi = phadoData.nguoi.filter(n => n.doi <= 6);
  if (phadoFilterChi) {
    dsNguoi = dsNguoi.filter(n => n.chi === phadoFilterChi);
  }

  const idHoPham = new Set();
  dsNguoi.forEach(n => {
    if (n.ho_ten && n.ho_ten.trim().startsWith('Phạm')) {
      idHoPham.add(n.id);
    }
  });

  const idTrongDs = new Set(dsNguoi.map(n => n.id));
  const idVoChong = new Set();
  dsNguoi.forEach(n => {
    if (idHoPham.has(n.id) && Array.isArray(n.hon_nhan)) {
      n.hon_nhan.forEach(h => {
        if (h.vo_id && idTrongDs.has(h.vo_id)) {
          idVoChong.add(h.vo_id);
        }
      });
    }
  });

  dsNguoi.forEach(n => {
    if (idHoPham.has(n.id) || idVoChong.has(n.id)) {
      mapNguoi[n.id] = n;
    }
  });

  return mapNguoi;
}

function xacDinhRootId(mapNguoi) {
  if (!phadoFilterChi) {
    return mapNguoi['P1'] ? 'P1' : null;
  }

  const dsChi = Object.values(mapNguoi).filter(n => n.chi === phadoFilterChi);
  if (dsChi.length === 0) return null;

  const dsNamHoPham = dsChi.filter(n =>
    n.gioi_tinh === 'nam' && n.ho_ten && n.ho_ten.trim().startsWith('Phạm')
  );

  const dsUuTien = dsNamHoPham.length > 0 ? dsNamHoPham : dsChi;
  dsUuTien.sort((a, b) => (a.doi - b.doi) || a.id.localeCompare(b.id));
  return dsUuTien[0].id;
}

function buildTree(id, mapNguoi, visited) {
  if (visited.has(id) || !mapNguoi[id]) return null;
  visited.add(id);

  const nguoi = mapNguoi[id];

  const voChong = (nguoi.hon_nhan || [])
    .map(h => mapNguoi[h.vo_id])
    .filter(Boolean);
  voChong.forEach(vc => visited.add(vc.id));

  const conIdsSet = new Set();
  (nguoi.con_ids || []).forEach(cid => {
    if (mapNguoi[cid] && !visited.has(cid)) conIdsSet.add(cid);
  });
  Object.keys(mapNguoi).forEach(k => {
    const n = mapNguoi[k];
    if (n.cha_id === id && !visited.has(n.id)) conIdsSet.add(n.id);
  });

  const con = [...conIdsSet]
    .map(cid => buildTree(cid, mapNguoi, visited))
    .filter(Boolean);

  return {
    nguoi: nguoi,
    voChong: voChong,
    con: con,
    x: 0,
    y: 0,
    width: 0
  };
}

function tinhUnitWidth(node) {
  if (node.voChong.length === 0) return NODE_WIDTH;
  return NODE_WIDTH + COUPLE_GAP + SPOUSE_WIDTH;
}

function tinhUnitHeight(node) {
  const nVo = node.voChong.length;
  if (nVo === 0) return NODE_HEIGHT;
  const stackH = nVo * SPOUSE_HEIGHT + (nVo - 1) * SPOUSE_STACK_GAP;
  return Math.max(NODE_HEIGHT, stackH);
}

function tinhSubtreeWidth(node) {
  const unitW = tinhUnitWidth(node);

  if (node.con.length === 0) {
    node.width = unitW;
    return unitW;
  }

  let totalCon = 0;
  node.con.forEach((c, i) => {
    totalCon += tinhSubtreeWidth(c);
    if (i > 0) totalCon += SIBLING_GAP;
  });

  node.width = Math.max(unitW, totalCon);
  return node.width;
}

function ganViTri(node, centerX, y) {
  node.x = centerX;
  node.y = y;

  if (node.con.length === 0) return;

  let totalCon = 0;
  node.con.forEach((c, i) => {
    totalCon += c.width;
    if (i > 0) totalCon += SIBLING_GAP;
  });

  const yCon = y + tinhUnitHeight(node) + LEVEL_GAP;
  let curX = centerX - totalCon / 2;

  node.con.forEach(c => {
    const conCenter = curX + c.width / 2;
    ganViTri(c, conCenter, yCon);
    curX += c.width + SIBLING_GAP;
  });
}

function dichCanGiua(tree) {
  let minX = Infinity;
  function duyetMin(node) {
    const unitW = tinhUnitWidth(node);
    minX = Math.min(minX, node.x - unitW / 2);
    node.con.forEach(duyetMin);
  }
  duyetMin(tree);

  if (!isFinite(minX)) return;

  const offsetX = PADDING_X - minX;
  function duyetDich(node) {
    node.x += offsetX;
    node.con.forEach(duyetDich);
  }
  duyetDich(tree);
}

function veDuongNoi(tree) {
  const duongNoi = phadoG.append('g').attr('class', 'phado-duong-noi');

  function veChoNode(node) {
    const yStart = node.y + tinhUnitHeight(node);

    node.con.forEach(con => {
      const yEnd = con.y;
      const midY = yStart + (yEnd - yStart) / 2;

      const duongPath = `M ${node.x} ${yStart} L ${node.x} ${midY} L ${con.x} ${midY} L ${con.x} ${yEnd}`;

      duongNoi.append('path')
        .attr('d', duongPath)
        .attr('stroke', '#C9A961')
        .attr('stroke-width', 1.5)
        .attr('fill', 'none')
        .attr('opacity', 0.65);
    });

    node.con.forEach(veChoNode);
  }

  veChoNode(tree);
}

function veNode(tree) {
  const nhomNode = phadoG.append('g').attr('class', 'phado-nhom-node');

  function veMotNode(node) {
    const unitW = tinhUnitWidth(node);
    const leftX = node.x - unitW / 2;

    taoNodePhado(node.nguoi, leftX, node.y, nhomNode, 'chinh');

    if (node.voChong.length > 0) {
      const spouseX = leftX + NODE_WIDTH + COUPLE_GAP;
      node.voChong.forEach((vc, i) => {
        const vcY = node.y + i * (SPOUSE_HEIGHT + SPOUSE_STACK_GAP);
        taoNodePhado(vc, spouseX, vcY, nhomNode, 'vo-chong');
      });
    }

    node.con.forEach(veMotNode);
  }

  veMotNode(tree);
}

function taoNodePhado(nguoi, x, y, nhomCha, loai) {
  const isChinh = loai === 'chinh';
  const w = isChinh ? NODE_WIDTH : SPOUSE_WIDTH;
  const h = isChinh ? NODE_HEIGHT : SPOUSE_HEIGHT;
  const gioiTinh = nguoi.gioi_tinh === 'nu' ? 'nu' : 'nam';

  const nodeGroup = nhomCha.append('g')
    .attr('class', `phado-node phado-node-${loai} phado-node-${gioiTinh}`)
    .attr('transform', `translate(${x}, ${y})`)
    .attr('data-id', nguoi.id);

  nodeGroup.append('rect')
    .attr('width', w)
    .attr('height', h)
    .attr('rx', 8)
    .attr('ry', 8)
    .attr('cursor', 'pointer');

  const maxNameLen = isChinh ? 22 : 18;
  const displayName = (nguoi.ho_ten || '(Không rõ)');
  const nameText = displayName.length > maxNameLen
    ? displayName.substring(0, maxNameLen - 2) + '...'
    : displayName;

  nodeGroup.append('text')
    .attr('x', w / 2)
    .attr('y', isChinh ? 25 : 22)
    .attr('text-anchor', 'middle')
    .attr('font-family', 'Noto Serif, serif')
    .attr('font-size', isChinh ? '12px' : '11px')
    .attr('font-weight', 'bold')
    .attr('font-style', isChinh ? 'normal' : 'italic')
    .attr('cursor', 'pointer')
    .text(nameText);

  if (isChinh && nguoi.ten_chu) {
    const tenChu = nguoi.ten_chu.length > 24
      ? nguoi.ten_chu.substring(0, 22) + '...'
      : nguoi.ten_chu;
    nodeGroup.append('text')
      .attr('x', w / 2)
      .attr('y', 45)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Noto Serif, serif')
      .attr('font-size', '10px')
      .attr('font-style', 'italic')
      .attr('fill', '#999')
      .text(tenChu);
  }

  nodeGroup.append('text')
    .attr('x', w / 2)
    .attr('y', isChinh ? 62 : 50)
    .attr('text-anchor', 'middle')
    .attr('font-size', '9.5px')
    .attr('fill', '#C9A961')
    .text(`Đời ${nguoi.doi}`);

  nodeGroup.on('click', function(event) {
    event.stopPropagation();
    chonNodePhado(nguoi.id);
  });

  nodeGroup.on('mouseover', function() {
    if (phadoSelectedId !== nguoi.id && !d3.select(this).classed('truc-he')) {
      d3.select(this).select('rect').style('filter', 'brightness(0.95)');
    }
  });

  nodeGroup.on('mouseout', function() {
    d3.select(this).select('rect').style('filter', null);
  });

  return nodeGroup;
}

function demSoNode(node) {
  let count = 1 + node.voChong.length;
  node.con.forEach(c => count += demSoNode(c));
  return count;
}

// --- Zoom-fit toàn cây vào khung ---
function fitCayVaoKhung() {
  if (!phadoSvg || !phadoG || !phadoZoom) return;
  const svgNode = phadoSvg.node();
  if (!svgNode) return;

  let svgW = svgNode.clientWidth;
  let svgH = svgNode.clientHeight;

  if ((!svgW || !svgH) && svgNode.parentElement) {
    svgW = svgNode.parentElement.clientWidth;
    svgH = svgNode.parentElement.clientHeight;
  }

  if (!svgW || !svgH) {
    console.log('Phả đồ: SVG chưa có kích thước, thử lại sau 200ms...');
    setTimeout(fitCayVaoKhung, 200);
    return;
  }

  let bbox;
  try {
    bbox = phadoG.node().getBBox();
  } catch (e) {
    return;
  }
  if (!bbox || bbox.width === 0 || bbox.height === 0) {
    setTimeout(fitCayVaoKhung, 200);
    return;
  }

  const pad = 40;
  const scaleX = (svgW - pad * 2) / bbox.width;
  const scaleY = (svgH - pad * 2) / bbox.height;
  const scale = Math.min(scaleX, scaleY) * 0.95;

  const tx = (svgW - bbox.width * scale) / 2 - bbox.x * scale;
  const ty = (svgH - bbox.height * scale) / 2 - bbox.y * scale;

  console.log('Phả đồ: Zoom-fit →', {
    svgW, svgH,
    bboxW: Math.round(bbox.width),
    bboxH: Math.round(bbox.height),
    scale: scale.toFixed(3)
  });

  phadoSvg.transition().duration(500).call(
    phadoZoom.transform,
    d3.zoomIdentity.translate(tx, ty).scale(scale)
  );
}
