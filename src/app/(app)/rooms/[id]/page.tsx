import RoomShell from "@/components/RoomShell";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RoomDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <RoomShell sessionId={id} />
    </div>
  );
}
