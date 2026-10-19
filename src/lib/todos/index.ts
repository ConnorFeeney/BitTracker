import { isDateKey } from "@/lib/dates";
import { createId } from "@/lib/id";
import { storageTransaction } from "@/lib/storage";
import type { Todo, TodoInput, TodoRepository } from "./types";
export type { Todo, TodoInput, TodoRepository } from "./types";

function validate(input: TodoInput): TodoInput {
  const title = input.title.trim();
  if (!title || title.length > 160)
    throw new Error("Use a title between 1 and 160 characters.");
  if (input.dueDate !== null && !isDateKey(input.dueDate))
    throw new Error("Choose a valid due date.");
  const unique = new Map<string, string>();
  for (const value of input.tags) {
    const tag = value.trim();
    if (!tag) continue;
    if (tag.length > 40) throw new Error("Keep tags under 40 characters.");
    if (!unique.has(tag.toLowerCase())) unique.set(tag.toLowerCase(), tag);
  }
  if (unique.size > 20) throw new Error("Use up to 20 tags per item.");
  return { title, dueDate: input.dueDate, tags: [...unique.values()] };
}

const indexedDbTodoRepository: TodoRepository = {
  list: () =>
    storageTransaction("todos", "readonly", (store, result) => {
      const request = store.getAll();
      request.onsuccess = () =>
        result(
          (request.result as Todo[]).sort(
            (a, b) =>
              (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") ||
              a.createdAt.localeCompare(b.createdAt),
          ),
        );
    }),
  create: async (input) => {
    const now = new Date().toISOString();
    const todo: Todo = {
      ...validate(input),
      id: createId(),
      createdAt: now,
      updatedAt: now,
    };
    return storageTransaction("todos", "readwrite", (store, result) => {
      store.add(todo);
      result(todo);
    });
  },
  update: async (id, input) => {
    const next = validate(input);
    return storageTransaction("todos", "readwrite", (store, result, fail) => {
      const request = store.get(id);
      request.onsuccess = () => {
        if (!request.result) {
          fail(new Error("This to-do no longer exists. Refresh your list."));
          return;
        }
        const todo: Todo = {
          ...(request.result as Todo),
          ...next,
          updatedAt: new Date().toISOString(),
        };
        store.put(todo);
        result(todo);
      };
    });
  },
  remove: (id) =>
    storageTransaction("todos", "readwrite", (store, result) => {
      store.delete(id);
      result(undefined);
    }),
};

// Replace this adapter with an authenticated HTTP repository when adding a backend.
export const todoRepository: TodoRepository = indexedDbTodoRepository;
