"use client";

import { useState } from "react";
import { readApiError } from "@/lib/api";
import {
  useTodos,
  useCreateTodo,
  useToggleTodo,
  useDeleteTodo,
} from "@/hooks/useTodos";
import { useToast } from "./Toast";

function CheckIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function TrashIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function NoteIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

export default function TodoList({
  className = "",
  scrollList = false,
}: {
  className?: string;
  scrollList?: boolean;
}) {
  const toast = useToast();
  const [title, setTitle] = useState("");

  const { data, isLoading, isError, error, refetch } = useTodos();
  const createMutation = useCreateTodo();
  const toggleMutation = useToggleTodo();
  const deleteMutation = useDeleteTodo();

  const todos = data?.results ?? [];
  const doneCount = todos.filter((t) => t.is_done).length;
  const percent = todos.length ? Math.round((doneCount / todos.length) * 100) : 0;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    setTitle("");
    createMutation.mutate(value, {
      onError: (err) => toast.error("Không thêm được công việc", readApiError(err)),
    });
  }

  return (
    <div className={`rounded-3xl border border-[#e8e6df] bg-white p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1b1b19]">
          <NoteIcon className="text-[#5f8a64]" />
          Công việc
        </h2>
        {todos.length > 0 && (
          <span className="rounded-full bg-[#eef4ef] px-2.5 py-0.5 text-xs font-medium text-[#4f6b53]">
            {doneCount}/{todos.length} • {percent}%
          </span>
        )}
      </div>

      {/* Thanh tiến độ buổi học */}
      {todos.length > 0 && (
        <div
          className="mt-3"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Tiến độ buổi học ${percent}%`}
        >
          <div className="h-2 overflow-hidden rounded-full bg-[#eef0ea]">
            <div
              className="h-full rounded-full bg-[#7a9e7e] transition-[width] duration-300 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Ô thêm việc */}
      <form onSubmit={handleAdd} className="mt-3 flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Thêm việc cần làm…"
          aria-label="Thêm việc cần làm"
          className="min-w-0 flex-1 rounded-xl border border-[#e0ddd3] bg-[#fbfaf6] px-3 py-2 text-sm text-[#1b1b19] outline-none transition-colors placeholder:text-[#b0aea6] focus:border-[#7a9e7e] focus:ring-2 focus:ring-[#7a9e7e]/15"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="shrink-0 rounded-xl bg-[#7a9e7e] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#6b8d6f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Thêm
        </button>
      </form>

      {/* Trạng thái tải / lỗi */}
      {isLoading && (
        <div className="mt-4 space-y-2" aria-hidden>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-xl bg-[#f1f0ea]" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
          <p>{readApiError(error, "Không tải được danh sách công việc.")}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Danh sách */}
      {!isLoading && !isError && (
        <ul
          className={`mt-4 space-y-1.5 ${
            scrollList ? "max-h-72 overflow-y-auto pr-1" : ""
          }`}
        >
          {todos.length === 0 && (
            <li className="rounded-xl border border-dashed border-[#e0ddd3] px-3 py-6 text-center text-sm text-[#b0aea6]">
              Chưa có việc nào. Thêm mục tiêu cho buổi học nhé.
            </li>
          )}

          {todos.map((todo) => {
            const pending = todo.id < 0; // item optimistic chưa có id thật
            return (
              <li
                key={todo.id}
                className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-[#fbfaf6]"
              >
                <button
                  type="button"
                  onClick={() =>
                    toggleMutation.mutate({ id: todo.id, is_done: !todo.is_done })
                  }
                  disabled={pending}
                  role="checkbox"
                  aria-checked={todo.is_done}
                  aria-label={todo.is_done ? "Bỏ đánh dấu hoàn thành" : "Đánh dấu hoàn thành"}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors disabled:opacity-50 ${
                    todo.is_done
                      ? "border-[#7a9e7e] bg-[#7a9e7e] text-white"
                      : "border-[#cdcabf] bg-white text-transparent hover:border-[#7a9e7e]"
                  }`}
                >
                  <CheckIcon />
                </button>

                <span
                  className={`flex-1 text-sm transition-colors ${
                    todo.is_done
                      ? "text-[#b0aea6] line-through"
                      : "text-[#1b1b19]"
                  }`}
                >
                  {todo.title}
                </span>

                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(todo.id)}
                  disabled={pending}
                  aria-label="Xóa công việc"
                  className="shrink-0 rounded-lg p-1.5 text-[#b0aea6] opacity-0 transition group-hover:opacity-100 hover:bg-[#f8ece6] hover:text-[#a8503a] focus:opacity-100 disabled:opacity-50"
                >
                  <TrashIcon />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
