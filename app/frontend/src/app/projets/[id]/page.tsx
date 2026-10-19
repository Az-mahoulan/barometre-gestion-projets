import { Suspense } from "react";

import { ProjectDetailScreen } from "@/components/screens/ProjectDetailScreen";

// L'identifiant n'est connu qu'à la requête : il est lu dans une zone Suspense (Cache Components).
async function ProjectFromParams({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetailScreen id={id} />;
}

export default function ProjectPage({ params }: PageProps<"/projets/[id]">) {
  return (
    <Suspense fallback={<p className="grid min-h-screen place-items-center text-muted">Chargement…</p>}>
      <ProjectFromParams params={params} />
    </Suspense>
  );
}
