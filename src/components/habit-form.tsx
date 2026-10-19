"use client";

import { useState, type FormEvent } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  habitColors,
  type Habit,
  type HabitColor,
  type HabitInput,
} from "@/lib/habits";

export function HabitForm({
  habit,
  onClose,
  onSave,
}: {
  habit: Habit | null;
  onClose: () => void;
  onSave: (input: HabitInput, id?: string) => Promise<void>;
}) {
  const [name, setName] = useState(habit?.name ?? "");
  const [description, setDescription] = useState(habit?.description ?? "");
  const [color, setColor] = useState<HabitColor>(habit?.color ?? "green");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({ name, description, color }, habit?.id);
      onClose();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not save the habit. Please try again.",
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
        className="border border-border p-6 sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-xl">
            {habit?.id ? "Edit habit" : "Add habit"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="mt-2 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="habit-name">
              Habit name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="habit-name"
              autoFocus
              required
              maxLength={80}
              placeholder="e.g. Read for 20 minutes"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="habit-description">
              Description{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="habit-description"
              maxLength={240}
              placeholder="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={saving}
              className="resize-none"
            />
          </div>
          <fieldset disabled={saving}>
            <legend className="mb-3 text-sm font-medium">Graph color</legend>
            <div className="flex gap-3">
              {Object.entries(habitColors).map(([key, hex]) => (
                <button
                  key={key}
                  type="button"
                  className="flex size-8 items-center justify-center rounded-full border-2 border-transparent outline-offset-4 focus-visible:outline-2 aria-pressed:border-foreground"
                  style={{ background: hex }}
                  aria-label={key}
                  aria-pressed={color === key}
                  onClick={() => setColor(key as HabitColor)}
                >
                  {color === key && <Check className="size-4 text-black" />}
                </button>
              ))}
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? <LoaderCircle className="animate-spin" /> : <Check />}
              {habit?.id ? "Save changes" : "Create habit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
