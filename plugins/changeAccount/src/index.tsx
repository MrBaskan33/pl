// @ts-nocheck
import { definePlugin } from "@vendetta";
import { React, NavigationNative, stylesheet, constants, ReactNative } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findByStoreName } from "@vendetta/metro";
import { device } from "@vendetta/ui/assets";
import { encrypt, decrypt } from "@vendetta/encrypt";

const { FormRow, FormSection, FormDivider } = Forms;
const { View, Text, ScrollView, TouchableOpacity, Image } = ReactNative;

// Revenge/Vendetta uyumlu depolama yapısı
if (!storage.accounts) storage.accounts = [];
if (!storage.currentAccount) storage.currentAccount = null;

// Şifreleme anahtarı (Cihaz spesifik)
const getEncryptionKey = () => 
  encrypt(device.uuid.split("").reverse().join("") + device.uuid);

const styles = stylesheet.createThemedStyleSheet({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: constants.ThemeColorMap.BACKGROUND_MOBILE_PRIMARY,
  },
  accountCard: {
    backgroundColor: constants.ThemeColorMap.BACKGROUND_MOBILE_SECONDARY,
    borderRadius: 10,
    marginVertical: 4,
    padding: 12,
    flexDirection: "row",
    alignItems: "center"
  },
  avatar: {
    width: 40, 
    height: 40,
    borderRadius: 20,
    marginRight: 12
  }
});

const UserStore = findByStoreName("UserStore");
const AuthStore = findByStoreName("AuthStore");

const AccountSwitcherScreen = () => {
  const navigation = NavigationNative.useNavigation();
  const [accounts, setAccounts] = React.useState(storage.accounts);

  const switchAccount = async (account) => {
    try {
      const decryptedToken = decrypt(account.token, getEncryptionKey());
      
      await AuthStore.actions.setToken(decryptedToken);
      storage.currentAccount = account.id;
      
      showToast(`✅ ${account.username} yükleniyor...`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      showToast(`❌ Hata: ${e.message}`);
    }
  };

  const addCurrentAccount = () => {
    const currentUser = UserStore.getCurrentUser();
    if (!currentUser) return showToast("⚠️ Önce giriş yapın!");
    
    const existing = storage.accounts.find(a => a.id === currentUser.id);
    if (existing) return showToast("⚠️ Zaten kayıtlı!");
    
    const encryptedToken = encrypt(AuthStore.getToken(), getEncryptionKey());
    
    storage.accounts.push({
      id: currentUser.id,
      username: currentUser.username,
      discriminator: currentUser.discriminator,
      avatar: currentUser.avatar,
      token: encryptedToken
    });
    
    showToast("✅ Hesap kaydedildi!");
    setAccounts([...storage.accounts]);
  };

  return (
    <ScrollView style={styles.container}>
      <FormSection title="Hesap Yönetimi">
        {accounts.map(acc => (
          <TouchableOpacity
            key={acc.id}
            style={styles.accountCard}
            onPress={() => switchAccount(acc)}
            onLongPress={() => {
              storage.accounts = storage.accounts.filter(a => a.id !== acc.id);
              setAccounts([...storage.accounts]);
              showToast("🗑️ Hesap silindi!");
            }}
          >
            <Image
              source={{ uri: `https://cdn.discordapp.com/avatars/${acc.id}/${acc.avatar}.png` }}
              style={styles.avatar}
            />
            <View>
              <Text style={{ color: constants.ThemeColorMap.TEXT_NORMAL }}>
                {acc.username}#{acc.discriminator}
              </Text>
              <Text style={{ color: constants.ThemeColorMap.TEXT_MUTED }}>
                {acc.id === storage.currentAccount ? "Aktif Hesap" : ""}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        
        <FormDivider />
        
        <FormRow
          label="Mevcut Hesabı Ekle"
          leading={<FormRow.Icon source={getAssetIDByName("ic_add_24px")} />}
          onPress={addCurrentAccount}
        />
      </FormSection>
    </ScrollView>
  );
};

export default definePlugin({
  name: "Revenge Account Switcher",
  description: "Güvenli hesap geçişi için Revenge eklentisi",
  version: "1.0.2",
  authors: [{ name: "Sen", id: "YOUR_DISCORD_ID" }],
  
  onLoad() {
    const navigation = NavigationNative.useNavigation();
    const unpatch = after("default", findByStoreName("SettingsScreen").prototype, (_, ret) => {
      ret.props.children.props.sections.unshift({
        title: "Hesap Yöneticisi",
        icon: getAssetIDByName("ic_profile"),
        onPress: () => navigation.push("RevengeAccountSwitcher")
      });
    });

    NavigationNative.registerScreen("RevengeAccountSwitcher", () => AccountSwitcherScreen);
    
    return () => {
      unpatch();
      NavigationNative.unregisterScreen("RevengeAccountSwitcher");
    };
  }
});
