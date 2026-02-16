import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Footprints,
  CheckCircle2,
  Navigation,
  ExternalLink,
  Calendar,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { Spot } from "../types";
import L from "leaflet";

interface FootprintsViewProps {
  spots: Spot[];
  onSpotClick: (spot: Spot) => void;
}

const FootprintsView: React.FC<FootprintsViewProps> = ({
  spots,
  onSpotClick,
}) => {
  const [activeDay, setActiveDay] = useState<"Day 1" | "Day 2">("Day 1");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const daySpots = useMemo(() => {
    return spots
      .filter((s) => s.day === activeDay)
      .sort((a, b) => a.order - b.order);
  }, [spots, activeDay]);

  const visitedSpots = useMemo(() => {
    return daySpots.filter((s) => s.isVisited);
  }, [daySpots]);

  const progress = useMemo(() => {
    if (daySpots.length === 0) return 0;
    return Math.round((visitedSpots.length / daySpots.length) * 100);
  }, [daySpots, visitedSpots]);

  const directionsUrl = useMemo(() => {
    if (visitedSpots.length < 2) return null;
    const origin = encodeURIComponent(visitedSpots[0].address);
    const destination = encodeURIComponent(
      visitedSpots[visitedSpots.length - 1].address,
    );
    const waypoints = visitedSpots
      .slice(1, -1)
      .map((s) => encodeURIComponent(s.address))
      .join("|");
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
  }, [visitedSpots]);

  // Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: !L.Browser.mobile,
      }).setView([22.9975, 120.2025], 14);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
        },
      ).addTo(mapRef.current);

      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);

      polylineRef.current = L.polyline([], {
        color: "#8C2D1F",
        weight: 3,
        opacity: 0.5,
        dashArray: "10, 10",
        lineCap: "round",
        lineJoin: "round",
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Map Content
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current || !polylineRef.current)
      return;

    markersLayerRef.current.clearLayers();
    const bounds = L.latLngBounds([]);
    const visitedCoords: L.LatLngExpression[] = [];

    daySpots.forEach((spot, idx) => {
      const coord: L.LatLngExpression = [spot.lat, spot.lng];
      bounds.extend(coord);

      const color = spot.isVisited ? "#8C2D1F" : "#d6d3d1";
      const size = 26;
      const orderInDay = idx + 1;

      const icon = L.divIcon({
        className: "custom-div-icon",
        html: `
          <div style="
            width: ${size}px; 
            height: ${size}px; 
            background: ${color}; 
            border: 2px solid white; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            font-size: 11px;
            color: white;
            font-weight: 900;
          ">
            ${orderInDay}
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      L.marker(coord, { icon })
        .addTo(markersLayerRef.current!)
        .bindPopup(`<div class="font-bold text-stone-800">${spot.name}</div>`);

      if (spot.isVisited) {
        visitedCoords.push(coord);
      }
    });

    polylineRef.current.setLatLngs(visitedCoords);

    if (daySpots.length > 0) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [daySpots]);

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-[#1a2e23] p-6 rounded-[32px] text-white shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold font-serif flex items-center gap-2">
              <Footprints className="text-orange-400" size={24} /> 旅程足跡
            </h3>
            <p className="text-white/60 text-xs mt-1">
              紀錄你在府城留下的每一個故事
            </p>
          </div>
          <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
            Achievement
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-white/5 rounded-2xl mb-6">
          {(["Day 1", "Day 2"] as const).map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeDay === day
                  ? "bg-orange-400 text-white shadow-lg shadow-orange-900/20"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-xs font-bold text-white/60 uppercase tracking-tighter">
              Day Completion
            </span>
            <span className="text-2xl font-serif font-bold text-orange-400">
              {progress}%
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-orange-400 to-orange-300 rounded-full"
            />
          </div>
          <p className="text-[10px] text-white/40 text-right italic">
            已走訪 {visitedSpots.length} / {daySpots.length} 個行程
          </p>
        </div>
      </div>

      {/* Trajectory Map */}
      <div className="bg-white p-4 rounded-[32px] shadow-sm border border-stone-200 overflow-hidden">
        <div className="flex justify-between items-center mb-4 px-2">
          <h4 className="font-bold text-stone-800 flex items-center gap-2">
            <Navigation size={18} className="text-[#8C2D1F]" /> 當日軌跡
          </h4>
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-[#8C2D1F] flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-full"
            >
              開啟導航 <ExternalLink size={10} />
            </a>
          )}
        </div>

        <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-stone-100 shadow-inner group bg-stone-50">
          <div
            ref={mapContainerRef}
            className="w-full h-full z-10"
            style={{ touchAction: "pan-x pan-y" }}
          />
          {daySpots.length === 0 && (
            <div className="absolute inset-0 z-20 bg-stone-50/80 backdrop-blur-sm flex items-center justify-center text-stone-400 text-sm italic p-10 text-center">
              目前尚未安排該日行程
            </div>
          )}
        </div>
      </div>

      {/* Visited List Timeline */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-stone-200">
        <h4 className="font-bold text-stone-800 flex items-center gap-2 mb-8">
          <Calendar size={18} className="text-[#8C2D1F]" /> 走訪紀錄
        </h4>

        {visitedSpots.length > 0 ? (
          <div className="relative pl-10 space-y-10">
            {/* 置中垂直線 */}
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-stone-50" />

            {visitedSpots.map((spot) => {
              // 獲取該景點在當日總行程中的原始索引 (1-based)
              const originalIdx =
                daySpots.findIndex((s) => s.id === spot.id) + 1;

              return (
                <motion.div
                  key={spot.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative cursor-pointer group"
                  onClick={() => onSpotClick(spot)}
                >
                  {/* 置中數字圓圈 */}
                  <div className="absolute left-[-21px] top-0 w-6 h-6 rounded-full bg-[#8C2D1F] border-2 border-white shadow-md z-10 flex items-center justify-center text-white text-[10px] font-black -translate-x-1/2 group-hover:scale-110 transition-transform">
                    {originalIdx}
                  </div>

                  <div className="flex gap-4 items-center p-3 -m-3 rounded-[24px] hover:bg-stone-50 transition-colors">
                    <img
                      src={spot.images[0]}
                      className="w-20 h-20 rounded-2xl object-cover shadow-sm flex-shrink-0"
                      alt={spot.name}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center pr-2">
                        <h5 className="font-bold text-stone-800 text-base truncate">
                          {spot.name}
                        </h5>
                        <ChevronRight
                          size={14}
                          className="text-stone-300 group-hover:text-[#8C2D1F] transition-colors"
                        />
                      </div>
                      <div className="flex items-center text-stone-400 text-[11px] mt-1 gap-1">
                        <MapPin size={10} />{" "}
                        <span className="truncate">{spot.address}</span>
                      </div>
                      <div className="mt-2.5 flex gap-1.5">
                        {spot.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="text-[9px] bg-stone-50 text-stone-500 px-2.5 py-1 rounded-lg border border-stone-100 font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-stone-200" />
            </div>
            <p className="text-stone-400 text-sm italic text-center">
              目前還沒有已完成的行程喔！
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FootprintsView;
