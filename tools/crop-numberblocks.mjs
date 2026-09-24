// 원작 캐릭터 표(10×10)를 100칸으로 잘라 assets/numberblocks/nbN.png 로 저장한다.
// 쓰는 법: 먼저 find-grid.mjs 로 격자선(grid.json)을 찾고, 이 파일을 node 로 돌린다 (playwright 필요).
import { chromium } from 'playwright';
import fs from 'fs';
const src = fs.readFileSync('원작표.jpg').toString('base64');
const grid = JSON.parse(fs.readFileSync('grid.json'));
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const p = await b.newPage();
await p.setContent(`<img id="i" src="data:image/jpeg;base64,${src}">`);
await p.waitForFunction(()=>document.getElementById('i').complete);
const out = await p.evaluate((grid) => {
  const img = document.getElementById('i');
  const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
  const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
  const vs = grid.vl.map(l => l.start), hs = grid.hl.map(l => l.start);
  const result = [];
  const TOP_CUT = 12;   // 칸 위쪽 숫자 라벨을 잘라낸다
  for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
    const n = r * 10 + c + 1;
    const x0 = vs[c] + 4, x1 = vs[c + 1] - 3, y0 = hs[r] + 4 + TOP_CUT, y1 = hs[r + 1] - 3;
    const w = x1 - x0, h = y1 - y0;
    const im = g.getImageData(x0, y0, w, h);
    const d = im.data;
    // 흰 배경 → 투명. ★ 가장자리에서 이어진 흰 부분만 지운다 (flood fill).
    //   그래야 10·20의 하얀 블록 속은 그대로 남는다
    const isWhite = (i) => { const R = d[i], G = d[i+1], B = d[i+2]; return Math.min(R, G, B) > 232 && Math.max(R, G, B) - Math.min(R, G, B) < 18; };
    const seen = new Uint8Array(w * h);
    const stack = [];
    for (let x = 0; x < w; x++) { stack.push(x, (h - 1) * w + x); }
    for (let y = 0; y < h; y++) { stack.push(y * w, y * w + w - 1); }
    while (stack.length) {
      const k = stack.pop();
      if (seen[k]) continue;
      seen[k] = 1;
      if (!isWhite(k * 4)) continue;
      d[k * 4 + 3] = 0;
      const x = k % w, y = (k - x) / w;
      if (x > 0) stack.push(k - 1); if (x < w - 1) stack.push(k + 1);
      if (y > 0) stack.push(k - w); if (y < h - 1) stack.push(k + w);
    }
    // 지운 자리 바로 옆의 연한 픽셀은 반투명 (가장자리가 부드럽게)
    for (let k = 0; k < w * h; k++) {
      if (d[k * 4 + 3] === 0) continue;
      const x = k % w, y = (k - x) / w;
      const nb = [k - 1, k + 1, k - w, k + w].some(j => j >= 0 && j < w * h && d[j * 4 + 3] === 0);
      const mn = Math.min(d[k*4], d[k*4+1], d[k*4+2]);
      if (nb && mn > 200) d[k * 4 + 3] = Math.round(255 * Math.min(1, (245 - mn) / 45));
    }
    // 위쪽에 남은 작은 숫자 라벨 지우기 — 맨 윗줄에 닿은 작은 덩어리(300픽셀 미만)는 라벨이다
    {
      const vis = new Uint8Array(w * h);
      for (let x = 0; x < w; x++) for (let yy = 0; yy < 6; yy++) {
        const start = yy * w + x;
        if (vis[start] || d[start * 4 + 3] === 0) continue;
        const comp = []; const st = [start];
        while (st.length) {
          const k = st.pop(); if (vis[k]) continue; vis[k] = 1;
          if (d[k * 4 + 3] === 0) continue;
          comp.push(k);
          const cx = k % w, cy = (k - cx) / w;
          if (cx > 0) st.push(k - 1); if (cx < w - 1) st.push(k + 1);
          if (cy > 0) st.push(k - w); if (cy < h - 1) st.push(k + w);
        }
        if (comp.length && comp.length < 300) for (const k of comp) d[k * 4 + 3] = 0;
      }
    }
    // 내용이 있는 곳만 남긴다 (bbox)
    let bx0 = w, by0 = h, bx1 = 0, by1 = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) {
      if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y;
    }
    const cw = bx1 - bx0 + 3, ch = by1 - by0 + 3;
    const oc = document.createElement('canvas'); oc.width = cw; oc.height = ch;
    const og = oc.getContext('2d');
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
    tmp.getContext('2d').putImageData(im, 0, 0);
    og.drawImage(tmp, bx0 - 1, by0 - 1, cw, ch, 0, 0, cw, ch);
    result.push({ n, w: cw, h: ch, data: oc.toDataURL('image/png') });
  }
  return result;
}, grid);
const meta = {};
for (const r of out) {
  fs.writeFileSync(`../assets/numberblocks/nb${r.n}.png`, Buffer.from(r.data.split(',')[1], 'base64'));
  meta[r.n] = [r.w, r.h];
}
fs.writeFileSync('meta.json', JSON.stringify(meta));
console.log(Object.entries(meta).slice(0,20).map(([n,[w,h]])=>`${n}:${w}x${h}`).join(' '));
// 확인용 몽타주
const p2 = await b.newPage({ viewport:{width:1000,height:420} });
const cells = [1,2,3,7,16,20,31,52,87,94,100].map(n=>`<div style="display:inline-block;margin:6px;text-align:center;background:#dfe;padding:4px"><img src="data:image/png;base64,${fs.readFileSync(`../assets/numberblocks/nb${n}.png`).toString('base64')}" style="height:150px"><br>${n}</div>`).join('');
await p2.setContent(`<body style="margin:0;background:#8cf">${cells}</body>`);
await p2.screenshot({ path:'montage.png' });
await b.close();
