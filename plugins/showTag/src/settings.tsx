import { storage } from "@vendetta/plugin"
import { useProxy } from "@vendetta/storage"
import { General } from "@vendetta/ui/components"
import { findByProps } from "@vendetta/metro"
import { React } from "@vendetta/metro/common"
import { getAssetIDByName } from "@vendetta/ui/assets"

const { ScrollView } = General
const { TableRowGroup, TableSwitchRow, TableRowIcon } = findByProps("TableRowGroup")

export default function PastelizeSettings() {
  useProxy(storage)

  const IconPersonStatus = (
    <TableRowIcon
      source = { getAssetIDByName("ic_person_status") }
      variant = "blurple"
    />
  )

  return (
    <ScrollView style = {{ flex: 1 }}>
      <TableRowGroup>
        <TableSwitchRow
          label = "Only show usernames"
          icon = { IconPersonStatus }
          value = { storage.onlyUsername ?? false }
          onValueChange = { (value: boolean) => (storage.onlyUsername = value) }
        />
      </TableRowGroup>
    </ScrollView>
  )
}
