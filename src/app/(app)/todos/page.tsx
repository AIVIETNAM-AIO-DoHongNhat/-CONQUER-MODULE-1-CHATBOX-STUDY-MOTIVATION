export default function TodosPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-3 px-4 py-8">
      <h1 className="text-2xl font-bold">Công việc</h1>
      <p className="text-gray-600">
        Danh sách todo sẽ hiển thị ở đây (gọi API <code>/api/v1/todos/</code>).
      </p>
    </div>
  );
}
