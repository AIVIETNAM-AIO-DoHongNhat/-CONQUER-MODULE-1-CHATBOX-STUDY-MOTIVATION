"use client";

import React from "react";
import Timer from "./Timer";
import { useToast } from "./Toast";

interface RoomShellProps {
  sessionId?: string | number;
}

export default function RoomShell({ sessionId }: RoomShellProps) {
  const toast = useToast();

  return (
    <div className="min-h-[70vh] grid grid-cols-3 gap-6 px-4 py-6">
      <main className="col-span-2 rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Phòng học · Phiên trực tiếp</h2>
          <div className="flex items-center gap-3">
            <Timer sessionId={sessionId} focusSeconds={30 * 60} breakSeconds={5 * 60} cycles={4} onSessionEnd={(r)=>console.log('session end',r)} />
            <button
              type="button"
              onClick={() => toast.info("Bạn đã rời phòng", "Đang thoát...")}
              className="rounded-md bg-[#f1f0ea] px-3 py-1 text-sm"
            >
              Rời phòng
            </button>
          </div>
        </div>

        <div className="h-[56vh] w-full rounded-md bg-[#f7f6f1] flex items-center justify-center text-gray-500">
          Scene (video / canvas / shared area)
        </div>

        <div className="mt-4 flex gap-3">
          <button className="rounded-md bg-[#eef4ef] px-3 py-1 text-sm">Bật camera</button>
          <button className="rounded-md bg-[#f8ece6] px-3 py-1 text-sm">Tắt mic</button>
          <button className="rounded-md bg-white border px-3 py-1 text-sm">Chia sẻ màn hình</button>
        </div>
      </main>

      <aside className="col-span-1 rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">Thành viên</h3>
          <ul className="mt-3 space-y-2">
            <li className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#7a9e7e] flex items-center justify-center text-white">A</div>
                <div>
                  <div className="text-sm font-medium">Minh An</div>
                  <div className="text-xs text-gray-500">Đang tập trung</div>
                </div>
              </div>
              <div className="text-xs text-gray-400">24:18</div>
            </li>
            <li className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#b5764a] flex items-center justify-center text-white">H</div>
                <div>
                  <div className="text-sm font-medium">Thu Hà</div>
                  <div className="text-xs text-gray-500">Đang tập trung</div>
                </div>
              </div>
              <div className="text-xs text-gray-400">41:02</div>
            </li>
          </ul>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold">Ghi chú nhanh</h3>
          <textarea className="mt-2 w-full rounded-md border p-2 text-sm" rows={6} placeholder="Ghi chú buổi học..." />
        </div>
      </aside>
    </div>
  );
}
