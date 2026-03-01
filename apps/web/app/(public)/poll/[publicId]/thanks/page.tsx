import Link from "next/link";

export default async function ThanksPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;

  return (
    <main>
      <div className="card grid-gap">
        <h1 className="text-2xl font-semibold">Vote submitted</h1>
        <p className="text-sm text-slate-600">Your vote has been recorded for this poll session.</p>
        <Link href={`/poll/${publicId}/results`} className="btn btn-primary">View results</Link>
      </div>
    </main>
  );
}
