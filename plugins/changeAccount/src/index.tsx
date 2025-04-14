// @ts-nocheck
import { definePlugin } from "@vendetta";
import { React, ReactNative, NavigationNative, stylesheet, constants } from "@vendetta/metro/common";
import { Forms, General } from "@vendetta/ui/components";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";

const { FormRow, FormSection, FormDivider } = Forms;
const { View, Text, ScrollView, TouchableOpacity, Image } = General;

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
    accountAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    accountInfo: {
        flex: 1,
    },
    accountName: {
        color: constants.ThemeColorMap.TEXT_NORMAL,
        fontSize: 16,
        fontWeight: "bold",
    },
    accountEmail: {
        color: constants.ThemeColorMap.TEXT_MUTED,
        fontSize: 14,
    },
    addButton: {
        backgroundColor: constants.ThemeColorMap.BACKGROUND_TERTIARY,
        borderRadius: 8,
        padding: 12,
        alignItems: "center",
        marginTop: 8,
    },
    addButtonText: {
        color: constants.ThemeColorMap.TEXT_LINK,
        fontWeight: "bold",
    },
});

// Mevcut hesap bilgilerini almak için fonksiyon
function getCurrentAccountInfo() {
    const UserStore = findByProps("getCurrentUser");
    const currentUser = UserStore.getCurrentUser();
    const EmailStore = findByProps("getEmail");
    const currentEmail = EmailStore.getEmail();
    
    return {
        id: currentUser?.id,
        username: currentUser?.username,
        discriminator: currentUser?.discriminator,
        avatar: currentUser?.avatar,
        email: currentEmail,
        token: window.DiscordNative?.window?.getAuthToken?.() // Dikkat: Bu güvenlik riski oluşturabilir
    };
}

// Hesap ekleme bileşeni
function AddAccountScreen({ navigation }) {
    const [isAdding, setIsAdding] = React.useState(false);

    const handleAddAccount = () => {
        setIsAdding(true);
        try {
            const currentAccount = getCurrentAccountInfo();
            if (!currentAccount.id || !currentAccount.email) {
                throw new Error("Hesap bilgileri alınamadı");
            }

            // Hesap zaten kayıtlı mı kontrolü
            const existingAccount = storage.accounts.find(acc => acc.id === currentAccount.id);
            if (existingAccount) {
                showToast("Bu hesap zaten kayıtlı", getAssetIDByName("Small"));
                return;
            }

            // Yeni hesabı ekle
            storage.accounts.push(currentAccount);
            showToast("Hesap başarıyla kaydedildi", getAssetIDByName("Check"));

            // Eğer ilk hesapsa, bunu geçerli hesap olarak ayarla
            if (storage.accounts.length === 1) {
                storage.currentAccount = currentAccount.id;
            }

            navigation.goBack();
        } catch (error) {
            showToast("Hesap eklenirken hata: " + error.message, getAssetIDByName("Small"));
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <FormSection title="Mevcut Hesabı Kaydet">
                <FormRow
                    label="Mevcut hesabınızı kaydedin"
                    subLabel="Bu hesabı daha sonra hızlıca geçiş yapmak için kaydedin"
                    leading={<FormRow.Icon source={getAssetIDByName("ic_add_24px")} />}
                    onPress={handleAddAccount}
                    disabled={isAdding}
                />
            </FormSection>
        </ScrollView>
    );
}

// Hesap yönetimi bileşeni
function AccountManagerScreen({ navigation }) {
    useProxy(storage);

    const switchAccount = (accountId) => {
        const account = storage.accounts.find(acc => acc.id === accountId);
        if (!account) return;

        try {
            // Token kullanarak hesaba geçiş yap
            window.DiscordNative?.window?.setAuthToken?.(account.token);
            storage.currentAccount = accountId;
            showToast(`Hesap değiştirildi: ${account.username}`, getAssetIDByName("Check"));
            
            // Sayfayı yenile
            navigation.goBack();
        } catch (error) {
            showToast("Hesap değiştirilirken hata: " + error.message, getAssetIDByName("Small"));
        }
    };

    const removeAccount = (accountId) => {
        storage.accounts = storage.accounts.filter(acc => acc.id !== accountId);
        if (storage.currentAccount === accountId) {
            storage.currentAccount = storage.accounts.length > 0 ? storage.accounts[0].id : null;
        }
        showToast("Hesap kaldırıldı", getAssetIDByName("Check"));
    };

    return (
        <ScrollView style={styles.container}>
            <FormSection title="Kayıtlı Hesaplar">
                {storage.accounts.map((account, index) => (
                    <React.Fragment key={account.id}>
                        <TouchableOpacity
                            style={styles.accountItem}
                            onPress={() => switchAccount(account.id)}
                            onLongPress={() => removeAccount(account.id)}
                        >
                            <Image
                                style={styles.accountAvatar}
                                source={{ uri: `https://cdn.discordapp.com/avatars/${account.id}/${account.avatar}.png` }}
                                defaultSource={getAssetIDByName("Discord")}
                            />
                            <View style={styles.accountInfo}>
                                <Text style={styles.accountName}>
                                    {account.username}#{account.discriminator}
                                </Text>
                                <Text style={styles.accountEmail}>{account.email}</Text>
                            </View>
                            {storage.currentAccount === account.id && (
                                <Image source={getAssetIDByName("ic_radio_checked_24px")} />
                            )}
                        </TouchableOpacity>
                        {index < storage.accounts.length - 1 && <FormDivider />}
                    </React.Fragment>
                ))}
            </FormSection>

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.push("VendettaAddAccount")}
            >
                <Text style={styles.addButtonText}>Yeni Hesap Ekle</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

// Ayarlar sayfasına "Hesap Değiştir" butonu ekleme
export default definePlugin({
    name: "Hesap Değiştirici",
    description: "Discord hesapları arasında hızlı geçiş yapmanızı sağlar",
    authors: [{ name: "Sen", id: "USER_ID" }],
    version: "1.0.0",
    onLoad() {
        const patches = [];

        // Ayarlar sayfasına yeni bölüm ekle
        patches.push(after("default", findByProps("UserSettingsOverviewWrapper"), (_, ret) => {
            const navigation = NavigationNative.useNavigation();
            
            return (
                <React.Fragment>
                    {ret}
                    <FormSection title="Hesap Yönetimi">
                        <FormRow
                            label="Hesapları Yönet"
                            leading={<FormRow.Icon source={getAssetIDByName("ic_profile")} />}
                            onPress={() => navigation.push("VendettaAccountManager")}
                        />
                    </FormSection>
                </React.Fragment>
            );
        });

        // Navigasyon ekranlarını kaydet
        this.registeredScreens = [
            NavigationNative.registerScreen(
                "VendettaAccountManager",
                () => AccountManagerScreen
            ),
            NavigationNative.registerScreen(
                "VendettaAddAccount",
                () => AddAccountScreen
            ),
        ];

        return () => {
            patches.forEach(p => p());
            this.registeredScreens.forEach(s => NavigationNative.unregisterScreen(s));
        };
    },
});
