import { before } from "@vendetta/patcher";
import { find, findByProps, findByStoreName } from "@vendetta/metro";
import { clipboard, React } from "@vendetta/metro/common";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Forms } from "@vendetta/ui/components";

const { FormRow } = Forms;
const ActionSheet = findByProps("openLazy", "hideActionSheet");

// Daha güvenilir modül bulma yöntemleri
const findProfileSheet = (name: string) => 
  findByName(name, false) || 
  find(m => m.default?.name === name, false);

const UserProfileSheet = findProfileSheet("UserProfileSheet");
const ChannelProfileSheet = findProfileSheet("ChannelProfileSheet");
const MessageProfileSheet = findProfileSheet("MessageLongPressActionSheet");
const GuildProfileSheet = findProfileSheet("GuildProfileSheet");
const EmojiProfileSheet = findProfileSheet("EmojiSheet");
const RoleProfileSheet = findProfileSheet("RoleProfileContextMenu");

function addCopyIDOption(sheet: any, id: string, type: string) {
  if (!sheet || !id) return;

  before("default", sheet, (args) => {
    const [props] = args;
    if (!props?.children) return;

    const originalChildren = props.children;
    props.children = (childProps: any) => {
      const children = originalChildren(childProps);
      
      if (!Array.isArray(children)) return children;

      return [
        ...children,
        <FormRow
          label={`${type} ID Kopyala (${id})`}
          leading={<FormRow.Icon source={getAssetIDByName("copy")} />}
          onPress={() => {
            clipboard.setString(id);
            showToast(`${type} ID kopyalandı!`, getAssetIDByName("toast_copy_link"));
            ActionSheet?.hideActionSheet?.();
          }}
        />
      ];
    };
  });
}

export default {
  onLoad() {
    const patches = [];
    
    // Kullanıcı ID
    patches.push(
      before("default", UserProfileSheet, ([props]) => {
        addCopyIDOption(UserProfileSheet, props?.userId, "Kullanıcı");
      })
    );

    // Kanal ID
    patches.push(
      before("default", ChannelProfileSheet, ([props]) => {
        addCopyIDOption(ChannelProfileSheet, props?.channelId, "Kanal");
      })
    );

    // Mesaj ID
    patches.push(
      before("default", MessageProfileSheet, ([props]) => {
        addCopyIDOption(MessageProfileSheet, props?.messageId, "Mesaj");
      })
    );

    // Sunucu ID
    patches.push(
      before("default", GuildProfileSheet, ([props]) => {
        addCopyIDOption(GuildProfileSheet, props?.guildId, "Sunucu");
      })
    );

    // Emoji ID
    patches.push(
      before("default", EmojiProfileSheet, ([props]) => {
        const emojiId = props?.emoji?.id || props?.emojiId;
        addCopyIDOption(EmojiProfileSheet, emojiId, "Emoji");
      })
    );

    // Rol ID
    patches.push(
      before("default", RoleProfileSheet, ([props]) => {
        const roleId = props?.role?.id || props?.roleId;
        addCopyIDOption(RoleProfileSheet, roleId, "Rol");
      })
    );

    return () => patches.forEach(p => p?.());
  },
};
