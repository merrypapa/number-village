import { chromium } from 'playwright';
import fs from 'fs';
const src = fs.readFileSync('원작표.jpg').toString('base64');
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const p = await b.newPage();
await p.setContent(`<img id="i" src="data:image/jpeg;base64,${src}">`);
await p.waitForFunction(()=>document.getElementById('i').complete);
const res = await p.evaluate(() => {
  const img = document.getElementById('i');
  const W = img.naturalWidth, H = img.naturalHeight;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, W, H).data;
  // 검은 격자선 찾기 — 세로선: 각 x열에서 어두운 픽셀 비율
  const dark = (x, y) => { const i = (y * W + x) * 4; return d[i] + d[i+1] + d[i+2] < 150; };
  const vx = [], hy = [];
  for (let x = 0; x < W; x++) { let c = 0; for (let y = 0; y < H; y += 2) if (dark(x, y)) c++; if (c > H / 2 * 0.6) vx.push(x); }
  for (let y = 0; y < H; y++) { let c = 0; for (let x = 0; x < W; x += 2) if (dark(x, y)) c++; if (c > W / 2 * 0.6) hy.push(y); }
  // 붙어 있는 선을 하나로
  const merge = a => { const out = []; for (const v of a) { if (out.length && v - out[out.length-1].end <= 2) out[out.length-1].end = v; else out.push({ start: v, end: v }); } return out; };
  const vl = merge(vx), hl = merge(hy);
  return { W, H, vl, hl };
});
console.log(res.W, res.H, 'v', res.vl.length, 'h', res.hl.length);
console.log(JSON.stringify(res.vl.map(l=>l.start)), JSON.stringify(res.hl.map(l=>l.start)));
fs.writeFileSync('grid.json', JSON.stringify(res));
await b.close();
