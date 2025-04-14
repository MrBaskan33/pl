import { after } from "@vendetta/patcher"
import { findByName, findByStoreName, findByProps } from "@vendetta/metro"
import { storage } from "@vendetta/plugin"
import { pastelize } from "./util"

const RowManager = findByName("RowManager")
const GuildMemberStore = findByStoreName("GuildMemberStore")
const ColorUtils = findByProps("int2hex")

let unpatch: Function

function recurseNodeForMentions(
  nodes: Record<string, any>[],
  guildId: string | null,
) {
  for(const node of nodes) {
    if(
      node.type == "mention" &&
      node.userId != null &&
      node.colorString == null
    ) {
      const member = GuildMemberStore.getMember(guildId, node.userId)
      if(guildId != null && member == null) return

      const colorHex = ColorUtils.int2hex(pastelize(node.userId, 0.85, 0.75))
      const color = ColorUtils.hex2int(colorHex)
      node.roleColor = color
      node.color = color
      node.colorString = colorHex
    } else if(Array.isArray(node.content)) {
      recurseNodeForMentions(node.content, guildId)
    }
  }
}

function processMessage(
  message: Record<string, any>,
  rowMessage: Record<string, any> | null,
) {
  const member = GuildMemberStore.getMember(message.guildId, message.authorId)

  if(message.content) {
    recurseNodeForMentions(message.content, message.guildId)
  }

  if(message.guildId && member == null && rowMessage?.webhookId == null)
  return

  const pastelizeAll = storage.pastelizeAll ?? false
  const webhookName = storage.webhookName ?? true
  const pastelizeContent = storage.pastelizeContent ?? false

  let toHash: string | null
  if(rowMessage?.webhookId != null) {
    if(webhookName) {
      toHash = message.username
    } else {
      toHash = rowMessage.webhookId
    }
  } else {
    if(
      (!(rowMessage?.colorString ?? message.roleColor) && !pastelizeAll) ||
      pastelizeAll
    ) {
      toHash = message.authorId
    }
  }

  if(toHash) {
    const color = pastelize(toHash)
    message.roleColor = color
    message.usernameColor = color
    message.colorString = color

    if(pastelizeContent && message.content) {
      const messageColor = pastelize(toHash, 0.85, 0.75)
      message.content = [
        {
          content: message.content,
          type: "link",
          target: "usernameOnClick",
          context: {
            username: 1,
            usernameOnClick: {
              action: "0",
              userId: "0",
              linkColor: messageColor,
              messageChannelId: "0",
            },
            medium: true,
          },
        },
      ]
    }
  }
}

export const onLoad = () => {
  unpatch = after("generate", RowManager.prototype, ([row], {message}) => {
    if(row.rowType !== 1) return

    message.shouldShowRoleOnName = true
    processMessage(message, row.message)

    if(message.referencedMessage?.message) {
      processMessage(message.referencedMessage.message, null)
    }
  })
};

export const onUnload = () => {
  unpatch?.()
}

export { default as settings } from "./settings"
