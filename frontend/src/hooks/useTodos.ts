"use client";

// CRUD todo cho checklist trong phòng. Theo pattern useProfile/useRooms
// (useQuery + queryKey), thêm optimistic update để tick/thêm/xóa phản hồi tức
// thì ("realtime"), tự rollback khi API lỗi và đồng bộ lại khi settle.

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  listTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  getAccessToken,
  type Todo,
  type Paginated,
} from "@/lib/api";

const KEY = ["todos"] as const;

// Sửa danh sách trong cache phân trang mà giữ nguyên metadata.
function patchCache(qc: QueryClient, updater: (list: Todo[]) => Todo[]) {
  qc.setQueryData<Paginated<Todo>>(KEY, (old) =>
    old ? { ...old, results: updater(old.results) } : old
  );
}

export function useTodos() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => listTodos(),
    enabled: typeof window !== "undefined" && !!getAccessToken(),
    retry: false,
    staleTime: 30 * 1000,
  });
}

export function useCreateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => createTodo(title),
    onMutate: async (title) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<Paginated<Todo>>(KEY);
      // id âm tạm thời để có key ổn định; sẽ được thay khi invalidate.
      const optimistic: Todo = {
        id: -Date.now(),
        title,
        is_done: false,
        order: (prev?.results.length ?? 0) + 1,
        session: null,
        user: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      patchCache(qc, (list) => [...list, optimistic]);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useToggleTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_done }: { id: number; is_done: boolean }) =>
      updateTodo(id, { is_done }),
    onMutate: async ({ id, is_done }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<Paginated<Todo>>(KEY);
      patchCache(qc, (list) =>
        list.map((t) => (t.id === id ? { ...t, is_done } : t))
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTodo(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<Paginated<Todo>>(KEY);
      patchCache(qc, (list) => list.filter((t) => t.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
