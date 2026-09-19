// Module Phả hệ — vẽ cây gia phả động
console.log('Module Phả hệ đang khởi động...');

// Biến giaphaData đã khai báo trong app.js — KHÔNG khai báo lại
let dangOcheDoDoc = true;
let nguoiDangChon = null;

document.addEventListener('DOMContentLoaded', async function() {
  // Đợi app.js tải xong gia phả
  let demCho = 0;
  while (!window.giaphaData && demCho < 50) {
    await new Promise(r => setTimeout(r, 100));
    demCho++;
  }

  if (!window.giaphaData) {
    console.error('Phả hệ: Không tìm thấy dữ liệu gia phả từ app.js');
    return;
  }

  console.log('Phả hệ: Đã nhận dữ liệu', window.giaphaData.nguoi.length, 'người');
  vePhaDo();

  // Nút Cây dọc
  const nutDoc = document.getElementById('nut-doc');
  if (nutDoc) {
    nutDoc.addEventListener('click', function() {
      dangOcheDoDoc = true;
      nutDoc.classList.add('active');
      const nutNgang = document.getElementById('nut-ngang');
      if (nutNgang) nutNgang.classList.remove('active');
      vePhaDo();
    });
  }

  // Nút Cây ngang
  const nutNgang = document.getElementById('nut-ngang');
  if (nutNgang) {
    nutNgang.addEventListener('click', function() {
      dangOcheDoDoc = false;
      nutNgang.classList.add('active');
      const nutDoc2 = document.getElementById('nut-doc');
      if (nutDoc2) nutDoc2.classList.remove('active');
      vePhaDo();
    });
  }

  // Nút Tô sáng trực hệ
  const nutTrucHe = document.getElementById('nut-truc-he');
  if (nutTrucHe) {
    nutTrucHe.addEventListener('click', function() {
      if (!nguoiDangChon) {
        alert('Vui lòng click vào một người trong phả đồ trước!');
        return;
      }
      toSangTrucHe(nguoiDangChon);
    });
  }

  // Nút Bỏ tô sáng
  const nutBoTrucHe = document.getElementById('nut-bo-truc-he');
  if (nutBoTrucHe) {
    nutBoTrucHe.addEventListener('click', function() {
      document.querySelectorAll('.node-nguoi').forEach(el => {
        el.classList.remove('truc-he', 'bang-he');
      });
    });
  }

  // Dropdown lọc chi
  const locChi = document.getElementById('loc-chi');
  if (locChi && window.giaphaData) {
    window.giaphaData.chi.forEach(chi => {
      const opt = document.createElement('option');
      opt.value = chi.ten;
      opt.textContent = chi.ten;
      locChi.appendChild(opt);
    });
    locChi.addEventListener('change', function() {
      const chiChon = this.value;
      if (!chiChon) {
        vePhaDo();
        return;
      }
      vePhaDoTheoChi(chiChon);
    });
  }
});

function vePhaDo() {
  const container = document.getElementById('pha-do');
  if (!container || !window.giaphaData) return;
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = dangOcheDoDoc ? 'pha-do-doc' : 'pha-do-ngang';

  const dsDoi = [...new Set(window.giaphaData.nguoi.map(n => n.doi))].sort((a,b) => a-b);
  dsDoi.forEach(doi => {
    const dsNguoiDoi = window.giaphaData.nguoi.filter(n => n.doi === doi);
    if (dsNguoiDoi.length === 0) return;

    const hangDoi = document.createElement('div');
    hangDoi.className = 'hang-doi';
    hangDoi.innerHTML = '<div class="nhan-doi">Đời ' + doi + '</div>';

    const hangNguoi = document.createElement('div');
    hangNguoi.className = 'hang-nguoi';

    dsNguoiDoi.forEach(nguoi => {
      const node = taoNodeNguoi(nguoi);
      hangNguoi.appendChild(node);
    });

    hangDoi.appendChild(hangNguoi);
    wrapper.appendChild(hangDoi);
  });

  container.appendChild(wrapper);
  console.log('Phả hệ: Đã vẽ', dsDoi.length, 'đời');
}

function taoNodeNguoi(nguoi) {
  const node = document.createElement('div');
  node.className = 'node-nguoi';
  node.dataset.id = nguoi.id;
  node.dataset.chaId = nguoi.cha_id || '';
  node.dataset.meId = nguoi.me_id || '';

  const gioiTinh = nguoi.gioi_tinh === 'nam' ? 'nam' : 'nu';
  node.classList.add(gioiTinh);

  const laChuaRo = (nguoi.ten_chu || '').includes('?') || (nguoi.ho_ten || '').includes('?');

  node.innerHTML = `
    <div class="node-ten ${laChuaRo ? 'chua-ro' : ''}">${nguoi.ho_ten || '(Không rõ)'}</div>
    <div class="node-phu">Đời ${nguoi.doi} — ${nguoi.chi || ''}</div>
    ${nguoi.ten_chu ? '<div class="node-ten-chu">' + nguoi.ten_chu + '</div>' : ''}
  `;

  node.addEventListener('click', function() {
    nguoiDangChon = nguoi;
    document.querySelectorAll('.node-nguoi').forEach(el => el.classList.remove('dang-chon'));
    node.classList.add('dang-chon');
  });

  return node;
}

function toSangTrucHe(nguoi) {
  document.querySelectorAll('.node-nguoi').forEach(el => {
    el.classList.remove('truc-he', 'bang-he');
  });

  const trucHe = new Set();

  // Tìm tổ tiên
  let hienTai = nguoi;
  while (hienTai) {
    trucHe.add(hienTai.id);
    if (hienTai.cha_id) {
      hienTai = window.giaphaData.nguoi.find(n => n.id === hienTai.cha_id);
    } else {
      hienTai = null;
    }
  }

  // Tìm hậu duệ
  function timHauDue(id) {
    const conCai = window.giaphaData.nguoi.filter(n => n.cha_id === id || n.me_id === id);
    conCai.forEach(con => {
      if (!trucHe.has(con.id)) {
        trucHe.add(con.id);
        timHauDue(con.id);
      }
    });
  }
  timHauDue(nguoi.id);

  document.querySelectorAll('.node-nguoi').forEach(el => {
    if (trucHe.has(el.dataset.id)) {
      el.classList.add('truc-he');
    } else {
      el.classList.add('bang-he');
    }
  });

  console.log('Đã tô sáng trực hệ của', nguoi.ho_ten, '— tổng', trucHe.size, 'người');
}

function vePhaDoTheoChi(chiChon) {
  const container = document.getElementById('pha-do');
  if (!container || !window.giaphaData) return;
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = dangOcheDoDoc ? 'pha-do-doc' : 'pha-do-ngang';

  const dsNguoiChi = window.giaphaData.nguoi.filter(n => n.chi === chiChon);
  const dsDoi = [...new Set(dsNguoiChi.map(n => n.doi))].sort((a,b) => a-b);

  dsDoi.forEach(doi => {
    const dsNguoiDoi = dsNguoiChi.filter(n => n.doi === doi);
    if (dsNguoiDoi.length === 0) return;

    const hangDoi = document.createElement('div');
    hangDoi.className = 'hang-doi';
    hangDoi.innerHTML = '<div class="nhan-doi">Đời ' + doi + '</div>';

    const hangNguoi = document.createElement('div');
    hangNguoi.className = 'hang-nguoi';

    dsNguoiDoi.forEach(nguoi => {
      const node = taoNodeNguoi(nguoi);
      hangNguoi.appendChild(node);
    });

    hangDoi.appendChild(hangNguoi);
    wrapper.appendChild(hangDoi);
  });

  container.appendChild(wrapper);
  console.log('Đã lọc theo chi:', chiChon, '—', dsNguoiChi.length, 'người');
}