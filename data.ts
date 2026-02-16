
import { Spot } from './types';

export const INITIAL_SPOTS: Spot[] = [
  {
    id: '1',
    name: '赤崁樓',
    description: '台南最具代表性的名勝古蹟，原為荷蘭人所建之「普羅民遮城」。',
    notes: '記得拍九隻石龜，就在正門入口處。',
    images: [
      'https://picsum.photos/seed/chihkan1/800/600',
      'https://picsum.photos/seed/chihkan2/800/600',
      'https://picsum.photos/seed/chihkan3/800/600'
    ],
    lat: 22.9975,
    lng: 120.2025,
    day: 'Day 1',
    tags: ['古蹟', '文藝'],
    openingHours: '08:30 - 21:30',
    order: 0,
    address: '台南市中西區民族路二段212號'
  },
  {
    id: '2',
    name: '神農街',
    description: '清朝時期台南五條港區域最熱鬧的街道，現已轉型為文創藝術聚落。',
    notes: '晚上點燈後超美，很多文青小店。',
    images: [
      'https://picsum.photos/seed/shennong1/800/600',
      'https://picsum.photos/seed/shennong2/800/600'
    ],
    lat: 22.9979,
    lng: 120.1966,
    day: 'Day 1',
    tags: ['逛街', '文藝'],
    openingHours: '24小時開放',
    order: 1,
    address: '台南市中西區神農街'
  },
  {
    id: '3',
    name: '阿村牛肉湯',
    description: '在地人也排隊的神級牛肉湯。',
    notes: '早上五點就開始排隊，賣完就沒了。',
    images: [
      'https://picsum.photos/seed/beefsoup1/800/600'
    ],
    lat: 22.9934,
    lng: 120.1977,
    day: 'Day 1',
    tags: ['美食'],
    openingHours: '04:00 - 10:00',
    order: 2,
    address: '台南市中西區保安路41號'
  },
  {
    id: '4',
    name: '安平樹屋',
    description: '原本是德記洋行的倉庫，因荒廢多年後，樹根與牆面共生。',
    notes: '門票可以順便看旁邊的朱玖瑩紀念館。',
    images: [
      'https://picsum.photos/seed/treehouse1/800/600',
      'https://picsum.photos/seed/treehouse2/800/600'
    ],
    lat: 23.0031,
    lng: 120.1594,
    day: 'Day 2',
    tags: ['古蹟', '文藝'],
    openingHours: '08:30 - 17:30',
    order: 0,
    address: '台南市安平區古堡街108號'
  },
  {
    id: '5',
    name: '林百貨',
    description: '全台唯一設有神社的百貨公司，日治時期留下來的古蹟。',
    notes: '記得去頂樓看指針電梯跟神社遺址。',
    images: [
      'https://picsum.photos/seed/hayashi1/800/600',
      'https://picsum.photos/seed/hayashi2/800/600'
    ],
    lat: 22.9918,
    lng: 120.2023,
    day: 'Day 2',
    tags: ['逛街', '名產'],
    openingHours: '11:00 - 21:00',
    order: 1,
    address: '台南市中西區忠義路二段63號'
  },
  {
    id: '6',
    name: '奇美博物館',
    description: '西洋古典建築風格，館藏豐富，是全台最美的博物館之一。',
    notes: '阿波羅噴泉固定時間會有噴水秀。',
    images: [
      'https://picsum.photos/seed/chimei1/800/600',
      'https://picsum.photos/seed/chimei2/800/600'
    ],
    lat: 22.9348,
    lng: 120.2260,
    day: '其他景點',
    tags: ['文藝'],
    openingHours: '09:30 - 17:30 (週三休館)',
    order: 0,
    address: '台南市仁德區文華路二段66號'
  }
];
