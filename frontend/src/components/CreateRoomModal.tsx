"use client";

import { useState } from "react";
import { createRoom, readApiError, type CreateRoomInput, type Room } from "@/lib/api";
import { useToast } from "@/components/Toast";

// Modal tạo phòng mới. Gọi API rồi báo cho cha qua onCreated (cha tự làm mới
// danh sách/điều hướng tuỳ trang). Dùng chung cho /rooms và /my-rooms.
export default function CreateRoomModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (room: Room) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [maxUsers, setMaxUsers] = useState("8");
  const [submitting, setSubmitting] = useState(false);

  const maxUsersNum = parseInt(maxUsers, 10);
  const canSubmit =
    name.trim().length > 0 &&
    Number.isFinite(maxUsersNum) &&
    maxUsersNum >= 1 &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const payload: CreateRoomInput = {
      name: name.trim(),
      max_users: maxUsersNum,
      ...(category.trim() ? { category: category.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
    };
    try {
      const room = await createRoom(payload);
      toast.success("Đã tạo phòng", `Phòng "${room.name}" đã sẵn sàng.`);
      onCreated(room);
    } catch (err) {
      toast.error(
        "Tạo phòng thất bại",
        readApiError(err, "Không tạo được phòng. Kiểm tra lại thông tin nhé.")
      );
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1b1b19]/45 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border border-[#ece9e1] bg-white shadow-[0_30px_80px_-30px_rgba(27,27,25,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#efece4] px-6 py-4">
          <h2 className="text-lg font-bold tracking-tight text-gray-900">
            Tạo phòng học mới
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          <label className="block text-sm font-medium text-gray-700">
            Tên phòng <span className="text-[#b45454]">*</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Research - Deep Work sáng"
              maxLength={255}
              autoFocus
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#7a9e7e] focus:ring-2 focus:ring-[#7a9e7e]/20"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-gray-700">
            Danh mục / Track
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="VD: Research, Product, NonTech"
              maxLength={120}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#7a9e7e] focus:ring-2 focus:ring-[#7a9e7e]/20"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-gray-700">
            Mô tả
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về không gian học của phòng..."
              rows={3}
              className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#7a9e7e] focus:ring-2 focus:ring-[#7a9e7e]/20"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-gray-700">
            Số người tối đa <span className="text-[#b45454]">*</span>
            <input
              type="number"
              min={1}
              max={100}
              value={maxUsers}
              onChange={(e) => setMaxUsers(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-[#7a9e7e] focus:ring-2 focus:ring-[#7a9e7e]/20"
            />
          </label>

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl bg-[#7a9e7e] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#6b8d6f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Đang tạo..." : "Tạo phòng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
