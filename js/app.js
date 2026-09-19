// Gia phả họ Phạm Đà Xuyên — Module chính
window.giaphaData = null;
let danhSachGhiChu = [];

document.addEventListener('DOMContentLoaded', async function() {
  // ============ CHUYỂN TAB ============
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const tabId = this.dataset.tab;
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      const tab = document.getElementById('tab-' + tabId);
      if (tab) tab.classList.add('active');
    });
  });

  // ============ TẢI DỮ LIỆU GIA PHẢ ============
  try {
    const response = await fetch('data/giapha.json');
    giaphaData = await response.json();
    console.log('Đã tải gia phả:', giaphaData.nguoi.length, 'người');
    hienThiDanhSachDoi();
    hienThiDanhSachChi();
    hienThiNghiVan();
    dienDropdownNguoi();
  } catch (err) {
    console.error('Lỗi tải gia phả:', err);
  }

  // ============ TÌM KIẾM ============
  const oTimKiem = document.getElementById('o-tim-kiem');
  if (oTimKiem) {
    oTimKiem.addEventListener('input', function() {
      const tuKhoa = this.value.toLowerCase().trim();
      if (!tuKhoa) {
        document.getElementById('ds-nguoi').innerHTML = '';
        return;
      }
      const ketQua = giaphaData.nguoi.filter(n => {
        const ten = (n.ho_ten || '').toLowerCase();
        const chu = (n.ten_chu || '').toLowerCase();
        const hieu = (n.ten_hieu || '').toLowerCase();
        return ten.includes(tuKhoa) || chu.includes(tuKhoa) || hieu.includes(tuKhoa);
      });
      hienThiKetQua(ketQua);
    });
  }

  // ============ KHỞI TẢI GHI CHÚ TỪ LOCALSTORAGE ============
  taiGhiChuTuLocal();
  hienThiDanhSachGhiChu();
  ganSuKienFormGhiChu();
});

// ============ HIỂN THỊ DANH SÁCH ĐỜI ============
function hienThiDanhSachDoi() {
  const container = document.getElementById('danh-sach-doi');
  if (!container) return;
  const dsDoi = [...new Set(giaphaData.nguoi.map(n => n.doi))].sort((a,b) => a-b);
  dsDoi.forEach(doi => {
    const btn = document.createElement('button');
    btn.textContent = 'Đời thứ ' + doi;
    btn.dataset.doi = doi;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.danh-sach-doi button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const dsNguoiDoi = giaphaData.nguoi.filter(n => n.doi === doi);
      hienThiKetQua(dsNguoiDoi);
    });
    container.appendChild(btn);
  });
}

// ============ HIỂN THỊ DANH SÁCH CHI ============
function hienThiDanhSachChi() {
  const container = document.getElementById('danh-sach-chi');
  if (!container) return;
  giaphaData.chi.forEach(chi => {
    const btn = document.createElement('button');
    btn.textContent = chi.ten;
    btn.dataset.chi = chi.id;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.danh-sach-chi button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const dsChi = giaphaData.nguoi.filter(n => n.chi === chi.ten);
      hienThiKetQua(dsChi);
    });
    container.appendChild(btn);
  });
}

// ============ HIỂN THỊ KẾT QUẢ ============
function hienThiKetQua(dsNguoi) {
  const container = document.getElementById('ds-nguoi');
  if (!container) return;
  container.innerHTML = '';
  if (dsNguoi.length === 0) {
    container.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#888;font-style:italic;">Không tìm thấy ai</p>';
    return;
  }
  dsNguoi.forEach(nguoi => {
    const the = document.createElement('div');
    the.className = 'the-nguoi';
    const tenHienThi = nguoi.ho_ten || '(Không rõ tên)';
    const laChuaRo = (nguoi.ten_chu || '').includes('?') || (nguoi.ho_ten || '').includes('?');
    the.innerHTML = `
      <div class="ten ${laChuaRo ? 'chua-ro' : ''}">${tenHienThi}${laChuaRo ? ' <span style="font-size:9pt;">(?)</span>' : ''}</div>
      <div class="phu"><span class="doi">Đời ${nguoi.doi}</span>${nguoi.chi || ''}</div>
      ${nguoi.ten_chu ? '<div class="phu">Tên chữ: ' + nguoi.ten_chu + '</div>' : ''}
      ${nguoi.ten_hieu ? '<div class="phu">Tên hiệu: ' + nguoi.ten_hieu + '</div>' : ''}
    `;
    the.addEventListener('click', () => hienThiChiTiet(nguoi));
    container.appendChild(the);
  });
}

// ============ HIỂN THỊ CHI TIẾT NGƯỜI ============
function hienThiChiTiet(nguoi) {
  const panel = document.getElementById('panel-chi-tiet');
  if (!panel) return;
  let html = '<button onclick="dongPanel()" style="float:right;border:none;background:none;font-size:20pt;cursor:pointer;">×</button>';
  html += '<h2 style="color:#E23B3A;margin-bottom:16px;">' + (nguoi.ho_ten || '(Không rõ tên)') + '</h2>';
  html += '<table style="width:100%;border-collapse:collapse;">';
  const themDong = (nhan, gt) => {
    if (gt) html += '<tr><td style="padding:6px 0;font-weight:700;width:40%;vertical-align:top;">' + nhan + '</td><td style="padding:6px 0;">' + gt + '</td></tr>';
  };
  themDong('Đời', nguoi.doi);
  themDong('Chi', nguoi.chi);
  themDong('Tên chữ', nguoi.ten_chu);
  themDong('Tên hiệu', nguoi.ten_hieu);
  themDong('Tên hủy', nguoi.ten_huy);
  themDong('Giới tính', nguoi.gioi_tinh === 'nam' ? 'Nam' : 'Nữ');
  html += '</table>';

  if (nguoi.nguyen_van) {
    html += '<h3 style="color:#7A6320;margin:20px 0 10px;font-style:italic;">Nguyên văn gia phả</h3>';
    html += '<p style="text-align:justify;line-height:1.7;">' + nguoi.nguyen_van + '</p>';
  }

  if (nguoi.su_kien && nguoi.su_kien.length > 0) {
    html += '<h3 style="color:#7A6320;margin:20px 0 10px;font-style:italic;">Sự kiện</h3>';
    html += '<ul style="padding-left:20px;">';
    nguoi.su_kien.forEach(sk => {
      let moTa = '<strong>' + sk.loai + '</strong>: ';
      if (sk.ngay_am) moTa += sk.ngay_am;
      if (sk.ngay_duong) moTa += ' (' + sk.ngay_duong + ')';
      if (sk.gio) moTa += ' giờ ' + sk.gio;
      if (sk.dia_diem) moTa += ' — ' + sk.dia_diem;
      if (sk.mo_ta) moTa += ' — ' + sk.mo_ta;
      if (sk.ghi_chu) moTa += ' <em>(' + sk.ghi_chu + ')</em>';
      html += '<li>' + moTa + '</li>';
    });
    html += '</ul>';
  }

  // Hiển thị ghi chú liên quan đến người này
  const gcLienQuan = danhSachGhiChu.filter(gc => gc.nguoi_id === nguoi.id);
  if (gcLienQuan.length > 0) {
    html += '<h3 style="color:#7A6320;margin:20px 0 10px;font-style:italic;">Ghi chú bổ sung</h3>';
    gcLienQuan.forEach(gc => {
      html += '<div style="background:#FFF8F0;padding:12px;border-left:3px solid #E23B3A;margin-bottom:8px;border-radius:4px;">';
      html += '<div style="font-weight:700;color:#E23B3A;">' + (gc.loai || 'Ghi chú') + '</div>';
      html += '<div>' + gc.noidung + '</div>';
      html += '<div style="font-size:10pt;color:#888;font-style:italic;margin-top:4px;">' + (gc.nguoi_de_xuat || '') + ' — ' + (gc.ngay || '') + '</div>';
      html += '</div>';
    });
  }

  if (nguoi.ghi_chu) {
    html += '<div style="background:#FAF6EC;padding:12px;border-left:3px solid #7A6320;margin-top:20px;font-style:italic;">' + nguoi.ghi_chu + '</div>';
  }

  panel.innerHTML = html;
  panel.classList.remove('an');
}

function dongPanel() {
  const panel = document.getElementById('panel-chi-tiet');
  if (panel) panel.classList.add('an');
}

// ============ HIỂN THỊ NGHI VẤN ============
function hienThiNghiVan() {
  const container = document.getElementById('ds-nghi-van');
  if (!container || !giaphaData) return;
  const nghiVan = giaphaData.nguoi.filter(n => n.ghi_chu && (n.ghi_chu.includes('Nghi vấn') || n.ghi_chu.includes('?')));
  if (nghiVan.length === 0) {
    container.innerHTML = '<p style="color:#888;font-style:italic;">Chưa có nghi vấn nào.</p>';
    return;
  }
  nghiVan.forEach(n => {
    const div = document.createElement('div');
    div.style.cssText = 'background:#FFF8F0;padding:14px;border-left:4px solid #E23B3A;margin-bottom:12px;border-radius:4px;';
    div.innerHTML = '<strong style="color:#E23B3A;">' + (n.ho_ten || '(Không rõ)') + '</strong> (Đời ' + n.doi + ')<br>' + n.ghi_chu;
    container.appendChild(div);
  });
}
// ============ FORM GHI CHÚ ============
function ganSuKienFormGhiChu() {
  const nutLuu = document.getElementById('nut-luu-ghichu');
  const nutXuat = document.getElementById('nut-xuat-ghichu');
  const nutXoaHet = document.getElementById('nut-xoa-het-ghichu');

  if (nutLuu) nutLuu.addEventListener('click', luuGhiChu);
  if (nutXuat) nutXuat.addEventListener('click', xuatFileGhiChu);
  if (nutXoaHet) nutXoaHet.addEventListener('click', xoaHetGhiChu);
}

function dienDropdownNguoi() {
  const select = document.getElementById('gc-nguoi');
  if (!select || !giaphaData) return;
  select.innerHTML = '<option value="">— Chọn người —</option>';
  const dsSapXep = [...giaphaData.nguoi].sort((a, b) => {
    if (a.doi !== b.doi) return a.doi - b.doi;
    return (a.ho_ten || '').localeCompare(b.ho_ten || '');
  });
  dsSapXep.forEach(n => {
    const opt = document.createElement('option');
    opt.value = n.id;
    opt.textContent = 'Đời ' + n.doi + ' — ' + (n.ho_ten || '(Không rõ)') + (n.ten_chu ? ' (' + n.ten_chu + ')' : '');
    select.appendChild(opt);
  });
}

function luuGhiChu() {
  const nguoiId = document.getElementById('gc-nguoi').value;
  const loai = document.getElementById('gc-loai').value;
  const noidung = document.getElementById('gc-noidung').value.trim();
  const nguoiDeXuat = document.getElementById('gc-nguoidexuat').value.trim();

  if (!nguoiId) {
    alert('Vui lòng chọn người liên quan!');
    return;
  }
  if (!noidung) {
    alert('Vui lòng nhập nội dung ghi chú!');
    return;
  }

  const nguoi = giaphaData.nguoi.find(n => n.id === nguoiId);
  const ghiChuMoi = {
    id: 'gc-' + Date.now(),
    nguoi_id: nguoiId,
    nguoi_ten: nguoi ? nguoi.ho_ten : '(Không rõ)',
    doi: nguoi ? nguoi.doi : null,
    loai: tenLoaiGhiChu(loai),
    loai_code: loai,
    noidung: noidung,
    nguoi_de_xuat: nguoiDeXuat || '(Không ghi tên)',
    ngay: new Date().toLocaleDateString('vi-VN')
  };

  danhSachGhiChu.push(ghiChuMoi);
  luuGhiChuVaoLocal();
  hienThiDanhSachGhiChu();

  document.getElementById('gc-nguoi').value = '';
  document.getElementById('gc-noidung').value = '';
  document.getElementById('gc-nguoidexuat').value = '';

  alert('Đã lưu ghi chú!');
}

function tenLoaiGhiChu(code) {
  const map = {
    'sua-chinh-ta': 'Sửa chính tả',
    'nghi-van': 'Nghi vấn cần kiểm chứng',
    'bo-sung': 'Bổ sung thông tin',
    'khac': 'Khác'
  };
  return map[code] || code;
}

function hienThiDanhSachGhiChu() {
  const container = document.getElementById('ds-ghi-chu');
  if (!container) return;
  if (danhSachGhiChu.length === 0) {
    container.innerHTML = '<p style="color:#888;font-style:italic;margin-top:16px;">Chưa có ghi chú nào. Hãy thêm ghi chú đầu tiên ở form trên.</p>';
    return;
  }
  container.innerHTML = '';
  const dsSapXep = [...danhSachGhiChu].reverse();
  dsSapXep.forEach(gc => {
    const div = document.createElement('div');
    div.className = 'the-ghi-chu';
    div.innerHTML = `
      <button class="tgc-xoa" onclick="xoaMotGhiChu('${gc.id}')" title="Xóa ghi chú này">×</button>
      <div class="tgc-header">
        <div class="tgc-nguoi">${gc.nguoi_ten}${gc.doi ? ' (Đời ' + gc.doi + ')' : ''}</div>
        <span class="tgc-loai">${gc.loai}</span>
      </div>
      <div class="tgc-noidung">${gc.noidung}</div>
      <div class="tgc-meta">${gc.nguoi_de_xuat} — ${gc.ngay}</div>
    `;
    container.appendChild(div);
  });
}

function xoaMotGhiChu(id) {
  if (!confirm('Bạn có chắc muốn xóa ghi chú này?')) return;
  danhSachGhiChu = danhSachGhiChu.filter(gc => gc.id !== id);
  luuGhiChuVaoLocal();
  hienThiDanhSachGhiChu();
}

function xoaHetGhiChu() {
  if (danhSachGhiChu.length === 0) {
    alert('Không có ghi chú nào để xóa.');
    return;
  }
  if (!confirm('Bạn có chắc muốn xóa TẤT CẢ ' + danhSachGhiChu.length + ' ghi chú? Hành động này không thể hoàn tác!')) return;
  danhSachGhiChu = [];
  luuGhiChuVaoLocal();
  hienThiDanhSachGhiChu();
  alert('Đã xóa tất cả ghi chú.');
}

function luuGhiChuVaoLocal() {
  try {
    localStorage.setItem('giapha_chuthich', JSON.stringify(danhSachGhiChu));
  } catch (err) {
    console.error('Lỗi lưu localStorage:', err);
  }
}

function taiGhiChuTuLocal() {
  try {
    const duLieu = localStorage.getItem('giapha_chuthich');
    if (duLieu) {
      danhSachGhiChu = JSON.parse(duLieu);
      console.log('Đã tải', danhSachGhiChu.length, 'ghi chú từ localStorage');
    }
  } catch (err) {
    console.error('Lỗi tải localStorage:', err);
    danhSachGhiChu = [];
  }
}

function xuatFileGhiChu() {
  if (danhSachGhiChu.length === 0) {
    alert('Không có ghi chú nào để xuất.');
    return;
  }
  const duLieu = {
    metadata: {
      ten: 'Ghi chú bổ sung — Gia phả họ Phạm Đà Xuyên',
      ngay_xuat: new Date().toLocaleString('vi-VN'),
      tong_so: danhSachGhiChu.length
    },
    ghi_chu: danhSachGhiChu
  };
  const json = JSON.stringify(duLieu, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chuthich.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert('Đã xuất file chuthich.json! Bạn có thể upload lên GitHub để mọi người cùng thấy.');
}