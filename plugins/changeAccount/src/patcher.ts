import { React } from '@vendetta/metro/common'
import { getAssetIDByName } from '@vendetta/ui/assets'
import { patchSettingsPin } from '$/lib/pinToSettings'
import CustomSettingsPage from '../components/customSettingsPage'

export default (): (() => void) => {
    const patches: (() => void)[] = []

    patches.push(
        patchSettingsPin({
            key: 'custom-settings-page',
            icon: getAssetIDByName('ic_settings_24px'), // İsteğe göre değiştirilebilir
            title: () => 'Özel Ayar',
            predicate: () => true,
            page: CustomSettingsPage,
        }),
    )

    return () => {
        for (const x of patches) x()
    }
}
