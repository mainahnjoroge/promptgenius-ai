"use client";

import { useState } from "react";
import { Star, Trash2, FileText } from "lucide-react";
import type { SavedPromptDTO } from "@/lib/dto";
import { cn } from "@/lib/utils";

export function LibraryPanel({
  prompts,
  activeId,
  onSelect,
  onToggleFavorite,
  onDelete,
}: {
  prompts: SavedPromptDTO[];
  activeId?: string;
  onSelect: (p: SavedPromptDTO) => void;
  onToggleFavorite: (id: string, favorite: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [favOnly, setFavOnly] = useState(false);
  const list = favOnly ? prompts.filter((p) => p.favorite) : prompts;

  return (
    <div className="card flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">
          Library <span className="text-muted">({prompts.length})</span>
        </h3>
        <button
          onClick={() => setFavOnly((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs",
            favOnly
              ? "border-brand/50 bg-brand/10 text-brand-soft"
              : "border-border text-muted hover:text-slate-100",
          )}
        >
          <Star className="h-3.5 w-3.5" /> Favorites
        </button>
      </div>

      <div className="scroll-thin -mr-1 flex-1 space-y-2 overflow-auto pr-1">
        {list.length === 0 ? (
          <div className="grid h-full place-items-center px-4 py-10 text-center text-sm text-muted">
            <div>
              <FileText className="mx-auto mb-2 h-6 w-6 opacity-60" />
              {favOnly ? "No favorites yet." : "Saved prompts appear here."}
            </div>
          </div>
        ) : (
          list.map((p) => (
            <div
              key={p.id}
              className={cn(
                "group cursor-pointer rounded-xl border border-border bg-surface-2/40 p-3 transition hover:border-brand/40",
                activeId === p.id && "border-brand/60",
              )}
              onClick={() => onSelect(p)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-100">
                    {p.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {p.industry} · {p.outputType}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(p.id, !p.favorite);
                    }}
                    aria-label="Toggle favorite"
                    className="rounded p-1 text-muted hover:text-brand-soft"
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        p.favorite && "fill-brand text-brand",
                      )}
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(p.id);
                    }}
                    aria-label="Delete"
                    className="rounded p-1 text-muted opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
