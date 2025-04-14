import { before } from "@vendetta/patcher"
import { findByName, findByProps, findByStoreName } from "@vendetta/metro"
import { React, clipboard } from "@vendetta/metro/common"
import { showToast } from "@vendetta/ui/toasts"
import { getAssetIDByName } from "@vendetta/ui/assets"
import { Forms } from "@vendetta/ui/components"

const { FormRow } = Forms
const UserProfileSheet = findByName("UserProfileSheet", false)
const ChannelProfileSheet = findByName("ChannelProfileSheet", false)
const MessageProfileSheet = findByName("MessageProfileSheet", false)
const GuildProfileSheet = findByName("GuildProfileSheet", false)
const RoleProfileSheet = findByName("RoleProfileSheet", false)
const EmojiProfileSheet = findByName("EmojiProfileSheet", false)
const ActionSheet = findByProps("openLazy", "hideActionSheet")

function addCopyIDOption(sheet, id) {
  if(!sheet || !id) return;

  before("default", sheet, (args) => {
    const [props] = args
    if(!props?.children) return

    const originalChildren = props.children
    props.children = (props) => {
      const children = originalChildren(props)
      
      const newChildren = React.Children.toArray(children)
      newChildren.push(
        <FormRow
          label = "Copy ID"
          leading={<FormRow.Icon source = { getAssetIDByName("copy")} /> }
          onPress={() => {
            clipboard.setString(id)
            showToast("ID successfully copied.", getAssetIDByName("check"))
            ActionSheet.hideActionSheet()
          }}
        />
      )  
      return newChildren
    }
  })
}

export default {
  onLoad() {
    const patches = []
    
    patches.push(
      before("default", UserProfileSheet, (args) => {
        const userId = args[0]?.userId
        if(userId) addCopyIDOption(UserProfileSheet, userId)
      })
    )
    
    patches.push(
      before("default", ChannelProfileSheet, (args) => {
        const channelId = args[0]?.channelId
        if(channelId) addCopyIDOption(ChannelProfileSheet, channelId)
      })
    )
    
    patches.push(
      before("default", MessageProfileSheet, (args) => {
        const messageId = args[0]?.messageId
        if (messageId) addCopyIDOption(MessageProfileSheet, messageId)
      })
    )
    
    patches.push(
      before("default", GuildProfileSheet, (args) => {
        const guildId = args[0]?.guildId
        if (guildId) addCopyIDOption(GuildProfileSheet, guildId)
      })
    )

    patches.push(
      before("default", RoleProfileSheet, (args) => {
        const roleId = args[0]?.roleId
        if(roleId) addCopyIDOption(RoleProfileSheet, roleId)
      })
    )

    patches.push(
      before("default", EmojiProfileSheet, (args) => {
      const emojiId = args[0]?.emojiId
      if(emojiId) addCopyIDOption(EmojiProfileSheet, emojiId)
      })
    )
         
    return () => patches.forEach(p => p())
  },
}
