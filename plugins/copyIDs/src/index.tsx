import { before } from "@vendetta/patcher"
import { findByName, findByProps } from "@vendetta/metro"
import { React, clipboard } from "@vendetta/metro/common"
import { showToast } from "@vendetta/ui/toasts"
import { getAssetIDByName } from "@vendetta/ui/assets"
import { Forms } from "@vendetta/ui/components"

const { FormRow } = Forms
const ActionSheet = findByProps("openLazy", "hideActionSheet")
const UserProfileSheet = findByName("UserProfileSheet", false)
const ChannelProfileSheet = findByName("ChannelProfileSheet", false)
const MessageProfileSheet = findByName("MessageProfileSheet", false)
const GuildProfileSheet = findByName("GuildProfileSheet", false)
const EmojiProfileSheet = findByName("EmojiProfileSheet", false) || findByName("EmojiInfoSheet", false)
const RoleProfileSheet = findByName("RoleProfileSheet", false) || findByName("RoleInfoSheet", false)

interface ProfileSheetProps {
  children?: (props: any) => React.ReactNode
  userId?: string
  channelId?: string
  messageId?: string
  guildId?: string
  emojiId?: string
  roleId?: string
  [key: string]: any
}

function addCopyIDOption(sheet: React.ComponentType<ProfileSheetProps>, id: string, type: string = "ID") {
  if(!sheet || !id) return

  before("default", sheet, (args: [ProfileSheetProps]) => {
    const [props] = args
    if(!props?.children) return

    const originalChildren = props.children
    props.children = (childProps: any) => {
      const children = originalChildren(childProps)
      
      const newChildren = React.Children.toArray(children)
      newChildren.push(
        <FormRow
          label = { `Copy ${type}` }
          leading = { <FormRow.Icon source = { getAssetIDByName("copy") } /> }
          onPress = { () => {
            clipboard.setString(id)
            showToast(`${type} successfully copied: ${id}`, getAssetIDByName("check"))
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
    
    if(UserProfileSheet) {
      patches.push(
        before("default", UserProfileSheet, (args: [ProfileSheetProps]) => {
          const userId = args[0]?.userId
          if(userId) addCopyIDOption(UserProfileSheet, userId, "User ID")
        })
      )
    }
    
    if(ChannelProfileSheet) {
      patches.push(
        before("default", ChannelProfileSheet, (args: [ProfileSheetProps]) => {
          const channelId = args[0]?.channelId
          if(channelId) addCopyIDOption(ChannelProfileSheet, channelId, "Channel ID")
        })
      )
    }
    
    if(MessageProfileSheet) {
      patches.push(
        before("default", MessageProfileSheet, (args: [ProfileSheetProps]) => {
          const messageId = args[0]?.messageId
          if(messageId) addCopyIDOption(MessageProfileSheet, messageId, "Message ID")
        })
      )
    }
    
    if(GuildProfileSheet) {
      patches.push(
        before("default", GuildProfileSheet, (args: [ProfileSheetProps]) => {
          const guildId = args[0]?.guildId
          if(guildId) addCopyIDOption(GuildProfileSheet, guildId, "Guild ID")
        })
      )
    }
    
    if(EmojiProfileSheet) {
      patches.push(
        before("default", EmojiProfileSheet, (args: [ProfileSheetProps]) => {
          const emojiId = args[0]?.emojiId || args[0]?.emoji?.id
          if(emojiId) addCopyIDOption(EmojiProfileSheet, emojiId, "Emoji ID")
        })
      )
    }
    
    if(RoleProfileSheet) {
      patches.push(
        before("default", RoleProfileSheet, (args: [ProfileSheetProps]) => {
          const roleId = args[0]?.roleId || args[0]?.role?.id
          if(roleId) addCopyIDOption(RoleProfileSheet, roleId, "Role ID")
        })
      )
    }
    
    return () => patches.forEach(p => p())
  },
}
