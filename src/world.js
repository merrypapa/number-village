// ===========================================================
//  마을 만들기 — 바닥, 성, 집, 나무, 분수, 놀이터
//  부딪히는 물건(장애물)도 여기서 같이 등록한다.
// ===========================================================
import * as THREE from 'three';
import { buildSky } from './sky.js';
import { buildPlayground } from './playground.js';
import { buildStable, makeHorseRide } from './horse.js';
import { createCollider } from './collide.js';
import { makeMartBuilding, makeMartCarts, makeArtHouseBuilding,
         makeRuhaCastle, makeMomCastle, makeDadCastle,
         makeSkyBridgeHint } from './village-buildings.js';
import { buildRuhaCastle } from './ruha-castle.js';
import { buildMomCastle } from './mom-castle.js';
import { buildDadCastle } from './dad-castle.js';
import { buildMart } from './mart.js';
import { HOUSES, buildHouse } from './houses.js';
import { buildArtHouse } from './art-house.js';
import { makeSign } from './mart-props.js';
//  🏡 집·성·나무·분수 모양은 src/village-props.js로 옮겼다 (world.js가 너무 길어져서)
import { M, makeHouse, makeCastle, makeTree, makeFountain,
         makeCastleEntrance } from './village-props.js';
//  🗺 무엇이 어디에 서 있는지는 src/village-sites.js 한 곳에 모아뒀다
//    (마을 배치를 바꾸려면 그 파일의 숫자만 고치면 된다)
import {
  WORLD_RADIUS, WORLD_BOUNDS, CASTLE, RUHA_SITE, MOM_SITE, DAD_SITE,
  MART, ART, HOME, PLAYGROUND, STABLE, PLAZA_HORSE,
  FRIEND_ANGLES, FRIEND_DIST, HOUSE_DOOR,
} from './village-sites.js';

export { WORLD_RADIUS };

// -----------------------------------------------------------
//  부딪히기(충돌)는 src/collide.js로 옮겼다.
//  성 안·마트·집도 똑같은 것을 쓰기 때문이다.
//  예전처럼 world.js에서 가져다 쓰던 파일이 있어서 그대로 다시 내보낸다.
// -----------------------------------------------------------
export { createCollider };

// -----------------------------------------------------------
//  마을 전체 만들기
// -----------------------------------------------------------
/** 마을을 만들어 scene에 추가한다. 스폰 위치와 부딪힘 함수를 돌려준다. */
export function buildWorld(scene) {
  const obstacles = [];        // 부딪히는 물건 목록
  const reserved = [];         // 나무를 심으면 안 되는 자리
  let ruhaTick = null;         // 루하성 문 위의 별을 돌리는 함수
  let momTick = null;          // 엄마성 꼭대기 하트를 돌리는 함수
  let dadTick = null;          // 아빠성 지붕 바람개비를 돌리는 함수

  // 바닥
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(WORLD_RADIUS + 8, 48), M.grass
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // 중앙 광장(길)
  const PLAZA_R = 26;
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(PLAZA_R, 40), M.path);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.02;
  plaza.receiveShadow = true;
  scene.add(plaza);

  // 🛣 광장에서 큰 건물까지 이어지는 길 — 마을이 넓어져서 길이 있어야 안 헤맨다
  //   길 위에는 나무를 심지 않는다 (reserved에 같이 넣는다)
  function road(toX, toZ, width = 9) {
    const len = Math.hypot(toX, toZ) - PLAZA_R + 6;
    if (len <= 0) return;
    const yaw = Math.atan2(toX, toZ);
    const mid = (Math.hypot(toX, toZ) + PLAZA_R - 6) / 2;
    const r = new THREE.Mesh(new THREE.PlaneGeometry(width, len), M.path);
    r.rotation.x = -Math.PI / 2;
    r.rotation.z = -yaw;               // 바닥판이라 z축으로 돌린다
    r.position.set(Math.sin(yaw) * mid, 0.015, Math.cos(yaw) * mid);
    r.receiveShadow = true;
    scene.add(r);
    //  길을 따라 나무를 비운다 (몇 군데만 찍어서 넣으면 충분하다)
    for (let u = 0.15; u < 1; u += 0.2) {
      const d = PLAZA_R - 6 + len * u;
      reserved.push({ x: Math.sin(yaw) * d, z: Math.cos(yaw) * d, r: width * 0.8 });
    }
  }

  // 분수
  scene.add(makeFountain());
  obstacles.push({ x: 0, z: 0, r: 4.2 });
  reserved.push({ x: 0, z: 0, r: 14 });

  // 🏰 인하성 (북쪽) — 탑까지 덮는 네모로 막는다
  const castle = makeCastle();
  castle.position.set(CASTLE.x, 0, CASTLE.z);
  scene.add(castle);
  obstacles.push({ x: CASTLE.x, z: CASTLE.z, hw: 13.5, hd: 10.5 });
  reserved.push({ x: CASTLE.x, z: CASTLE.z, r: 22 });

  // 🌙 루하성 (북동쪽) — 마을 정문으로도 가고, 인하성 2층 징검다리로도 간다
  const ruha = makeRuhaCastle();
  ruha.position.set(RUHA_SITE.x, 0, RUHA_SITE.z);
  scene.add(ruha);
  obstacles.push({ x: RUHA_SITE.x, z: RUHA_SITE.z, hw: RUHA_SITE.hw, hd: RUHA_SITE.hd });
  reserved.push({ x: RUHA_SITE.x, z: RUHA_SITE.z, r: 24 });
  reserved.push({ x: RUHA_SITE.x, z: RUHA_SITE.doorZ + 8, r: 13 });
  reserved.push({ x: RUHA_SITE.x, z: RUHA_SITE.doorZ + 18, r: 12 });
  if (ruha.userData.tick) ruhaTick = ruha.userData.tick;

  // 💗 엄마성 (북서쪽) — 10층짜리 키즈카페 성
  const mom = makeMomCastle();
  mom.position.set(MOM_SITE.x, 0, MOM_SITE.z);
  scene.add(mom);
  obstacles.push({ x: MOM_SITE.x, z: MOM_SITE.z, hw: MOM_SITE.hw, hd: MOM_SITE.hd });
  reserved.push({ x: MOM_SITE.x, z: MOM_SITE.z, r: 26 });
  //  ★ 문 앞 길에는 나무를 심지 않는다 (나무가 문과 카메라를 가린다)
  //  ★ 문에서 나오면 카메라가 뒤(문 앞 길)에 선다. 그 길을 넉넉히 비워둔다
  reserved.push({ x: MOM_SITE.x, z: MOM_SITE.doorZ + 8, r: 13 });
  reserved.push({ x: MOM_SITE.x, z: MOM_SITE.doorZ + 18, r: 12 });
  if (mom.userData.tick) momTick = mom.userData.tick;

  // 🛠 아빠성 (서쪽) — 2층짜리 뚝딱 공작소
  const dad = makeDadCastle();
  dad.position.set(DAD_SITE.x, 0, DAD_SITE.z);
  scene.add(dad);
  obstacles.push({ x: DAD_SITE.x, z: DAD_SITE.z, hw: DAD_SITE.hw, hd: DAD_SITE.hd });
  reserved.push({ x: DAD_SITE.x, z: DAD_SITE.z, r: 24 });
  reserved.push({ x: DAD_SITE.x, z: DAD_SITE.doorZ + 8, r: 13 });   // 문 앞 길
  reserved.push({ x: DAD_SITE.x, z: DAD_SITE.doorZ + 18, r: 12 });
  if (dad.userData.tick) dadTick = dad.userData.tick;

  // ☁️ 두 성 사이에 걸린 구름 징검다리 (마을에서 올려다보면 보이는 장식)
  scene.add(makeSkyBridgeHint(CASTLE.x + 12, CASTLE.z + 2,
                              RUHA_SITE.x - 12, RUHA_SITE.z + 2));

  // 두 성 이름표
  const inhaSign = makeSign('인하성', 12, 2.2, '#ff7ab0');
  inhaSign.position.set(CASTLE.x, 14.5, CASTLE.z + 7.4);
  scene.add(inhaSign);
  const ruhaSign = makeSign('루하성', 12, 2.2, '#4a44a8');
  ruhaSign.position.set(RUHA_SITE.x, 14.5, RUHA_SITE.z + 6.9);
  scene.add(ruhaSign);
  const momSign = makeSign('엄마성', 12, 2.2, '#ff6fa5');
  momSign.position.set(MOM_SITE.x, 42.0, MOM_SITE.z + 6.4);   // 10층 탑이라 높이 단다
  scene.add(momSign);
  const dadSign = makeSign('아빠성', 12, 2.2, '#8b5a3c');
  dadSign.position.set(DAD_SITE.x, 12.6, DAD_SITE.z + 7.6);   // 2층 성이라 지붕 밑에 단다
  scene.add(dadSign);

  // 성 입구 (융단 + 등불) — 여기 서면 성 안으로 들어간다
  scene.add(makeCastleEntrance(CASTLE.doorZ));
  for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) {
    obstacles.push({ x: sx * 5, z: CASTLE.doorZ + 1 + i * 6, r: 0.7 });   // 등불 기둥
  }

  // 🛒 마트 (편의점) — 문 앞에 서면 마트 안으로 들어간다
  const mart = makeMartBuilding();
  mart.position.set(MART.x, 0, MART.z);
  scene.add(mart);
  obstacles.push({ x: MART.x, z: MART.z, hw: MART.hw, hd: MART.hd });
  reserved.push({ x: MART.x, z: MART.z, r: 17 });   // 문 앞 길까지 나무를 안 심는다
  //  마트 앞에 세워둔 카트 (장식)
  scene.add(makeMartCarts(MART.x + 4.5, MART.z + 6.6));
  obstacles.push({ x: MART.x + 6.0, z: MART.z + 7.1, r: 1.8 });

  // 🎨 그림의 집 — 문 앞에 서면 안으로 들어간다
  const artHouse = makeArtHouseBuilding();
  artHouse.position.set(ART.x, 0, ART.z);
  scene.add(artHouse);
  obstacles.push({ x: ART.x, z: ART.z, hw: ART.hw, hd: ART.hd });
  reserved.push({ x: ART.x, z: ART.z, r: 17 });   // 문 앞 길까지 나무를 안 심는다

  // 우리 집 (남쪽) — 아이가 색을 고를 수 있게 roofC
  const home = makeHouse(M.roofC, 7, 4.5, 7);
  home.position.set(HOME.x, 0, HOME.z);
  home.userData.isHome = true;
  scene.add(home);
  obstacles.push({ x: HOME.x, z: HOME.z, r: 4.7 });
  reserved.push({ x: HOME.x, z: HOME.z, r: 10 });

  // 친구들 집 (광장 둘레) — 문 앞에 서면 그 집 안으로 들어간다
  //  ★ 집은 전부 광장(가운데) 쪽을 바라본다. 그래야 아이가 문을 찾기 쉽다
  const roofs = [M.roofA, M.roofB, M.roofC];
  const houseDoors = [];
  for (let i = 0; i < HOUSES.length; i++) {
    const house = HOUSES[i];
    const a = FRIEND_ANGLES[i % FRIEND_ANGLES.length];
    const hx = Math.cos(a) * FRIEND_DIST, hz = Math.sin(a) * FRIEND_DIST;
    // 집 앞(광장 쪽) 방향
    const fx = -Math.cos(a), fz = -Math.sin(a);
    const h = makeHouse(roofs[i % 3], 8, 5, 8, house.name);
    h.position.set(hx, 0, hz);
    h.rotation.y = Math.atan2(fx, fz);        // 앞면(+z)이 광장을 보게 돌린다
    scene.add(h);
    obstacles.push({ x: hx, z: hz, r: 5.4 });
    reserved.push({ x: hx, z: hz, r: 11 });
    //  ★ 문 앞 길에는 나무를 심지 않는다.
    //    집에서 나오면 여기에 서는데, 나무가 있으면 화면을 가린다
    reserved.push({ x: hx + fx * 12, z: hz + fz * 12, r: 8.5 });

    houseDoors.push({
      x: hx + fx * HOUSE_DOOR, z: hz + fz * HOUSE_DOOR, r: 2.8,
      to: `house-${house.id}`,
      label: `${house.name}에 놀러 왔어요!`,
      //  ★ 나올 때는 문에서 넉넉히 떨어뜨려 세운다.
      //    - 문 반경(2.8) 안에 서 있으면 다시 들어가려 할 때 한 번 멀어져야 해서 답답하다
      //    - 카메라가 캐릭터 뒤에 서므로, 너무 가까우면 카메라가 집 안에 파묻힌다
      build: (ctx) => buildHouse(house, { ...ctx, exit: {
        x: hx + fx * (HOUSE_DOOR + 6.0), z: hz + fz * (HOUSE_DOOR + 6.0),
        yaw: Math.atan2(fx, fz),
      } }),
    });
  }

  // 놀이터
  const playground = buildPlayground(PLAYGROUND.x, PLAYGROUND.z);
  scene.add(playground.group);
  obstacles.push(...playground.obstacles);
  reserved.push({ x: PLAYGROUND.x, z: PLAYGROUND.z, r: 15 });

  // 🐴 마구간과 말들 (말은 마을 좌표를 그대로 쓰므로 화면에 따로 넣는다)
  const stable = buildStable(STABLE.x, STABLE.z);
  scene.add(stable.group);
  for (const h of stable.horses) scene.add(h);
  obstacles.push(...stable.obstacles);
  reserved.push({ x: STABLE.x, z: STABLE.z, r: 18 });

  // 광장 옆에도 말 한 마리 — 바로 눈에 띄어서 타보게 된다
  const plazaHorse = makeHorseRide(PLAZA_HORSE.x, PLAZA_HORSE.z, 2, -2.2);
  scene.add(plazaHorse.group);
  obstacles.push(plazaHorse.obstacle);
  reserved.push({ x: PLAZA_HORSE.x, z: PLAZA_HORSE.z, r: 8 });

  // 🛣 광장 ↔ 큰 건물들을 잇는 길
  road(CASTLE.x, CASTLE.doorZ + 6, 11);        // 🏰 인하성
  road(RUHA_SITE.x, RUHA_SITE.doorZ + 6);      // 🌙 루하성
  road(MOM_SITE.x, MOM_SITE.doorZ + 6);        // 💗 엄마성
  road(DAD_SITE.x, DAD_SITE.doorZ - 6);        // 🛠 아빠성
  road(PLAYGROUND.x, PLAYGROUND.z);            // 🛝 놀이터
  road(HOME.x, HOME.z);                        // 🏡 우리 집

  // 나무 — 건물이나 놀이터 위에는 심지 않는다 (마을이 넓어져서 그루 수도 늘렸다)
  for (let i = 0; i < 80; i++) {
    let x = 0, z = 0, ok = false;
    for (let tryCount = 0; tryCount < 20 && !ok; tryCount++) {
      const a = Math.random() * Math.PI * 2;
      const r = 26 + Math.random() * (WORLD_RADIUS - 32);
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      ok = reserved.every(s => Math.hypot(x - s.x, z - s.z) > s.r);
    }
    if (!ok) continue;

    const t = makeTree(Math.random() < 0.3);
    const s = 0.8 + Math.random() * 0.5;
    t.position.set(x, 0, z);
    t.scale.setScalar(s);
    t.rotation.y = Math.random() * 6;
    scene.add(t);
    obstacles.push({ x, z, r: 1.0 * s });
  }

  // 하늘 (구름 + 고래)
  const sky = buildSky(scene);

  const { collide, isBlocked } = createCollider(obstacles);

  /** 매 프레임 움직이는 것들 (구름, 고래, 그네, 시소, 말, 루하성 별) */
  function update(dt, t) {
    sky.update(dt, t);
    ruhaTick?.(t, dt);
    momTick?.(t, dt);
    dadTick?.(t, dt);
    playground.update(dt, t);
    stable.update(dt, t);
    plazaHorse.update(dt, t);
  }

  // rides = 캐릭터가 탈 수 있는 놀이기구 목록 (그네 2개 + 미끄럼틀). src/rides.js가 쓴다.
  return {
    name: 'village',
    scene,
    spawn: new THREE.Vector3(0, 0, 14),
    yaw: 0,
    bounds: WORLD_BOUNDS,      // 마을 밖으로 못 나가는 원의 반지름
    home, collide, isBlocked, update,
    // 📷 마을에서는 카메라가 건물·나무 속에 파묻히면 캐릭터 쪽으로 당긴다.
    //   (집에서 막 나왔을 때 건물에 가려서 캐릭터가 안 보이던 문제)
    //   실내는 벽이 안쪽만 보이는 판이라 밖에 있어도 잘 보이므로 켜지 않는다
    camCollide: true,
    // 탈 수 있는 것 — 그네·미끄럼틀·시소 + 🐴 말 세 마리
    rides: [...playground.rides, ...stable.rides, plazaHorse.ride],
    // 🚪 문 — 건물 앞에 서면 그 건물 안으로 들어간다 (main.js가 확인한다)
    //   build(ctx) = 안쪽 공간을 만드는 함수. ctx.exit = 나올 때 설 자리
    doors: [
      {
        x: 0, z: CASTLE.doorZ, r: 4.5, to: 'castle',
        label: '인하성! 👑 안쪽 끝에 왕좌가 있어요',
      },
      {
        x: MART.x, z: MART.doorZ, r: 2.8, to: 'mart',
        label: '어서 오세요! 🛒 행복마트',
        build: (ctx) => buildMart({ ...ctx,
          exit: { x: MART.x, z: MART.doorZ + 6.0, yaw: 0 } }),
      },
      {
        x: ART.x, z: ART.doorZ, r: 2.8, to: 'art',
        label: '그림의 집! 🎨 이젤 앞에서 그리기를 눌러요',
        build: (ctx) => buildArtHouse({ ...ctx,
          exit: { x: ART.x, z: ART.doorZ + 6.0, yaw: 0 } }),
      },
      {
        x: RUHA_SITE.x, z: RUHA_SITE.doorZ, r: 2.8, to: 'ruha',
        label: '루하성! 🌙 별과 달의 성',
        build: buildRuhaCastle,
      },
      {
        x: MOM_SITE.x, z: MOM_SITE.doorZ, r: 2.8, to: 'mom',
        label: '엄마성! 💗 10층 놀이터. 엘리베이터를 타요',
        build: buildMomCastle,
      },
      {
        x: DAD_SITE.x, z: DAD_SITE.doorZ, r: 2.8, to: 'dad',
        label: '아빠성! 🛠 뚝딱 공작소. 기차를 타요',
        build: buildDadCastle,
      },
      ...houseDoors,        // 🏠 친구 집 (src/houses.js의 HOUSES 개수만큼)
    ],
  };
}
