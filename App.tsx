import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Plus,
  Map,
  Landmark,
  List,
  Loader2,
  CloudCheck,
  ArrowUpDown,
  Check,
  Filter,
  X,
  RotateCcw,
} from "lucide-react";
import newYearIcon from "/春.png";
import { Spot, DayTab, AVAILABLE_TAGS, TagType } from "./types";
import { INITIAL_SPOTS } from "./data";
import { supabase } from "./lib/supabase";
import SpotCard from "./components/SpotCard";
import SpotDetail from "./components/SpotDetail";
import FootprintsView from "./components/FootprintsView";
import AddSpotForm from "./components/AddSpotForm";

type MainView = "list" | "add" | "history";

const App: React.FC = () => {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [activeTab, setActiveTab] = useState<DayTab>("Day 1");
  const [currentView, setCurrentView] = useState<MainView>("list");
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);
  const syncTimeoutRef = useRef<number | null>(null);

  // 初始化載入
  useEffect(() => {
    const fetchSpots = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("spots")
          .select("*")
          .order("sort_order", { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
          const spotsToInsert = INITIAL_SPOTS.map((s, idx) => ({
            name: s.name,
            description: s.description,
            notes: s.notes,
            images: s.images,
            lat: s.lat,
            lng: s.lng,
            day: s.day,
            tags: s.tags,
            opening_hours: s.openingHours,
            sort_order: idx,
            address: s.address,
            is_visited: false,
          }));

          const { data: inserted, error: insError } = await supabase
            .from("spots")
            .insert(spotsToInsert)
            .select();

          if (insError) throw insError;
          setSpots(mapFromDb(inserted));
        } else {
          setSpots(mapFromDb(data));
        }
      } catch (err) {
        console.error("Supabase fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpots();
  }, []);

  const mapFromDb = (dbData: any[]): Spot[] => {
    return dbData.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      notes: d.notes,
      images: d.images,
      lat: d.lat,
      lng: d.lng,
      day: d.day as DayTab,
      tags: d.tags,
      openingHours: d.opening_hours,
      order: d.sort_order,
      address: d.address,
      isVisited: d.is_visited,
    }));
  };

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (selectedSpot) {
        setSelectedSpot(null);
      } else if (isTagFilterOpen) {
        setIsTagFilterOpen(false);
      } else if (isReorderMode) {
        setIsReorderMode(false);
      } else if (currentView !== "list") {
        setCurrentView("list");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectedSpot, currentView, isReorderMode, isTagFilterOpen]);

  const handleOpenSpot = (spot: Spot) => {
    window.history.pushState({ view: "detail", id: spot.id }, "");
    setSelectedSpot(spot);
  };

  const handleCloseSpot = () => window.history.back();

  const filteredSpots = useMemo(() => {
    let base = spots.filter((s) => s.day === activeTab);

    // 如果在「更多」分頁且有選取標籤，執行聯集篩選
    if (activeTab === "其他景點" && selectedTags.length > 0) {
      base = base.filter((spot) =>
        spot.tags.some((tag) => selectedTags.includes(tag as TagType)),
      );
    }

    return base.sort((a, b) => a.order - b.order);
  }, [spots, activeTab, selectedTags]);

  const handleReorder = (newOrder: Spot[]) => {
    const otherSpots = spots.filter((s) => s.day !== activeTab);
    const reorderedInTab = newOrder.map((item, index) => ({
      ...item,
      order: index,
    }));
    const updatedSpots = [...otherSpots, ...reorderedInTab];
    setSpots(updatedSpots);

    if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = window.setTimeout(async () => {
      setIsSyncing(true);
      try {
        const updates = reorderedInTab.map((s) => ({
          id: s.id,
          name: s.name,
          day: s.day,
          sort_order: s.order,
        }));

        const { error } = await supabase
          .from("spots")
          .upsert(updates, { onConflict: "id" });

        if (error) throw error;
      } catch (err) {
        console.error("Reorder sync error:", err);
      } finally {
        setIsSyncing(false);
      }
    }, 1000);
  };

  const handleMoveToDay = async (spotId: string, targetDay: DayTab) => {
    setIsSyncing(true);
    try {
      const targetDayCount = spots.filter((s) => s.day === targetDay).length;
      const { error } = await supabase
        .from("spots")
        .update({
          day: targetDay,
          sort_order: targetDayCount,
        })
        .eq("id", spotId);

      if (error) throw error;

      setSpots((prev) =>
        prev.map((s) =>
          s.id === spotId ? { ...s, day: targetDay, order: targetDayCount } : s,
        ),
      );
    } catch (err) {
      console.error("Move sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleVisited = async (spotId: string) => {
    const spot = spots.find((s) => s.id === spotId);
    if (!spot) return;

    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from("spots")
        .update({ is_visited: !spot.isVisited })
        .eq("id", spotId);

      if (error) throw error;

      setSpots((prev) =>
        prev.map((s) =>
          s.id === spotId ? { ...s, isVisited: !s.isVisited } : s,
        ),
      );
    } catch (err) {
      console.error("Toggle sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteSpot = async (spotId: string) => {
    if (!window.confirm("確定要刪除這個行程嗎？")) return;

    setIsSyncing(true);
    try {
      const { error } = await supabase.from("spots").delete().eq("id", spotId);
      if (error) throw error;

      setSpots((prev) => prev.filter((s) => s.id !== spotId));
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateSpot = async (id: string, updates: Partial<Spot>) => {
    setIsSyncing(true);
    try {
      const dbUpdates: any = {};
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.openingHours !== undefined)
        dbUpdates.opening_hours = updates.openingHours;
      if (updates.lat !== undefined) dbUpdates.lat = updates.lat;
      if (updates.lng !== undefined) dbUpdates.lng = updates.lng;
      if (updates.isVisited !== undefined)
        dbUpdates.is_visited = updates.isVisited;

      const { error } = await supabase
        .from("spots")
        .update(dbUpdates)
        .eq("id", id);
      if (error) throw error;

      setSpots((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      );
      if (selectedSpot?.id === id) {
        setSelectedSpot((prev) => (prev ? { ...prev, ...updates } : null));
      }
    } catch (err) {
      console.error("Update error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddSpot = async (newSpot: Omit<Spot, "id" | "order">) => {
    setIsSyncing(true);
    try {
      const dbSpot = {
        name: newSpot.name,
        notes: newSpot.notes,
        address: newSpot.address,
        tags: newSpot.tags,
        opening_hours: newSpot.openingHours,
        day: newSpot.day,
        images: newSpot.images,
        lat: newSpot.lat,
        lng: newSpot.lng,
        sort_order: spots.filter((s) => s.day === newSpot.day).length,
        is_visited: false,
      };

      const { data, error } = await supabase
        .from("spots")
        .insert(dbSpot)
        .select();
      if (error) throw error;

      const added = mapFromDb(data)[0];
      setSpots((prev) => [...prev, added]);
      setCurrentView("list");
      setActiveTab(newSpot.day);
    } catch (err) {
      console.error("Add error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleFilterTag = (tag: TagType) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const dayTabs: { id: DayTab; label: string }[] = [
    { id: "Day 1", label: "Day 1" },
    { id: "Day 2", label: "Day 2" },
    { id: "其他景點", label: "更多" },
  ];

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-[#f8f5f0] flex flex-col items-center justify-center text-[#8C2D1F]">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="font-serif font-bold animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div
      className={`max-w-md mx-auto min-h-screen pb-32 bg-[#f8f5f0] overflow-x-hidden ${isReorderMode ? "bg-[#8C2D1F]/5" : ""}`}
    >
      {/* Header */}
      <motion.header
        animate={{ y: isReorderMode ? -20 : 0 }}
        className="pb-12 px-6 bg-[#8C2D1F] text-[#E8D5B7] rounded-b-[40px] shadow-lg sticky top-0 z-50"
      >
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold font-serif tracking-wide">
            {isReorderMode ? "管理行程順序" : "2026 • 在節NAN逃"}
          </h1>
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {isSyncing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CloudCheck
                    size={18}
                    className="text-orange-200 animate-pulse"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            {/* <Landmark
              size={28}
              className="opacity-90 text-orange-200"
              strokeWidth={1.5}
            /> */}
            <img src={newYearIcon} className="w-14" />
          </div>
        </div>
        <p className="text-xs opacity-70 font-light tracking-widest uppercase italic">
          {isReorderMode
            ? `正在調整 ${activeTab} 的順序`
            : activeTab === "其他景點" && selectedTags.length > 0
              ? `已篩選 ${selectedTags.length} 個標籤`
              : "02/17 - 02/18 • TU & 尾中"}
        </p>
      </motion.header>

      {/* Tabs */}
      {!isReorderMode && currentView === "list" && (
        <div className="px-6 -mt-8 sticky top-[100px] z-[60]">
          <div className="flex bg-white shadow-xl p-1.5 rounded-2xl border border-stone-100">
            {dayTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== "其他景點") setSelectedTags([]); // 切換回 Day1/Day2 時重置篩選
                }}
                className={`flex-1 flex flex-col items-center py-2.5 px-1 rounded-xl transition-all duration-300 relative ${
                  activeTab === tab.id ? "text-[#8C2D1F]" : "text-stone-400"
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-orange-50 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 text-xs font-bold uppercase tracking-tighter">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main
        className={`px-6 pt-12 min-h-[60vh] ${isReorderMode ? "pt-8" : ""}`}
      >
        <AnimatePresence mode="wait">
          {currentView === "list" && (
            <motion.div
              key="list-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* List Header Actions */}
              <div className="mb-6 flex justify-between items-start px-1">
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold font-serif text-stone-800">
                    {activeTab === "其他景點"
                      ? "其他景點"
                      : `${activeTab} 行程`}
                  </h2>
                  <span className="text-[10px] text-stone-400 font-medium mt-1">
                    {filteredSpots.length} 個景點
                  </span>
                </div>

                {activeTab === "其他景點" ? (
                  <button
                    onClick={() => setIsTagFilterOpen(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                      selectedTags.length > 0
                        ? "bg-[#8C2D1F] text-[#E8D5B7] border-[#8C2D1F]"
                        : "bg-white text-stone-600 border-stone-100"
                    }`}
                  >
                    <Filter size={14} /> 篩選標籤{" "}
                    {selectedTags.length > 0 && `(${selectedTags.length})`}
                  </button>
                ) : (
                  <button
                    onClick={() => setIsReorderMode(!isReorderMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                      isReorderMode
                        ? "bg-[#8C2D1F] text-[#E8D5B7] border-[#8C2D1F]"
                        : "bg-white text-stone-600 border-stone-100"
                    }`}
                  >
                    {isReorderMode ? (
                      <>
                        完成 <Check size={14} />
                      </>
                    ) : (
                      <>
                        調整順序 <ArrowUpDown size={14} />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Spots List / Reorder Container */}
              <div
                className={
                  isReorderMode
                    ? "bg-[#8C2D1F]/5 p-4 rounded-3xl border border-dashed border-[#8C2D1F]/20 mb-12"
                    : ""
                }
              >
                <Reorder.Group
                  axis="y"
                  values={filteredSpots}
                  onReorder={handleReorder}
                  className="space-y-4"
                >
                  {filteredSpots.map((spot, index) => (
                    <SpotCard
                      key={spot.id}
                      spot={spot}
                      index={index}
                      onClick={handleOpenSpot}
                      onMoveToDay={handleMoveToDay}
                      onToggleVisited={handleToggleVisited}
                      onDelete={handleDeleteSpot}
                      isReorderMode={isReorderMode}
                    />
                  ))}
                  {filteredSpots.length === 0 && (
                    <div className="text-center py-20">
                      <p className="text-stone-400 text-sm italic">
                        目前沒有符合條件的景點
                      </p>
                    </div>
                  )}
                </Reorder.Group>
              </div>
            </motion.div>
          )}

          {currentView === "add" && (
            <motion.div
              key="add-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AddSpotForm
                onAdd={handleAddSpot}
                defaultDay={activeTab}
                onCancel={() => setCurrentView("list")}
              />
            </motion.div>
          )}

          {currentView === "history" && (
            <motion.div
              key="history-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <FootprintsView spots={spots} onSpotClick={handleOpenSpot} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Tag Filter Pop-up */}
      <AnimatePresence>
        {isTagFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTagFilterOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-[#f8f5f0] rounded-t-[40px] z-[210] p-8 max-h-[80vh] overflow-y-auto no-scrollbar shadow-2xl border-t border-white"
            >
              <div className="w-12 h-1.5 bg-stone-300/40 rounded-full mx-auto mb-8" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold font-serif text-stone-800">
                  篩選感興趣的標籤
                </h3>
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-xs font-bold text-[#8C2D1F] flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <RotateCcw size={12} /> 重設
                </button>
              </div>

              <div className="flex flex-wrap gap-3 mb-10">
                {AVAILABLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleFilterTag(tag)}
                    className={`px-5 py-3 rounded-2xl text-sm font-bold border transition-all ${
                      selectedTags.includes(tag)
                        ? "bg-[#8C2D1F] border-[#8C2D1F] text-[#E8D5B7] shadow-lg shadow-red-900/10"
                        : "bg-white border-stone-200 text-stone-500 hover:border-orange-200"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsTagFilterOpen(false)}
                  className="flex-1 py-4 bg-[#8C2D1F] text-[#E8D5B7] rounded-2xl font-bold shadow-xl active:scale-95 transition-transform"
                >
                  套用篩選
                </button>
                <button
                  onClick={() => setIsTagFilterOpen(false)}
                  className="p-4 bg-white text-stone-400 rounded-2xl border border-stone-100 shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      {!isReorderMode && !isTagFilterOpen && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[360px] bg-[#1a2e23] rounded-3xl p-1.5 flex justify-around items-center shadow-2xl z-[100] border border-white/10">
          {[
            { id: "list", icon: <List size={22} />, label: "清單" },
            {
              id: "add",
              icon: <Plus size={26} />,
              label: "新增",
              highlight: true,
            },
            { id: "history", icon: <Map size={22} />, label: "足跡" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (currentView !== item.id) {
                  window.history.pushState({ view: item.id }, "");
                  setCurrentView(item.id as MainView);
                }
              }}
              className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl transition-all duration-300 relative ${
                currentView === item.id ? "text-white" : "text-white/40"
              }`}
            >
              {currentView === item.id && (
                <motion.div
                  layoutId="navGlow"
                  className={`absolute inset-0 rounded-2xl ${item.highlight ? "bg-orange-400/20" : "bg-white/10"}`}
                />
              )}
              <div
                className={`relative z-10 flex flex-col items-center gap-1 ${item.highlight && currentView === item.id ? "text-orange-400" : ""}`}
              >
                {item.icon}
                <span className="text-[10px] font-bold tracking-wider">
                  {item.label}
                </span>
              </div>
            </button>
          ))}
        </nav>
      )}

      <AnimatePresence>
        {selectedSpot && (
          <SpotDetail
            spot={selectedSpot}
            onClose={handleCloseSpot}
            onUpdateSpot={handleUpdateSpot}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
