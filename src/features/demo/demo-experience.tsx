"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Leaf, RotateCcw, Sparkles, Users, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IslandScene } from "@/features/island/components/island-scene";
import { positionWithinZone, zoneForObjectType } from "@/features/island/lib/placementZones";
import type { IslandData, IslandMemoryRecord, IslandObjectRecord, IslandObjectType } from "@/features/island/types";
import { CATEGORY_LABELS, DEMO_FAMILY, INITIAL_MEMORIES, INITIAL_OBJECTS } from "./data";
import type { DemoCategory, DemoMember } from "./types";

const MEMBERS: DemoMember[] = ["Mom", "Dad", "Jocelyn", "Me"];
const CATEGORIES = Object.keys(CATEGORY_LABELS) as DemoCategory[];
const REWARD_VARIANTS: Record<DemoCategory, Array<{ type: IslandObjectType; assetKey: string; name: string }>> = {
  everyday: [
    { type: "flower", assetKey: "flowers_meadow_webp_01", name: "Today’s meadow flowers" },
    { type: "garden", assetKey: "mushrooms_red_webp_01", name: "Little memory mushrooms" },
  ],
  celebration: [
    { type: "tree", assetKey: "tree_deciduous_webp_01", name: "Celebration tree" },
    { type: "flower", assetKey: "flowers_meadow_webp_01", name: "Celebration blossoms" },
  ],
  gratitude: [
    { type: "lantern", assetKey: "lantern_path_webp_01", name: "Gratitude lantern" },
    { type: "flower", assetKey: "flowers_meadow_webp_01", name: "Warm thank-you flowers" },
  ],
  adventure: [
    { type: "tree", assetKey: "tree_pine_webp_01", name: "Adventure pine" },
    { type: "garden", assetKey: "mushrooms_red_webp_01", name: "Trailside mushrooms" },
  ],
};

const meaningfulLength = (value: string) => value.replace(/\s/g, "").length;

export function DemoExperience() {
  const [memories, setMemories] = useState<IslandMemoryRecord[]>(INITIAL_MEMORIES);
  const [objects, setObjects] = useState<IslandObjectRecord[]>(INITIAL_OBJECTS);
  const [waitingRewards, setWaitingRewards] = useState<IslandObjectRecord[]>([]);
  const [streak, setStreak] = useState(DEMO_FAMILY.streak);
  const [composerOpen, setComposerOpen] = useState(false);
  const [content, setContent] = useState("");
  const [member, setMember] = useState<DemoMember>("Me");
  const [category, setCategory] = useState<DemoCategory>("everyday");
  const [revealObjectId, setRevealObjectId] = useState<string>();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const valid = meaningfulLength(content) >= 5 && content.length <= 300;
  const data = useMemo<IslandData>(() => ({ growthLevel: streak, objects, waitingRewards }), [objects, streak, waitingRewards]);

  const closeComposer = useCallback(() => {
    setComposerOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  const submitMemory = useCallback(() => {
    if (!valid) return;
    const id = `demo-memory-${Date.now()}`;
    const visitorMemoryCount = memories.length - INITIAL_MEMORIES.length;
    const variants = REWARD_VARIANTS[category];
    const config = variants[visitorMemoryCount % variants.length]!;
    const zone = zoneForObjectType(config.type);
    const suggestedPosition = positionWithinZone(zone, objects.filter((object) => zoneForObjectType(object.objectType) === zone).length + 3);
    const createdAt = new Date().toISOString();
    const memory: IslandMemoryRecord = { id, authorName: member, content: content.trim(), category: CATEGORY_LABELS[category], createdAt };
    const islandObject: IslandObjectRecord = {
      id: `demo-object-${id}`,
      memoryId: id,
      objectType: config.type,
      assetKey: config.assetKey,
      // This is only the initial preview location. The visitor chooses the
      // final coordinates through IslandScene's production placement surface.
      positionX: suggestedPosition.positionX,
      positionY: suggestedPosition.positionY,
      zIndex: suggestedPosition.zIndex,
      scale: config.type === "lantern" ? .68 : .8,
      rotation: category === "adventure" ? -2 : 1,
      unlockedAt: createdAt,
      name: config.name,
      linkedMemorySummary: memory.content,
      placementZone: zone,
      placementStatus: "pending_placement",
    };

    // Commit memory first, then create the production-shaped object that resolves it by memoryId.
    setMemories((current) => [...current, memory]);
    setWaitingRewards([islandObject]);
    setStreak((current) => current + 1);
    setComposerOpen(false);
    setRevealObjectId(undefined);
    setContent("");
  }, [category, content, member, memories.length, objects, valid]);

  const handleObjectPlaced = useCallback((placed: IslandObjectRecord) => {
    setWaitingRewards((current) => current.filter((object) => object.id !== placed.id));
    setObjects((current) => [...current.filter((object) => object.id !== placed.id), placed]);
    setRevealObjectId(placed.id);
  }, []);

  useEffect(() => {
    if (composerOpen) window.setTimeout(() => textareaRef.current?.focus(), 60);
  }, [composerOpen]);

  useEffect(() => {
    if (!composerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeComposer();
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && valid) {
        event.preventDefault();
        submitMemory();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeComposer, composerOpen, submitMemory, valid]);

  const restart = () => {
    if (memories.length > INITIAL_MEMORIES.length && !window.confirm("Restart the demo and remove the memory you wrote?")) return;
    setMemories(INITIAL_MEMORIES);
    setObjects(INITIAL_OBJECTS);
    setWaitingRewards([]);
    setStreak(DEMO_FAMILY.streak);
    setRevealObjectId(undefined);
    setComposerOpen(false);
    setContent("");
    setMember("Me");
    setCategory("everyday");
  };

  return (
    <main className="demo-shell demo-product-shell">
      <header className="demo-header">
        <div className="demo-brand"><span className="demo-brand-mark"><Leaf size={17} /></span><span>Family Island</span></div>
        <div className="demo-badge"><span aria-hidden="true" /> Interactive Demo · No account required</div>
        <button className="demo-restart" type="button" onClick={restart}><RotateCcw size={15} /> Restart Demo</button>
      </header>

      <section className="demo-product-intro">
        <div><p className="demo-eyebrow">{DEMO_FAMILY.name}</p><h1>Your family’s island</h1><p>Write a family memory and watch it become part of your island.</p></div>
        <div className="demo-product-stats"><span><Sparkles size={14} /><strong>{streak}</strong> day streak</span><span><Users size={14} /><strong>{DEMO_FAMILY.members.length}</strong> members</span></div>
      </section>

      <section className="demo-production-island" aria-label="Interactive Family Island demo">
        <IslandScene data={data} memories={memories} revealObjectId={revealObjectId} demoMode allowObjectManagement={false} onObjectPlaced={handleObjectPlaced} />
        <div className="demo-floating-action">
          <div><span>Today’s ritual</span><strong>{waitingRewards.length ? "Choose where this memory will grow" : revealObjectId ? "A new memory is growing" : "Add one small family moment"}</strong></div>
          <button ref={triggerRef} type="button" onClick={() => setComposerOpen(true)} disabled={waitingRewards.length > 0}><Sparkles size={16} /> {waitingRewards.length ? "Memory ready to plant" : "Add Today’s Memory"}</button>
        </div>
      </section>

      <AnimatePresence>
        {composerOpen ? (
          <motion.div className="demo-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) closeComposer(); }}>
            <motion.section className="demo-composer" role="dialog" aria-modal="true" aria-labelledby="composer-title" initial={{ opacity: 0, y: 22, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16 }}>
              <button className="demo-modal-close" type="button" aria-label="Close memory composer" onClick={closeComposer}><X size={18} /></button>
              <p className="demo-eyebrow">TODAY’S MEMORY</p>
              <h2 id="composer-title">What is one small moment you want your family to remember today?</h2>
              <label className="demo-field-label" htmlFor="demo-memory">Your memory</label>
              <div className="demo-textarea-wrap"><textarea ref={textareaRef} id="demo-memory" value={content} maxLength={300} onChange={(event) => setContent(event.target.value)} placeholder="We cooked dinner together and laughed when the first pancake fell apart…" rows={5} /><span className={content.length > 280 ? "is-near-limit" : ""}>{content.length}/300</span></div>
              <div className="demo-form-grid">
                <fieldset><legend>Who shared it?</legend><div className="demo-choice-row">{MEMBERS.map((item) => <button key={item} type="button" className={member === item ? "is-selected" : ""} onClick={() => setMember(item)}>{item}</button>)}</div></fieldset>
                <fieldset><legend>What kind of moment?</legend><div className="demo-category-grid">{CATEGORIES.map((item) => <button key={item} type="button" className={category === item ? "is-selected" : ""} onClick={() => setCategory(item)}><span aria-hidden="true" />{CATEGORY_LABELS[item]}</button>)}</div></fieldset>
              </div>
              <div className="demo-composer-actions"><button type="button" onClick={closeComposer}>Cancel</button><button type="button" className="is-primary" disabled={!valid} onClick={submitMemory}><Leaf size={16} /> Grow This Memory</button></div>
              <p className="demo-keyboard-hint">Press ⌘/Ctrl + Enter to grow when ready.</p>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
