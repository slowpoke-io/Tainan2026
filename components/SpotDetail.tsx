import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  MapPin,
  Clock,
  Edit2,
  ExternalLink,
  Tag,
  CheckCircle2,
  Plus,
  X,
  Loader2,
  Maximize2,
} from "lucide-react";
import { Spot, TagType, AVAILABLE_TAGS } from "../types";
import Carousel from "./Carousel";
import TimePicker from "./TimePicker";
import { GoogleGenAI, Type } from "@google/genai";

interface SpotDetailProps {
  spot: Spot;
  onClose: () => void;
  onUpdateSpot: (id: string, updates: Partial<Spot>) => void;
}

const SpotDetail: React.FC<SpotDetailProps> = ({
  spot,
  onClose,
  onUpdateSpot,
}) => {
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);

  // 鎖定背景滾動
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const parsedTime = useMemo(() => {
    if (spot.openingHours === "24小時開放")
      return { is24: true, start: "09:00", end: "18:00" };
    const match = spot.openingHours.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
    return {
      is24: false,
      start: match ? match[1] : "09:00",
      end: match ? match[2] : "18:00",
    };
  }, [spot.openingHours]);

  const [editData, setEditData] = useState({
    notes: spot.notes,
    address: spot.address,
    tags: spot.tags as TagType[],
    is24: parsedTime.is24,
    startTime: parsedTime.start,
    endTime: parsedTime.end,
  });

  useEffect(() => {
    setEditData({
      notes: spot.notes,
      address: spot.address,
      tags: spot.tags as TagType[],
      is24: parsedTime.is24,
      startTime: parsedTime.start,
      endTime: parsedTime.end,
    });
  }, [spot, parsedTime]);

  const triggerSave = (data = editData, extraUpdates: Partial<Spot> = {}) => {
    const finalOpeningHours = data.is24
      ? "24小時開放"
      : `${data.startTime} - ${data.endTime}`;
    onUpdateSpot(spot.id, {
      notes: data.notes,
      address: data.address,
      tags: data.tags,
      openingHours: finalOpeningHours,
      ...extraUpdates,
    });
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2000);
  };

  const handleAddressBlur = async () => {
    if (editData.address === spot.address) return; // 地址沒變不處理

    setIsGeocoding(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `請解析台南地點「${spot.name}」的新地址「${editData.address}」。
      請回傳該地點精確的經緯度 (latitude, longitude) 與標準格式地址。`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              standardAddress: { type: Type.STRING },
            },
            required: ["lat", "lng", "standardAddress"],
          },
        },
      });

      const result = JSON.parse(response.text);

      const nextData = { ...editData, address: result.standardAddress };
      setEditData(nextData);
      triggerSave(nextData, {
        lat: result.lat,
        lng: result.lng,
      });
    } catch (error) {
      console.error("Geocoding failed:", error);
      triggerSave(); // 失敗時僅存文字，不改經緯度
    } finally {
      setIsGeocoding(false);
    }
  };

  const toggleTag = (tag: TagType) => {
    const newTags = editData.tags.includes(tag)
      ? editData.tags.filter((t) => t !== tag)
      : [...editData.tags, tag];

    const newEditData = { ...editData, tags: newTags };
    setEditData(newEditData);
    triggerSave(newEditData);
  };

  const handleTimeChange = (
    type: "start" | "end" | "toggle24",
    value?: string,
  ) => {
    let nextData = { ...editData };
    if (type === "start") nextData.startTime = value!;
    if (type === "end") nextData.endTime = value!;
    if (type === "toggle24") nextData.is24 = !nextData.is24;

    setEditData(nextData);
    triggerSave(nextData);
  };

  const googleMapsAppUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.name + " " + spot.address)}`;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 250 }}
      className="fixed inset-0 bg-white z-[150] overflow-y-auto no-scrollbar"
    >
      <div className="relative pb-24">
        {/* Navigation Bar */}
        <div
          className="fixed top-0 left-0 right-0 z-[160] p-4 pointer-events-none"
          style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))" }}
        >
          <button
            onClick={onClose}
            className="pointer-events-auto bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-full shadow-xl text-stone-800 flex items-center gap-1.5 font-bold text-sm border border-stone-100 active:scale-95 transition-transform"
          >
            <ChevronLeft size={18} /> 返回行程
          </button>
        </div>

        {/* Hero Section */}
        <div className="h-72 sm:h-96 relative group">
          <Carousel
            images={spot.images}
            onImageClick={() => setIsImagePopupOpen(true)}
            className="h-60"
          />
          <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-md p-2 rounded-full text-white/80 pointer-events-none group-hover:opacity-100 opacity-0 transition-opacity">
            <Maximize2 size={16} />
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 -mt-10 bg-[#f8f5f0] rounded-t-[48px] relative min-h-screen shadow-[0_-20px_60px_rgba(0,0,0,0.08)] border-t border-white/50">
          <div className="w-14 h-1.5 bg-stone-300/40 rounded-full mx-auto mb-8" />

          <div className="flex justify-between items-start mb-8">
            <div className="flex-1">
              <h1 className="text-3xl font-bold font-serif text-stone-900 mb-3 leading-tight tracking-tight">
                {spot.name}
              </h1>
              <div className="flex flex-wrap gap-2 items-center">
                <AnimatePresence>
                  {editData.tags.map((tag) => (
                    <motion.span
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[11px] bg-orange-100/60 border border-orange-200/50 text-[#8C2D1F] px-3 py-1.5 rounded-xl font-bold"
                    >
                      #{tag}
                    </motion.span>
                  ))}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsEditingTags(!isEditingTags)}
                    className={`p-2 rounded-xl border transition-all shadow-sm flex items-center justify-center ${
                      isEditingTags
                        ? "bg-[#8C2D1F] text-[#E8D5B7] border-[#8C2D1F]"
                        : "bg-white text-stone-400 border-stone-200"
                    }`}
                  >
                    {isEditingTags ? <X size={14} /> : <Plus size={14} />}
                  </motion.button>
                </AnimatePresence>
              </div>
            </div>

            <AnimatePresence>
              {(showSavedFeedback || isGeocoding) && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={`text-[10px] font-black px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${
                    isGeocoding
                      ? "bg-stone-100 border-stone-200 text-stone-500"
                      : "bg-orange-100 border-orange-200 text-[#8C2D1F]"
                  }`}
                >
                  {isGeocoding ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={12} />
                  )}
                  {isGeocoding ? "解析座標中" : "自動存檔"}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Expanded Tag Editor */}
          <AnimatePresence>
            {isEditingTags && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-8"
              >
                <div className="bg-white p-5 rounded-3xl border border-dashed border-orange-200 shadow-inner">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      點擊以編輯標籤
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-4 py-2 text-[12px] rounded-full border transition-all font-bold ${
                          editData.tags.includes(tag)
                            ? "bg-[#8C2D1F] text-[#E8D5B7] border-[#8C2D1F]"
                            : "bg-stone-50 text-stone-400 border-stone-100"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 gap-5 mb-10">
            {/* Address Navigator */}
            <div
              className={`bg-white p-6 rounded-[32px] border shadow-sm group transition-colors ${isGeocoding ? "border-orange-200 bg-orange-50/20" : "border-stone-100"}`}
            >
              <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
                  地址與導航
                </label>
                {isGeocoding && (
                  <span className="text-[9px] font-bold text-orange-500 animate-pulse">
                    正在透過 AI 更新地圖座標...
                  </span>
                )}
              </div>
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-2xl transition-all ${isGeocoding ? "bg-orange-200 text-white animate-bounce" : "bg-orange-50 text-[#8C2D1F] group-hover:scale-110"}`}
                >
                  {isGeocoding ? (
                    <MapPin size={22} className="fill-current" />
                  ) : (
                    <MapPin size={22} />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={editData.address}
                    onBlur={handleAddressBlur}
                    onChange={(e) =>
                      setEditData({ ...editData, address: e.target.value })
                    }
                    className={`w-full text-base font-bold outline-none bg-transparent transition-colors ${isGeocoding ? "text-stone-400" : "text-stone-800"}`}
                    placeholder="請輸入景點地址..."
                  />
                  <a
                    href={googleMapsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-[12px] font-black flex items-center gap-1.5 mt-2.5"
                  >
                    使用 Google 地圖開啟 <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>

            {/* Time Settings */}
            <div className="bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock size={14} /> 營業時間
                </label>
                <button
                  onClick={() => handleTimeChange("toggle24")}
                  className={`text-[10px] font-black px-4 py-2 rounded-xl transition-all ${editData.is24 ? "bg-[#8C2D1F] text-white shadow-md" : "bg-stone-100 text-stone-400"}`}
                >
                  24小時開放
                </button>
              </div>
              {!editData.is24 ? (
                <div className="flex items-center gap-4">
                  <TimePicker
                    label="開門時段"
                    value={editData.startTime}
                    onChange={(v) => handleTimeChange("start", v)}
                  />
                  <div className="pt-8 text-stone-200 font-bold text-lg">~</div>
                  <TimePicker
                    label="休息時段"
                    value={editData.endTime}
                    onChange={(v) => handleTimeChange("end", v)}
                  />
                </div>
              ) : (
                <div className="p-6 bg-orange-50/40 rounded-3xl text-center text-sm font-bold text-[#8C2D1F] border border-dashed border-orange-200">
                  此地點全天候服務
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="mb-10 p-8 bg-white rounded-[48px] border border-stone-100 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 text-stone-800 mb-5 text-lg">
              <Edit2 size={18} className="text-[#8C2D1F]" /> 行程備註
            </h3>
            <textarea
              value={editData.notes}
              onBlur={() => triggerSave()}
              onChange={(e) =>
                setEditData({ ...editData, notes: e.target.value })
              }
              className="w-full p-6 text-sm rounded-[32px] border border-stone-100 bg-stone-50/50 focus:bg-white focus:ring-4 focus:ring-orange-50 focus:border-orange-200 outline-none min-h-[200px] transition-all leading-relaxed shadow-inner"
              placeholder="可以在這裡記錄必吃美食、拍照攻略或預約資訊..."
            />
          </div>

          {/* Interactive Map Embed */}
          <div className="mb-12">
            <h3 className="font-bold font-serif text-stone-900 mb-5 px-1 text-xl">
              地點位置
            </h3>
            <div className="w-full aspect-video rounded-[40px] overflow-hidden shadow-2xl bg-white relative border-4 border-white h-75">
              <iframe
                title="map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                key={spot.lat + spot.lng} // 強制重新渲染以反應新座標
                loading="lazy"
                src={`https://maps.google.com/maps?q=${spot.lat},${spot.lng}&z=15&output=embed`}
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Popup */}
      <AnimatePresence>
        {isImagePopupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md"
            onClick={() => setIsImagePopupOpen(false)}
          >
            <div className="absolute top-6 right-6 z-[310]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImagePopupOpen(false);
                }}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Carousel images={spot.images} className="h-auto" />
            </motion.div>

            <p className="mt-6 text-white/50 text-xs font-bold tracking-widest uppercase">
              {spot.name}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SpotDetail;
