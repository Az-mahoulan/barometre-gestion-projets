import { ComingSoon } from "@/components/screens/ComingSoon";

export default function CalendrierPage() {
  return (
    <ComingSoon
      title="Calendrier"
      icon="calendar"
      items={[
        "Vue mois et semaine des réunions, échéances et jalons",
        "Jalons tenus, dépassés et à venir",
        "Ligne « aujourd’hui » et filtres par projet",
      ]}
    />
  );
}
