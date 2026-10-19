import { ComingSoon } from "@/components/screens/ComingSoon";

export default function EquipesPage() {
  return (
    <ComingSoon
      title="Équipes"
      icon="users"
      items={[
        "Disponibilité de chacun (bureau, mission, congé, formation)",
        "Charge : tâches en cours et en retard par personne",
        "Projets auxquels chacun participe",
      ]}
    />
  );
}
