import { ComingSoon } from "@/components/screens/ComingSoon";

export default function NotificationsPage() {
  return (
    <ComingSoon
      title="Notifications"
      icon="bell"
      items={[
        "Échéances proches et retards",
        "Relances reçues et tâches à approuver",
        "Marquer comme lu",
      ]}
    />
  );
}
