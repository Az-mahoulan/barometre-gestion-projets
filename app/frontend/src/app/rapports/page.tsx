import { ComingSoon } from "@/components/screens/ComingSoon";

export default function RapportsPage() {
  return (
    <ComingSoon
      title="Rapports"
      icon="chart"
      items={[
        "Synthèse par projet et par pays",
        "Évolution mensuelle des jalons",
        "Export PDF et Excel",
      ]}
    />
  );
}
