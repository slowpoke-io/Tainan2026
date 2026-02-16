import React, { useMemo, useState } from "react";
import {
  Reorder,
  useDragControls,
  motion,
  AnimatePresence,
} from "framer-motion";
import {
  Clock,
  MoreVertical,
  MapPin,
  Circle,
  CheckCircle2,
  Trash2,
  GripVertical,
} from "lucide-react";
import { Spot, DayTab } from "../types";
import Carousel from "./Carousel";

interface SpotCardProps {
  spot: Spot;
  index: number;
  onClick: (spot: Spot) => void;
  onMoveToDay: (spotId: string, targetDay: DayTab) => void;
  onToggleVisited: (spotId: string) => void;
  onDelete: (spotId: string) => void;
  isReorderMode?: boolean;
}

const SpotCard: React.FC<SpotCardProps> = ({
  spot,
  index,
  onClick,
  onMoveToDay,
  onToggleVisited,
  onDelete,
  isReorderMode,
}) => {
  const dragControls = useDragControls();
  const [showMenu, setShowMenu] = useState(false);

  const stopProp = (e: React.MouseEvent) => e.stopPropagation();

  const openStatus = useMemo(() => {
    if (spot.openingHours === "24小時開放")
      return { isOpen: true, label: "營業中" };
    try {
      const match = spot.openingHours.match(
        /(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/,
      );
      if (!match) return { isOpen: false, label: "依現場為準" };
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
      const endMinutes = parseInt(match[3]) * 60 + parseInt(match[4]);
      let isOpen =
        startMinutes < endMinutes
          ? currentMinutes >= startMinutes && currentMinutes <= endMinutes
          : currentMinutes >= startMinutes || currentMinutes <= endMinutes;
      return { isOpen, label: isOpen ? "營業中" : "已休息" };
    } catch (e) {
      return { isOpen: false, label: "查看詳情" };
    }
  }, [spot.openingHours]);

  // 排序模式下的精簡卡片
  if (isReorderMode) {
    return (
      <Reorder.Item
        value={spot}
        id={spot.id}
        dragControls={dragControls}
        dragListener={false}
        className="relative select-none"
      >
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileDrag={{
            backgroundColor: "#FFB347", // 改為亮琥珀色，增加區別度
            scale: 1.08,
            boxShadow: "0px 15px 30px rgba(242, 153, 74, 0.4)", // 增加與顏色相襯的陰影
            zIndex: 100,
          }}
          className="bg-[#8C2D1F] border border-white/10 rounded-2xl p-4 shadow-lg flex items-center justify-between transition-colors duration-200"
        >
          <div className="flex items-center gap-4 pointer-events-none">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#E8D5B7] font-black text-xs">
              {index + 1}
            </div>
            <span className="font-bold text-[#E8D5B7] text-base truncate max-w-[200px]">
              {spot.name}
            </span>
          </div>
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="p-2 cursor-grab active:cursor-grabbing text-[#E8D5B7]/50 hover:text-[#E8D5B7] touch-none"
          >
            <GripVertical size={20} />
          </div>
        </motion.div>
      </Reorder.Item>
    );
  }

  // 展示模式下的精緻卡片
  return (
    <Reorder.Item
      value={spot}
      id={spot.id}
      dragListener={false}
      className="relative"
    >
      <div
        onClick={() => onClick(spot)}
        className={`relative overflow-hidden bg-white border border-stone-200 rounded-2xl shadow-sm transition-all hover:shadow-md cursor-pointer ${
          spot.isVisited ? "opacity-60 grayscale-[0.3]" : ""
        }`}
      >
        <Carousel images={spot.images} className="h-48" />

        <div className="p-4 w-full flex flex-col justify-center">
          <div className="flex justify-between items-center gap-2">
            <h3 className="text-lg font-serif font-bold text-stone-800 truncate leading-tight">
              {spot.name}
            </h3>

            <button
              className="p-1.5 text-stone-300 hover:text-stone-500"
              onClick={(e) => {
                stopProp(e);
                setShowMenu(true);
              }}
            >
              <MoreVertical size={18} />
            </button>
          </div>

          <div className="mt-2">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {spot.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-stone-50 text-stone-500 text-[10px] rounded-md border border-stone-100 font-bold"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center text-stone-600 text-[11px] font-bold gap-1.5 bg-stone-50 px-2 py-1 rounded-lg border border-stone-100/50">
                  <Clock size={12} className="text-[#8C2D1F]" />
                  <span>{spot.openingHours}</span>
                </div>
                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                    openStatus.isOpen
                      ? "text-[#8C2D1F] bg-orange-50 border-orange-100"
                      : "text-stone-400 bg-stone-50 border-stone-100"
                  }`}
                >
                  {openStatus.isOpen && !spot.isVisited && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8C2D1F] animate-pulse" />
                  )}
                  <span>{openStatus.label}</span>
                </div>
              </div>
              <div className="flex items-center text-stone-400 text-xs gap-1.5 line-clamp-1 pl-1">
                <MapPin size={12} />
                <span className="truncate">{spot.address}</span>
              </div>
            </div>

            {spot.notes && (
              <div className="p-3 bg-stone-50/80 rounded-r-xl border-l-4 border-l-[#8C2D1F]/30 mt-1">
                <p className="text-[11px] text-stone-600 leading-relaxed  line-clamp-2">
                  {spot.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showMenu && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => {
                  stopProp(e);
                  setShowMenu(false);
                }}
                className="fixed inset-0 z-[120] bg-black/5"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-8 top-12 bg-white shadow-2xl border border-stone-100 rounded-2xl py-2 w-48 z-[130] overflow-hidden"
              >
                <div className="px-4 py-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-50 mb-1">
                  管理行程
                </div>

                <button
                  onClick={(e) => {
                    stopProp(e);
                    onToggleVisited(spot.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left pl-3.5 py-2.5 text-sm text-stone-700 hover:bg-orange-50 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2
                    size={16}
                    className={
                      spot.isVisited ? "text-[#8C2D1F]" : "text-stone-300"
                    }
                  />
                  {spot.isVisited ? "取消造訪" : "標記造訪"}
                </button>

                {(["Day 1", "Day 2", "其他景點"] as DayTab[]).map(
                  (d) =>
                    d !== spot.day && (
                      <button
                        key={d}
                        onClick={(e) => {
                          stopProp(e);
                          onMoveToDay(spot.id, d);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-5 py-2.5 text-sm text-stone-700 hover:bg-orange-50 transition-colors flex items-center gap-3"
                      >
                        <Circle size={4} className="fill-stone-300" /> 移動到{" "}
                        {d}
                      </button>
                    ),
                )}

                <div className="my-1 border-t border-stone-50" />

                <button
                  onClick={(e) => {
                    stopProp(e);
                    onDelete(spot.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-5 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-3 font-bold"
                >
                  <Trash2 size={16} /> 刪除行程
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </Reorder.Item>
  );
};

export default SpotCard;
