import { findByStoreName } from "@vendetta/metro"
import { storage } from "@vendetta/plugin"
import { Message } from "./def"
const { getCustomEmojiById } = findByStoreName("EmojiStore")
const { getGuildId } = findByStoreName("SelectedGuildStore")
const hasEmotesRegex = /<a?:(\w+):(\d+)>/i

function extractUnusableEmojis(messageString: string, size: number) {
  const emojiStrings = messageString.matchAll(/<a?:(\w+):(\d+)>/gi)

  for(const emojiString of emojiStrings) {
    const emoji = getCustomEmojiById(emojiString[2])

    if(emoji.guildId != getGuildId() || emoji.animated) {
      var ext = "webp"
      if(emoji.animated) {
        ext = "gif"
      }
      if(storage.hyperlink === true) {
        if(storage.hyperlink_compat) {
          messageString = messageString.replace(
            emojiString[0],
            `[${emojiString[1]}](https://cdn.discordapp.com/emojis/${emojiString[2]}.${ext}?size=${size})`
          )
        } else {
          messageString = messageString.replace(
            emojiString[0],
            `[:󠀲${emojiString[1]}:](https://cdn.discordapp.com/emojis/${emojiString[2]}.${ext}?size=${size})`
          )
        }
      } else {
        messageString = messageString.replace(
          emojiString[0],
          `https://cdn.discordapp.com/emojis/${emojiString[2]}.${ext}?size=${size}&quality=lossless&name=${emojiString[1]}`
        )
      }
    }
  }

  return {
    newContent: messageString.trim(),
  }
}

export default function modifyIfNeeded(msg: Message) {
  if(!msg.content.match(hasEmotesRegex)) return
  if(!storage.forceMoji) {
    if(storage.haveNitro) return
  }

  const { newContent } = extractUnusableEmojis(msg.content, storage.emojiSize)
  msg.content = newContent
  msg.invalidEmojis = []
}
