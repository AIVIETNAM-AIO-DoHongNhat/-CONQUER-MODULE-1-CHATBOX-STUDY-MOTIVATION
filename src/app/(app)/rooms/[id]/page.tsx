import RoomShell from "@/components/RoomShell";

interface Props {
  params: { id: string };
}

export default function RoomDetailPage({ params }: Props) {
  const { id } = params;
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <RoomShell sessionId={id} />
    </div>
  );
}
