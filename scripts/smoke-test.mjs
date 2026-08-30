// ===========================================================
//  실행 검사 — 게임을 실제 브라우저로 띄워서 콘솔 에러가 0개인지 본다.
//  qa-runner 에이전트가 커밋 전에 부른다.
//
//    node scripts/smoke-test.mjs
//
//  ※ 게임 자체와는 아무 상관 없는 개발용 파일이다.
//    Playwright가 없는 컴퓨터에서는 조용히 건너뛴다 (실패 아님).
//    package.json 은 만들지 않는다 — 이 저장소의 규칙이다.
// ===========================================================
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const PORT = 8123;                       // 검사용 포트 (평소 8000과 겹치지 않게)
const WAIT_MS = 6000;                    // 게임이 뜰 때까지 기다리는 시간
const SHOT = 'scratch/smoke.png';        // 스크린샷 저장 위치

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.log('실행: 건너뜀(Playwright 없음) — 문법 검사만으로 판정하세요.');
  process.exit(0);
}

// 정적 서버 띄우기
const server = spawn('python3', ['-m', 'http.server', String(PORT)], { stdio: 'ignore' });
const stop = () => { try { server.kill(); } catch {} };
process.on('exit', stop);

await new Promise(r => setTimeout(r, 800));

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push(String(e)));
page.on('requestfailed', r => errors.push(`요청 실패: ${r.url()}`));

try {
  await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(WAIT_MS);

  // 캔버스가 실제로 뭔가 그렸는지 (검은 화면이 아닌지) 확인
  const drawn = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return { ok: false, why: '캔버스가 없음' };
    if (c.width < 10 || c.height < 10) return { ok: false, why: '캔버스 크기가 0' };
    return { ok: true, why: `${c.width}x${c.height}` };
  });

  mkdirSync('scratch', { recursive: true });
  await page.screenshot({ path: SHOT });

  console.log(`화면: ${drawn.ok ? '그려짐 ' + drawn.why : '문제 — ' + drawn.why}`);
  console.log(`콘솔 에러: ${errors.length}개`);
  errors.forEach(e => console.log('  - ' + e));
  console.log(`스크린샷: ${SHOT}`);
  console.log(`판정: ${errors.length === 0 && drawn.ok ? '합격' : '반려'}`);

  await browser.close();
  stop();
  process.exit(errors.length === 0 && drawn.ok ? 0 : 1);
} catch (e) {
  console.log('판정: 반려 — ' + e.message);
  await browser.close();
  stop();
  process.exit(1);
}
