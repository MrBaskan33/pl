// @ts-nocheck
import { definePlugin } from "@vendetta";
import { React, NavigationNative, stylesheet, constants } from "@vendetta/metro/common";
import { Forms, General } from "@vendetta/ui/components";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";
import { device } from "@vendetta/ui/assets";
import CryptoJS from "crypto-js";

const { FormRow, FormSection, FormDivider } = Forms;
const { View, Text, ScrollView, TouchableOpacity, Image, Modal, TextInput } = General;

// Şifreleme anahtarını cihaz ID'ye göre oluştur
function getEncryptionKey() {
  return CryptoJS.SHA256(device.uuid).toString(CryptoJS.enc.Hex).substring(0, 32);
}

// Veriyi AES ile şifrele
function encryptData(data: string) {
  return CryptoJS.AES.encrypt(data, getEncryptionKey()).toString();
}

// Veriyi AES ile çöz
function decryptData(ciphertext: string) {
  return CryptoJS.AES.decrypt(ciphertext, getEncryptionKey()).toString(CryptoJS.enc.Utf8);
}

// Başlangıç depolama yapısı
if (!storage.accounts) storage.accounts = [];
if (!storage.currentAccount) storage.currentAccount = null;

// Stil sayfası
const styles = stylesheet.createThemedStyleSheet({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: constants.ThemeColorMap.BACKGROUND_PRIMARY,
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: constants.ThemeColorMap.BACKGROUND_SECONDARY,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: constants.ThemeColorMap.BACKGROUND_PRIMARY,
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: constants.ThemeColorMap.BACKGROUND_TERTIARY,
    borderWidth: 1,
    marginBottom: 12,
    padding: 10,
    color: constants.ThemeColorMap.TEXT_NORMAL,
    borderRadius: 4,
  },
});

// Hesap ekleme modal bileşeni
function AddAccountModal({ visible, onClose }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);

  const handleAddAccount = async () => {
    setIsAdding(true);
    try {
      const loginResult = await findByProps("login").login(email, password);
      
      const user = findByProps("getCurrentUser").getCurrentUser();
      const token = window.DiscordNative?.window?.getAuthToken?.();
      
      if (!user || !token) throw new Error("Giriş başarısız");

      const encryptedToken = encryptData(token);
      
      storage.accounts.push({
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        avatar: user.avatar,
        email: email,
        token: encryptedToken,
      });

      showToast("Hesap eklendi!", getAssetIDByName("Check"));
      onClose();
    } catch (error) {
      showToast("Hata: " + error.message, getAssetIDByName("Small"));
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <ScrollView style={styles.modalContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          onPress={handleAddAccount}
          disabled={isAdding}
        >
          <Text style={{ color: constants.ThemeColorMap.TEXT_LINK }}>
            {isAdding ? "Ekleniyor..." : "Hesap Ekle"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

// Hesap yönetimi bileşeni
function AccountManager() {
  useProxy(storage);
  const [addModalVisible, setAddModalVisible] = React.useState(false);

  const switchAccount = (account) => {
    try {
      const decryptedToken = decryptData(account.token);
      window.DiscordNative?.window?.setAuthToken?.(decryptedToken);
      storage.currentAccount = account.id;
      showToast(`${account.username} hesabına geçildi`, getAssetIDByName("Check"));
    } catch (error) {
      showToast("Token çözülemedi: " + error.message, getAssetIDByName("Small"));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <FormSection title="Kayıtlı Hesaplar">
        {storage.accounts.map((account) => (
          <TouchableOpacity
            key={account.id}
            style={styles.accountItem}
            onPress={() => switchAccount(account)}
          >
            <Image
              source={{ uri: `https://cdn.discordapp.com/avatars/${account.id}/${account.avatar}.png` }}
              style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
            />
            <View>
              <Text style={{ color: constants.ThemeColorMap.TEXT_NORMAL }}>
                {account.username}#{account.discriminator}
              </Text>
              <Text style={{ color: constants.ThemeColorMap.TEXT_MUTED }}>
                {account.email}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </FormSection>

      <TouchableOpacity
        style={{ padding: 16, alignItems: "center" }}
        onPress={() => setAddModalVisible(true)}
      >
        <Text style={{ color: constants.ThemeColorMap.TEXT_LINK }}>Yeni Hesap Ekle</Text>
      </TouchableOpacity>

      <AddAccountModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
      />
    </ScrollView>
  );
}

export default definePlugin({
  name: "Güvenli Hesap Değiştirici",
  description: "Şifrelenmiş token yönetimi ile hesap geçişi",
  authors: [{ name: "Sen", id: "YOUR_ID" }],
  version: "2.0.0",
  onLoad() {
    const patches = [];
    const navigation = NavigationNative.useNavigation();

    // Ayarlar sayfasına buton ekle
    patches.push(after("default", findByProps("UserSettingsOverviewWrapper"), (_, ret) => (
      <React.Fragment>
        {ret}
        <FormSection title="Hesap Yönetimi">
          <FormRow
            label="Hesapları Yönet"
            leading={<FormRow.Icon source={getAssetIDByName("ic_profile")} />}
            onPress={() => navigation.push("SecureAccountSwitcher")}
          />
        </FormSection>
      </React.Fragment>
    )));

    // Ekranı kaydet
    this.registeredScreens = [
      NavigationNative.registerScreen(
        "SecureAccountSwitcher",
        () => AccountManager
      )
    ];

    return () => {
      patches.forEach(p => p());
      this.registeredScreens.forEach(s => NavigationNative.unregisterScreen(s));
    };
  },
});
