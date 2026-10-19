export interface TodoInput {
  title: string;
  dueDate: string | null;
  tags: string[];
}
export interface Todo extends TodoInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}
/** Completed items are removed, so list() contains only active items. */
export interface TodoRepository {
  list(): Promise<Todo[]>;
  create(input: TodoInput): Promise<Todo>;
  update(id: string, input: TodoInput): Promise<Todo>;
  remove(id: string): Promise<void>;
}
