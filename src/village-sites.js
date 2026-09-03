// ===========================================================
//  🗺 마을 지도 — 무엇이 **어디에** 서 있는가
//
//  ★ 마을 배치를 바꾸고 싶으면 이 파일의 숫자만 고치면 된다.
//    건물 모양은 src/village-props.js · src/village-buildings.js,
//    실제로 놓는 일은 src/world.js가 한다.
//  ★ 성 안쪽(mom-castle.js 등)도 "마을로 나갔을 때 설 자리"를 여기서 가져간다.
//    그래서 성을 옮겨도 나오는 자리가 저절로 따라온다.
//
//  위에서 본 마을 (남쪽이 아래)
//         💗엄마성      🏰인하성      🌙루하성
//                  🛒마트  🎨그림의집
//    🛠아빠성           ⛲ 광장            🐴마구간
//              🏠친구집들이 광장을 빙 둘러 있다
//                  🏡우리집        🛝놀이터
// ===========================================================

// 마을 크기 — 반지름. 크게 하면 마을이 넓어진다 (나무도 더 멀리까지 심는다)
export const WORLD_RADIUS = 132;
export const WORLD_BOUNDS = 128;      // 여기까지만 걸어 나갈 수 있다

// 🏰 인하성 (북쪽 한가운데)
//   doorZ = 문 앞에 서는 자리,  exitZ = 성에서 나올 때 서는 자리(문보다 앞쪽)
export const CASTLE = { x: 0, z: -74, doorZ: -61.5, exitZ: -50 };

// 🌙 루하성 (북동) · 💗 엄마성 (북서) · 🛠 아빠성 (서)
//   half = 부딪히는 네모의 절반 크기,  doorZ = 문 앞 자리
export const RUHA_SITE = { x: 78, z: -62, hw: 12.5, hd: 10.5, doorZ: -49.5 };
export const MOM_SITE  = { x: -78, z: -62, hw: 12.5, hd: 10.5, doorZ: -49.5 };
export const DAD_SITE  = { x: -96, z: 20, hw: 12.5, hd: 10.5, doorZ: 32.5 };

// 🛒 행복마트 (광장 북서) · 🎨 그림의 집 (광장 북동)
export const MART = { x: -30, z: -26, hw: 7.7, hd: 5.7, doorZ: -18.6 };
export const ART  = { x: 26, z: -28, hw: 6.2, hd: 5.2, doorZ: -20.6 };

// 🏡 우리 집 · 🛝 놀이터 · 🐴 마구간 · 광장 옆 말
export const HOME        = { x: 0, z: 48 };
export const PLAYGROUND  = { x: 62, z: 58 };
export const STABLE      = { x: 52, z: -46 };
export const PLAZA_HORSE = { x: 22, z: 9 };

// 🏠 친구들 집 — 광장을 둘러싼 방향(라디안)과 거리
//  ★ 북쪽(성 가는 길, 약 4.7)과 남쪽(우리 집, 약 1.6)은 비워둔다
//  ★ 집 개수는 src/houses.js의 HOUSES가 정한다. 이 각도 목록도 같은 개수여야 한다
export const FRIEND_ANGLES = [0.4, 1.0, 2.5, 3.2, 3.9, 5.9, 5.25];   // 마지막이 🎂 파티 집
export const FRIEND_DIST = 54;        // 광장 한가운데에서 집까지
export const HOUSE_DOOR = 7.6;        // 집 한가운데에서 문 앞 자리까지
