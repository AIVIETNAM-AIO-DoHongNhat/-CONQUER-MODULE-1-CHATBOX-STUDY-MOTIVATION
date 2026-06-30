import DailyGoal from "@/components/DailyGoal";
import TodoList from "@/components/TodoList";

export default function TodosPage() {
  return (
    <div
      className="mx-auto max-w-2xl px-4 py-10"
      style={{ fontFamily: "var(--font-be-vietnam), system-ui, sans-serif" }}
    >
      <h1 className="text-2xl font-bold tracking-tight text-[#1b1b19]">Công việc</h1>
      <p className="mt-1 text-sm text-[#6b6b66]">
        Quản lý việc cần làm cho buổi học. Khi đang trong một phiên, công việc sẽ
        gắn với phiên đó.
      </p>
      <div className="mt-6 space-y-4">
        <DailyGoal />
        <TodoList />
      </div>
    </div>
  );
}
