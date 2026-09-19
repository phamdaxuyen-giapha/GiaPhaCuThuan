// Module Phả hệ — vẽ cây gia phả
console.log('Module Phả hệ đã sẵn sàng');

document.addEventListener('DOMContentLoaded', function() {
  // Nút chuyển dọc/ngang
  const nutDoc = document.getElementById('nut-doc');
  const nutNgang = document.getElementById('nut-ngang');
  if (nutDoc) nutDoc.addEventListener('click', () => {
    nutDoc.classList.add('active');
    if (nutNgang) nutNgang.classList.remove('active');
  });
  if (nutNgang) nutNgang.addEventListener('click', () => {
    nutNgang.classList.add('active');
    if (nutDoc) nutDoc.classList.remove('active');
  });
});