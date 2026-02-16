export type DayTab = "Day 1" | "Day 2" | "其他景點";

export interface Spot {
  id: string;
  name: string;
  description: string;
  notes: string;
  images: string[];
  lat: number;
  lng: number;
  day: DayTab;
  tags: string[];
  openingHours: string;
  order: number;
  address: string;
  isVisited?: boolean; // 新增造訪狀態
}

export type TagType =
  | "住宿"
  | "美食"
  | "牛肉湯"
  | "逛街"
  | "名產"
  | "飲料"
  | "交通"
  | "古蹟"
  | "文藝";

export const AVAILABLE_TAGS: TagType[] = [
  "美食",
  "牛肉湯",
  "古蹟",
  "文藝",
  "逛街",
  "名產",
  "飲料",
  "交通",
  "住宿",
];
