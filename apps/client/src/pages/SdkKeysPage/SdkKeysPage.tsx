import { PageLayout } from "../../components";
import { SdkKeysSection } from "./SdkKeysSection";

export function SdkKeysPage() {
  return (
    <PageLayout
      description="Gere, revogue e rotacione SDK keys para o par config/environment selecionado no topo da tela."
      eyebrow="Public SDK"
      title="SDK Keys"
    >
      <SdkKeysSection />
    </PageLayout>
  );
}
