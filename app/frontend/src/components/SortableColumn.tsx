"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

import { Icon } from "./ui";

export interface SortableCard {
  id: string;
  label: string;
  node: ReactNode;
}

/** Ordre affiché : celui enregistré (cartes connues seulement), puis les cartes absentes dans l'ordre par défaut. */
export function orderCards(cards: SortableCard[], saved: string[] | undefined): SortableCard[] {
  const byId = new Map(cards.map((c) => [c.id, c]));
  const first = (saved ?? []).filter((id) => byId.has(id)).map((id) => byId.get(id)!);
  return [...first, ...cards.filter((c) => !first.includes(c))];
}

/** Carte déplaçable : une poignée apparaît en haut de la carte au survol (ou au clavier). */
function Item({ card }: { card: SortableCard }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`group/drag relative ${isDragging ? "z-30 rounded-[22px] opacity-90 shadow-[0_24px_48px_-20px_rgba(28,29,34,0.45)]" : ""}`}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Déplacer la carte « ${card.label} »`}
        title="Glisser pour déplacer la carte"
        className={`absolute left-1/2 top-1 z-20 grid h-5 w-10 -translate-x-1/2 cursor-grab touch-none place-items-center rounded-full text-muted transition-opacity hover:bg-surface-2 hover:text-ink focus-visible:opacity-100 active:cursor-grabbing ${
          isDragging ? "opacity-100" : "opacity-0 group-hover/drag:opacity-100"
        }`}
      >
        <Icon name="drag" className="h-4 w-4 rotate-90" />
      </button>
      {card.node}
    </div>
  );
}

/** Colonne de cartes réordonnables par glisser-déposer (souris, toucher ou clavier : espace, flèches, espace). */
export function SortableColumn({
  cards,
  onReorder,
  className = "",
}: {
  cards: SortableCard[];
  onReorder: (ids: string[]) => void;
  className?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = cards.map((c) => c.id);
  const end = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    onReorder(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={end}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {cards.map((c) => (
            <Item key={c.id} card={c} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
