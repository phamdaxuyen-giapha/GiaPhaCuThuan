// Module xử lý ảnh Ngoại phả — cắt 2/3, nén WebP 82%
console.log('Module xử lý ảnh đã sẵn sàng');

const ANH_TOI_DA = 1200;
const CHAT_LUONG = 0.82;

function catVaNenAnh(file, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let w = img.width, h = img.height;
      const tyLe = w / h;
      if (tyLe > 2/3) { w = h * 2/3; } else { h = w * 3/2; }
      if (w > ANH_TOI_DA) {
        const scale = ANH_TOI_DA / w;
        w *= scale; h *= scale;
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(function(blob) {
        callback(blob);
      }, 'image/webp', CHAT_LUONG);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}