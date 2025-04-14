import { React } from '@vendetta/metro/common'
import { Forms } from '@vendetta/ui/components'

const { FormSection, FormRow } = Forms

export default () => {
    return (
        <FormSection title="Boş Sayfa">
            <FormRow
                label="Buraya işlem ekleyeceksin."
                subLabel="İstediğin bileşeni ekleyebilirsin."
            />
        </FormSection>
    )
}
