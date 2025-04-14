import { logger } from "@vendetta"
import { findByStoreName } from "@vendetta/metro"
import { storage } from "@vendetta/plugin"

const { getChannel } = findByStoreName("ChannelStore")

const baseStickerURL = "https://media.discordapp.net/stickers/{stickerId}.{format}?size={size}"

export function isStickerAvailable(sticker, channelId) {
  if(!sticker.guild_id) return true
  const channelGuildId = getChannel(channelId).guild_id
  return sticker.guild_id == channelGuildId
}

export function buildStickerURL(sticker) {
  const format = (sticker.format_type === 4) ? "gif" : "png"
  return baseStickerURL
  .replace("{stickerId}", sticker.id)
  .replace("{format}", format)
  .replace("{size}", storage.stickerSize.toString())
}

export async function convertToGIF(stickerUrl) {
  try {
    let form = new FormData()
    form.append("new-image-url", stickerUrl)
    let response = await fetch(`https://ezgif.com/apng-to-gif`, {
      method: "POST",
      body: form
    })
    const fileId = response.url.split("/").pop()

    form = new FormData()
    form.append("file", fileId)
    form.append("size", storage.stickerSize.toString())
    response = await fetch(`https://ezgif.com/apng-to-gif/${fileId}?ajax=true`, {
      method: "POST",
      body: form
    })
    const content = await response.text()
    return `https:${content.split('<img src="')[1].split('" style=')[0]}`
  } catch (e) {
    logger.error(`Failed to convert ${stickerUrl} to GIF: `, e)
    return null
  }
}
