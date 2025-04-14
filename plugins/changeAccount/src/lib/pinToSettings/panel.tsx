import { NavigationNative } from '@vendetta/metro/common'
import { after } from '@vendetta/patcher'
import { Forms } from '@vendetta/ui/components'
import { findInReactTree } from '@vendetta/utils'

import type { PinToSettingsTabs } from '.'

const { FormSection, FormRow } = Forms

function Section({ tabs }: { tabs: PinToSettingsTabs }) {
    const navigation = NavigationNative.useNavigation()

    return (
        <FormRow
            label={tabs.title()}
            leading={<FormRow.Icon source={tabs.icon} />}
            trailing={
                <>
                    {tabs.trailing ? tabs.trailing() : null}
                    <FormRow.Arrow />
                </>
            }
            onPress={() => {
                const Component = tabs.page
                navigation.navigate('BUNNY_CUSTOM_PAGE', {
                    title: tabs.title(),
                    render: () => <Component />,
                })
            }}
        />
    )
}

export function patchPanelUI(tabs: PinToSettingsTabs, patches: (() => void)[]) {
    const { bunny } = window as any

    try {
        patches.push(
            after(
                'default',
                bunny.metro.findByNameLazy('UserSettingsOverviewWrapper', false),
                (_, ret) => {
                    const UserSettingsOverview = findInReactTree(
                        ret.props.children,
                        n => n.type?.name === 'UserSettingsOverview',
                    )

                    patches.push(
                        after('render', UserSettingsOverview.type.prototype, (_args, res) => {
                            const sections = findInReactTree(
                                res.props.children,
                                n => n?.children?.[1]?.type === FormSection,
                            )?.children

                            if (sections) {
                                sections.splice(4, 0, <Section tabs={tabs} />)
                            }
                        }),
                    )
                },
                true,
            ),
        )
    } catch {
        console.log('Panel UI patch failed')
    }
}
