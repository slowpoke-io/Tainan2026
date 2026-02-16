import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, MapPin, Search, Loader2, ExternalLink } from 'lucide-react';
import { Spot } from '../types';

interface AIRecommendProps {
  currentSpots: Spot[];
  activeDay: string;
}

const AIRecommend: React.FC<AIRecommendProps> = ({ currentSpots, activeDay }) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fix: Adhere to the requirement of using process.env.API_KEY directly in the constructor
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const currentLocs = currentSpots.map(s => s.name).join('、');
      
      const prompt = `我目前正在規劃台南${activeDay}行程，已經排入的地點有：${currentLocs}。
      請以「在地台南人」的視角，根據這些地點的地理位置，推薦3個附近好吃的在地美食或隱藏景點。
      請務必包含：店名/景點名、推薦理由、大約位在哪個區。
      請使用 Google Search 確保資訊是最新的。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const text = response.text;
      const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      setRecommendations([{ text, links }]);
    } catch (err) {
      console.error(err);
      setError('AI 暫時無法連線，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-[#1a2e23] to-[#2D4F3C] p-6 rounded-[32px] text-white shadow-xl relative overflow-hidden">
        <Sparkles className="absolute top-[-10px] right-[-10px] w-24 h-24 text-white/5 rotate-12" />
        <div className="relative z-10">
          <h3 className="text-xl font-bold font-serif mb-2 flex items-center gap-2">
            <Sparkles className="text-orange-400" size={20} /> AI 智慧領隊
          </h3>
          <p className="text-white/70 text-sm leading-relaxed mb-6">
            根據你排定的 {currentSpots.length} 個行程，幫你找出附近的巷弄美食或熱門景點！
          </p>
          <button
            onClick={fetchRecommendations}
            disabled={loading || currentSpots.length === 0}
            className="w-full bg-orange-400 hover:bg-orange-500 disabled:bg-stone-600 text-white font-bold py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
            {loading ? 'AI 正在搜尋中...' : '開始智慧推薦'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">{error}</div>
      )}

      <div className="space-y-4">
        {recommendations.map((rec, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-[32px] shadow-sm border border-stone-200"
          >
            <div className="prose prose-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
              {rec.text}
            </div>
            
            {rec.links && rec.links.length > 0 && (
              <div className="mt-6 pt-4 border-t border-stone-100">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">資料來源</p>
                <div className="flex flex-wrap gap-2">
                  {rec.links.map((link: any, idx: number) => (
                    link.web && (
                      <a
                        key={idx}
                        href={link.web.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] bg-stone-50 text-stone-500 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-orange-50 hover:text-[#8C2D1F] transition-colors border border-stone-100"
                      >
                        {link.web.title || '參考連結'} <ExternalLink size={10} />
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {currentSpots.length === 0 && !loading && recommendations.length === 0 && (
        <div className="text-center py-10">
          <p className="text-stone-400 text-sm italic">請先在「行程」分頁中加入景點，AI 才能為您推薦周邊美食喔！</p>
        </div>
      )}
    </div>
  );
};

export default AIRecommend;