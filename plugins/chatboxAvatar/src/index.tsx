import { after, instead } from "@vendetta/patcher"
import { findByName, findByProps, findByStoreName } from "@vendetta/metro"
import { React } from "@vendetta/metro/common"
import { findInReactTree } from "@vendetta/utils"

const Flux = findByProps("useStateFromStores")
const ChatInputNew = findByProps("Actions", "ExpressionButton")?.default || findByProps("ChatInput")
const Avatar = findByProps("getStatusSize")?.default
const { Pressable } = findByProps("Pressable") || React
const AvatarStuff211 = findByProps("DEFAULT_STATUS_CUTOUT")
let DEFAULT_STATUS_CUTOUT = AvatarStuff211?.DEFAULT_STATUS_CUTOUT || "cutout"
const SelfPresenceStore = findByStoreName("SelfPresenceStore")
const UserStore = findByStoreName("UserStore")
const SelectedChannelStore = findByStoreName("SelectedChannelStore")
const ChannelStore = findByStoreName("ChannelStore")
const showUserProfileActionSheet = findByName("showUserProfileActionSheet", false)
const ActionSheet = findByProps("openLazy", "hideActionSheet")
const StatusPickerActionSheet = findByName("StatusPickerActionSheet", false)
const Settings = findByProps("saveAccountChanges")
const { UserSettingsSections } = findByProps("UserSettingsSections") || { UserSettingsSections: { CUSTOM_STATUS: "CUSTOM_STATUS" } }

function AvatarAction() {
  const self = Flux.useStateFromStores([UserStore], () => UserStore.getCurrentUser())
  const status = Flux.useStateFromStores([SelfPresenceStore], () => SelfPresenceStore.getStatus())
  const channelId = Flux.useStateFromStores([SelectedChannelStore], () => SelectedChannelStore.getCurrentlySelectedChannelId())
  const channel = Flux.useStateFromStores(
    [ChannelStore],
    () => ChannelStore.getChannel(channelId),
    [channelId]
  )

  if(!self) return null
  
  return (
    <Pressable
      style = {{
        height: 40,
        width: 40,
        marginHorizontal: 4,
        flexShrink: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      }}
      onLongPress = { openStatus }
      onPress = { createOpenProfile(self?.id, channel?.id ?? channelId) }
    >
      <Avatar
        user = { self }
        guildId = { channel?.guild_id }
        status = { status }
        avatarDecoration = { self.avatarDecoration }
        animate = { true }
        autoStatusCutout = { DEFAULT_STATUS_CUTOUT }
      />
    </Pressable>
  )
}

function createOpenProfile(userId, channelId) {
  return () => {
    if(showUserProfileActionSheet) {
      showUserProfileActionSheet({
        userId,
        channelId,
      })
    }
  }
}

function openStatus() {
  ActionSheet?.hideActionSheet()
  ActionSheet?.openLazy(
    async () => StatusPickerActionSheet,
    "StatusPicker",
    {
      onSetCustomStatus: () => {
        ActionSheet?.hideActionSheet()
        Settings?.open(UserSettingsSections.CUSTOM_STATUS, null, {
          openWithoutBackstack: true,
        })
      },
    }
  )
}

const patches = []

export default {
  onLoad() {
    const patch = after("render", ChatInputNew, (args, ret) => {
      const insertPoint = findInReactTree(
        ret,
        (x) => x?.children?.[0]?.props?.actions
      )?.children

      if(insertPoint) insertPoint.unshift(<AvatarAction />)
    })
    patches.push(patch)
  },
  onUnload() {
    patches.forEach((unpatch) => unpatch?.())
  },
}
