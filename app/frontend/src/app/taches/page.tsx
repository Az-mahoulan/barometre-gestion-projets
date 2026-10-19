import { ComingSoon } from "@/components/screens/ComingSoon";

export default function TachesPage() {
  return (
    <ComingSoon
      title="Mes tâches"
      icon="task"
      items={[
        "Mes tâches classées : en retard, cette semaine, plus tard",
        "Changement de statut en un geste",
        "Filtre par projet et par priorité",
      ]}
    />
  );
}
