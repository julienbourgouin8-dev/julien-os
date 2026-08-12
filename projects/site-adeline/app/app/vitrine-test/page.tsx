import VitrineArcInPlace from "@/components/VitrineArcInPlace";

export default function VitrineTestPage() {
  return (
    <main className="min-h-screen bg-paper py-16">
      <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink/40">
        Test — version &quot;sur place&quot;, pas final
      </p>
      <VitrineArcInPlace />
    </main>
  );
}
