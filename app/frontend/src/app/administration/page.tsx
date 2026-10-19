import { ComingSoon } from "@/components/screens/ComingSoon";

export default function AdministrationPage() {
  return (
    <ComingSoon
      title="Administration"
      icon="shield"
      items={[
        "Utilisateurs, rôles et accès",
        "Pays et paramètres de l’organisation",
        "Saisie des projets, jalons, livrables et dates clés",
      ]}
    />
  );
}
