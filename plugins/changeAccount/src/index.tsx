import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";

const { FormRow, FormSection } = Forms;

export default {
  getSettingsPanel() {
    return () => (
      <FormSection title="Test Ayarı">
        <FormRow
          label="Test Butonu"
          onPress={() => showToast("Butona basıldı!")}
        />
      </FormSection>
    );
  },
};
