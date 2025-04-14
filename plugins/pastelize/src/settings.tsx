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

  const IconTag = (
    <TableRowIcon source = { getAssetIDByName("ic_tag") } variant = "blurple" />
  )
  const IconWebhook = (
    <TableRowIcon
      source = { getAssetIDByName("ic_webhook_24px") }
      variant = "blurple"
    />
  )
  const IconMessages = (
    <TableRowIcon source = { getAssetIDByName("ic_messages") } variant = "blurple" />
  )

  return (
    <ScrollView style = {{ flex: 1 }}>
      <TableRowGroup>
        <TableSwitchRow
          label = "Pastelize all"
          subLabel = "Ignores checking for no role"
          icon = { IconTag }
          value = { storage.pastelizeAll ?? false }
          onValueChange = { (value: boolean) => (storage.pastelizeAll = value) }
        />
        <TableSwitchRow
          label = "Pastelize webhooks by display name"
          subLabel = "Otherwise uses the webhook ID"
          icon = { IconWebhook }
          value = { storage.webhookName ?? true }
          onValueChange = { (value: boolean) => (storage.webhookName = value) }
        />
        <TableSwitchRow
          label = "Pastelize message content"
          subLabel = "Use RoleColorEverywhere for coloring if not using Pastelize All. Same caveats with tapping message content apply."
          icon = { IconMessages }
          value = { storage.pastelizeContent ?? false }
          onValueChange = { (value: boolean) => (storage.pastelizeContent = value) }
        />
      </TableRowGroup>
    </ScrollView>
  )
}
