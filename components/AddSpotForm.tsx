import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Spot, DayTab, TagType, AVAILABLE_TAGS } from "../types";
import {
  MapPin,
  Clock,
  FileText,
  Check,
  X,
  Tag,
  ImageIcon,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";
import TimePicker from "./TimePicker";

interface AddSpotFormProps {
  onAdd: (spot: Omit<Spot, "id" | "order">) => void;
  defaultDay: DayTab;
  onCancel: () => void;
}

// import OpenAI from "openai";

// const client = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
//   dangerouslyAllowBrowser: true,
// });

// async function geocodePlace(formData: { name: string; address?: string }) {
//   const prompt = `請幫我找出台南景點「${formData.name}」的精確資訊。
// 如果我有提供地址「${formData.address ?? ""}」，請以此地址為準。
// 請回傳該地點的經緯度 (latitude, longitude) 與標準地址。`;

//   const response = await client.responses.create({
//     model: "gpt-4.1-mini",
//     input: prompt,

//     // ✅ 新版寫法：text.format（取代 response_format）
//     text: {
//       format: {
//         type: "json_schema",
//         name: "tainan_geocode",
//         schema: {
//           type: "object",
//           properties: {
//             lat: { type: "number" },
//             lng: { type: "number" },
//             standardAddress: { type: "string" },
//           },
//           required: ["lat", "lng", "standardAddress"],
//           additionalProperties: false,
//         },
//         strict: true,
//       },
//     },
//   });

//   // SDK convenience：response.output_text 會是純文字輸出（此時為 JSON 字串）
//   const result = JSON.parse(response.output_text) as {
//     lat: number;
//     lng: number;
//     standardAddress: string;
//   };

//   return result;
// }

const AddSpotForm: React.FC<AddSpotFormProps> = ({
  onAdd,
  defaultDay,
  onCancel,
}) => {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [is24Hours, setIs24Hours] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    day: defaultDay,
    notes: "",
    description: "使用者自訂景點",
    tags: [] as TagType[],
    images: [] as string[],
  });

  const [newImageUrl, setNewImageUrl] = useState("");

  const toggleTag = (tag: TagType) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const addImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, newImageUrl.trim()],
    }));
    setNewImageUrl("");
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || isGeocoding) return;

    setIsGeocoding(true);

    let finalImages = [...formData.images];
    if (newImageUrl.trim()) {
      finalImages.push(newImageUrl.trim());
    }

    const finalOpeningHours = is24Hours
      ? "24小時開放"
      : `${startTime} - ${endTime}`;
    // try {
    //   const result = await geocodePlace(formData);

    //   const processedImages =
    //     finalImages.length > 0
    //       ? finalImages
    //       : [
    //           `https://picsum.photos/seed/${encodeURIComponent(
    //             formData.name + Date.now(),
    //           )}/800/600`,
    //         ];

    //   onAdd({
    //     ...formData,
    //     openingHours: finalOpeningHours,
    //     address: result.standardAddress || formData.address,
    //     images: processedImages,
    //     lat: result.lat,
    //     lng: result.lng,
    //   });
    // } catch (error) {
    //   console.error("AI Geocoding failed:", error);

    //   const processedImages =
    //     finalImages.length > 0
    //       ? finalImages
    //       : [`https://picsum.photos/seed/default-${Date.now()}/800/600`];

    //   onAdd({
    //     ...formData,
    //     openingHours: finalOpeningHours,
    //     images: processedImages,
    //     lat: 22.9975,
    //     lng: 120.2025,
    //   });
    // } finally {
    //   setIsGeocoding(false);
    // }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `請幫我找出台南景點「${formData.name}」的精確資訊。
      如果我有提供地址「${formData.address}」，請以此地址為準。
      請回傳該地點的經緯度 (latitude, longitude) 與標準地址。`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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

      const result = JSON.parse(response.text as string);
      console.log({ response });
      const processedImages =
        finalImages.length > 0
          ? finalImages
          : [
              `https://picsum.photos/seed/${encodeURIComponent(formData.name + Date.now())}/800/600`,
            ];

      onAdd({
        ...formData,
        openingHours: finalOpeningHours,
        address: result.standardAddress || formData.address,
        images: processedImages,
        lat: result.lat,
        lng: result.lng,
      });
    } catch (error) {
      console.error("AI Geocoding failed:", error);
      const processedImages =
        finalImages.length > 0
          ? finalImages
          : [`https://picsum.photos/seed/default-${Date.now()}/800/600`];

      onAdd({
        ...formData,
        openingHours: finalOpeningHours,
        images: processedImages,
        lat: 22.9975,
        lng: 120.2025,
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] shadow-xl border border-stone-200 overflow-hidden mb-12">
      <div className="bg-[#8C2D1F] px-6 py-4 flex justify-between items-center text-[#E8D5B7]">
        <h3 className="font-bold font-serif flex items-center gap-2 text-lg">
          新增行程景點
        </h3>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            景點名稱
          </label>
          <input
            type="text"
            required
            disabled={isGeocoding}
            placeholder="例如：文章牛肉湯"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full text-lg font-bold border-b-2 border-stone-100 focus:border-[#8C2D1F] outline-none py-1 bg-transparent transition-colors placeholder:text-stone-300 disabled:opacity-50"
          />
        </div>

        <div className="space-y-3 bg-stone-50/50 p-4 rounded-2xl border border-stone-100">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
            <ImageIcon size={10} /> 景點圖片 (貼上網址)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://example.com/image.jpg"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="flex-1 text-xs border-b border-stone-200 focus:border-[#8C2D1F] outline-none py-1 bg-transparent transition-colors placeholder:text-stone-300"
            />
            <button
              type="button"
              onClick={addImageUrl}
              className="p-1.5 bg-white shadow-sm text-stone-600 rounded-lg active:scale-90"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pt-2 min-h-[64px]">
            {formData.images.map((img, idx) => (
              <div
                key={idx}
                className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden group border border-white"
              >
                <img src={img} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            安排天數
          </label>
          <div className="flex gap-2">
            {(["Day 1", "Day 2", "其他景點"] as DayTab[]).map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setFormData({ ...formData, day })}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                  formData.day === day
                    ? "bg-[#8C2D1F] border-[#8C2D1F] text-[#E8D5B7]"
                    : "bg-white text-stone-400 border-stone-100"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
              <Clock size={10} /> 營業時間
            </label>
            <button
              type="button"
              onClick={() => setIs24Hours(!is24Hours)}
              className={`text-[9px] font-bold px-2 py-1 rounded-md transition-colors ${is24Hours ? "bg-[#8C2D1F] text-white" : "bg-stone-100 text-stone-400"}`}
            >
              24小時開放
            </button>
          </div>
          <AnimatePresence mode="wait">
            {!is24Hours ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2"
              >
                <TimePicker
                  label="開始時間"
                  value={startTime}
                  onChange={setStartTime}
                />
                <div className="pt-4 text-stone-300 font-bold px-1">~</div>
                <TimePicker
                  label="結束時間"
                  value={endTime}
                  onChange={setEndTime}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-orange-50/50 border border-dashed border-orange-200 rounded-xl text-center text-[10px] font-bold text-[#8C2D1F]"
              >
                全天候開放，隨時可出發！
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
            <MapPin size={10} /> 地址
          </label>
          <input
            type="text"
            placeholder="AI 會自動偵測..."
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            className="w-full text-xs border-b border-stone-100 focus:border-[#8C2D1F] outline-none py-1 bg-transparent"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
            <Tag size={10} /> 標籤
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 text-[10px] rounded-full border transition-all font-bold ${
                  formData.tags.includes(tag)
                    ? "bg-orange-100 text-[#8C2D1F] border-orange-200"
                    : "bg-stone-50 text-stone-500 border-stone-100"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
            <FileText size={10} /> 備註
          </label>
          <textarea
            placeholder="記錄必點菜色..."
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="w-full text-sm border rounded-2xl border-stone-100 outline-none p-3 min-h-[80px] bg-stone-50/30"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 text-sm font-bold text-stone-400 rounded-2xl border border-stone-100"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isGeocoding}
            className="flex-1 py-4 bg-[#8C2D1F] text-white text-sm font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2"
          >
            {isGeocoding ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Check size={18} />
            )}{" "}
            確認新增
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddSpotForm;
