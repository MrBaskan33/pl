import { React, findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { showModal } from "@vendetta/ui/modal";
import { showToast } from "@vendetta/ui/toasts";
import { Forms } from "@vendetta/ui/components";

const { FormRow, FormSection, FormDivider, FormTitle } = Forms;

const tokenModule = findByProps("getToken", "setToken");
const userModule = findByProps("getCurrentUser");
const deviceModule = findByProps("getDeviceId");

const ivLength = 12;
const saltLength = 16;

function getDeviceKey(): string {
  return deviceModule?.getDeviceId?.() || "fallback-device-id";
}

async function deriveKey(password: string, salt: Uint8Array) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptToken(token: string, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(saltLength));
  const iv = crypto.getRandomValues(new Uint8Array(ivLength));
  const key = await deriveKey(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(token)
  );

  const result = new Uint8Array(saltLength + ivLength + ciphertext.byteLength);
  result.set(salt, 0);
  result.set(iv, saltLength);
  result.set(new Uint8Array(ciphertext), saltLength + ivLength);

  return btoa(String.fromCharCode(...result));
}

async function decryptToken(encrypted: string, password: string) {
  const data = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const salt = data.slice(0, saltLength);
  const iv = data.slice(saltLength, saltLength + ivLength);
  const ciphertext = data.slice(saltLength + ivLength);

  const key = await deriveKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

async function saveCurrentAccount() {
  const token = tokenModule.getToken();
  const deviceId = getDeviceKey();
  const user = userModule.getCurrentUser();
  if (!token || !user) return;

  const encrypted = await encryptToken(token, deviceId);
  storage.accounts = storage.accounts || [];

  const exists = storage.accounts.find((acc) => acc.id === user.id);
  if (!exists) {
    storage.accounts.push({
      id: user.id,
      name: user.username,
      token: encrypted,
    });
    showToast(`Hesap "${user.username}" kaydedildi`);
  }
}

function AccountSwitcherModal() {
  const deviceKey = getDeviceKey();
  const [accounts, setAccounts] = React.useState(storage.accounts ?? []);

  const handleSwitch = async (acc) => {
    try {
      const token = await decryptToken(acc.token, deviceKey);
      tokenModule.setToken(token);
      showToast(`"${acc.name}" hesabına geçiliyor...`);
      setTimeout(() => location.reload(), 1000);
    } catch (err) {
      showToast("Geçiş yapılamadı. Şifreleme hatası.");
    }
  };

  return (
    <>
      <FormTitle title="Kayıtlı Hesaplar" />
      {accounts.length === 0 ? (
        <FormRow label="Kayıtlı hesap yok." />
      ) : (
        accounts.map((acc, index) => (
          <FormRow
            key={index}
            label={acc.name}
            subLabel={`ID: ${acc.id}`}
            onPress={() => handleSwitch(acc)}
          />
        ))
      )}
    </>
  );
}

export default {
  onLoad() {
    saveCurrentAccount();
  },

  onUnload() {},

  getSettingsPanel() {
    return () => (
      <>
        <FormSection title="Hesap Değiştirici">
          <FormRow
            label="Hesap Değiştir"
            subLabel="Kayıtlı hesapları görüntüle ve geçiş yap"
            onPress={() => showModal("Hesap Değiştir", AccountSwitcherModal)}
          />
          <FormDivider />
        </FormSection>
      </>
    );
  },
};
