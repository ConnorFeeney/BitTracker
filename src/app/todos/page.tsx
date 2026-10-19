import type { Metadata } from "next";
import { TodosPage } from "@/components/todos-page";

export const metadata: Metadata = { title: "To-dos · Bit Tracker" };
export default function Page() {
  return <TodosPage />;
}
