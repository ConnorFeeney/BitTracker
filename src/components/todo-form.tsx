"use client";

import { useId, useState, type FormEvent } from "react";
import { Check, LoaderCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Todo, TodoInput } from "@/lib/todos";

export function TodoForm({
  todo,
  suggestions,
  onClose,
  onSave,
}: {
  todo: Todo | null;
  suggestions: string[];
  onClose: () => void;
  onSave: (input: TodoInput, id?: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(todo?.title ?? "");
  const [dueDate, setDueDate] = useState(todo?.dueDate ?? "");
  const [tags, setTags] = useState(todo?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [focused, setFocused] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const listId = useId();
  const matches = suggestions
    .filter(
      (tag) =>
        !tags.some((value) => value.toLowerCase() === tag.toLowerCase()) &&
        tag.toLowerCase().includes(tagInput.trim().toLowerCase()),
    )
    .slice(0, 8);
  const expanded = focused && tagInput.trim().length > 0 && matches.length > 0;
  function addTag(value: string) {
    const tag = value.trim();
    if (!tag) return;
    if (tag.length > 40) {
      setError("Keep tags under 40 characters.");
      return;
    }
    if (tags.length >= 20) {
      setError("Use up to 20 tags per item.");
      return;
    }
    if (!tags.some((value) => value.toLowerCase() === tag.toLowerCase()))
      setTags((all) => [...all, tag]);
    setTagInput("");
    setHighlight(-1);
    setError("");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(
        {
          title,
          dueDate: dueDate || null,
          tags: tagInput.trim() ? [...tags, tagInput.trim()] : tags,
        },
        todo?.id,
      );
      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save the to-do.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto border border-border p-6 sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>{todo ? "Edit to-do" : "Add to-do"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="todo-title">Title</Label>
            <Input
              id="todo-title"
              autoFocus
              required
              maxLength={160}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What needs doing?"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="todo-due">
              Due date{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="todo-due"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="todo-tags">Tags</Label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag.toLowerCase()}
                    className="flex max-w-full items-center gap-1 rounded-md border border-blue-400/20 bg-blue-400/5 px-2 py-1 text-xs text-blue-300"
                  >
                    <span className="truncate">{tag}</span>
                    <button
                      type="button"
                      disabled={saving}
                      aria-label={`Remove tag ${tag}`}
                      onClick={() =>
                        setTags((all) => all.filter((value) => value !== tag))
                      }
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <div className="flex gap-2">
                <Input
                  id="todo-tags"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={expanded}
                  aria-controls={listId}
                  aria-activedescendant={
                    expanded && highlight >= 0 && highlight < matches.length
                      ? `${listId}-${highlight}`
                      : undefined
                  }
                  autoComplete="off"
                  maxLength={40}
                  placeholder="Type a tag, then press Enter"
                  value={tagInput}
                  disabled={saving}
                  onFocus={() => setFocused(true)}
                  onBlur={() => {
                    setFocused(false);
                    setHighlight(-1);
                  }}
                  onChange={(event) => {
                    setTagInput(event.target.value);
                    setHighlight(-1);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown" && matches.length) {
                      event.preventDefault();
                      setHighlight((value) => (value + 1) % matches.length);
                    }
                    if (event.key === "ArrowUp" && matches.length) {
                      event.preventDefault();
                      setHighlight((value) =>
                        value <= 0 ? matches.length - 1 : value - 1,
                      );
                    }
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addTag(
                        expanded && highlight >= 0
                          ? (matches[highlight] ?? tagInput)
                          : tagInput,
                      );
                    }
                    if (event.key === "Escape" && expanded) {
                      event.preventDefault();
                      event.stopPropagation();
                      setFocused(false);
                      setHighlight(-1);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Add tag"
                  disabled={saving || !tagInput.trim()}
                  onClick={() => addTag(tagInput)}
                >
                  <Plus />
                </Button>
              </div>
              {expanded && (
                <ul
                  id={listId}
                  role="listbox"
                  aria-label="Previously used tags"
                  className="mt-1 max-h-40 overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-xl"
                >
                  {matches.map((tag, index) => (
                    <li key={tag} role="presentation">
                      <button
                        id={`${listId}-${index}`}
                        type="button"
                        role="option"
                        aria-selected={highlight === index}
                        tabIndex={-1}
                        className={`w-full truncate rounded px-2 py-2 text-left text-sm hover:bg-secondary ${highlight === index ? "bg-secondary" : ""}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => addTag(tag)}
                      >
                        # {tag}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving ? <LoaderCircle className="animate-spin" /> : <Check />}
              {todo ? "Save changes" : "Add to-do"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
