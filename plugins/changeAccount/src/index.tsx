import { useState } from "react";
import { React, findByProps } from "@vendetta/metro";
import { showModal } from "@vendetta/ui/modal";
import { storage } from "@vendetta/plugin";
import { Forms } from "@vendetta/ui/components";

const { FormRow, FormDivider, FormSwitch } = Forms;

const tokenModule = findByProps("getToken", "setToken");
const deviceModule = findByProps("getDeviceId");
const userModule = findByProps("getCurrentUser");

const ivLength = 12;
const saltLength = 16;

async function deriveKey(password: string, salt: Uint8Array) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptToken(token: string, password: string) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(ivLength));
  const salt = crypto.getRandomValues(new Uint8Array(saltLength));
  const key = await deriveKey(password, salt);

  const cipherText = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(token)
  );

  const result = new Uint8Array(saltLength + ivLength + cipherText.byteLength);
  result.set(salt, 0);
  result.set(iv, saltLength);
  result.set(new Uint8Array(cipherText), saltLength + ivLength);

  return btoa(String.fromCharCode(...result));
}

async function decryptToken(encrypted: string, password: string) {
  const data = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const salt = data.slice(0, saltLength);
  const iv = data.slice(saltLength, saltLength + ivLength);
  const encryptedData = data.slice(saltLength + ivLength);

  const key = await deriveKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encryptedData
  );

  return new TextDecoder().decode(decrypted);
}

function getDeviceKey(): string {
  try {
    return deviceModule.getDeviceId?.() ?? "fallback-device-id";
  } catch {
    return "fallback-device-id";
  }
}

async function autoRegisterToken() {
  const currentToken = tokenModule.getToken();
  const deviceKey = getDeviceKey();

  if (!storage.accountTokens) storage.accountTokens = [];

  const exists = await Promise.all(
    storage.accountTokens.map(async (acc) => {
      const dec = await decryptToken(acc.token, deviceKey);
      return dec === currentToken;
    })
  );

  if (!exists.includes(true)) {
    const user = userModule.getCurrentUser();
    const encrypted = await encryptToken(currentToken, deviceKey);

    storage.accountTokens.push({
      name: user?.username ?? "Unknown",
      token: encrypted,
    });
  }
}

function AccountSwitcherModal() {
  const [accounts, setAccounts] = useState(storage.accountTokens ?? []);
  const deviceKey = getDeviceKey();

  return (
    <React.Fragment>
      <Forms.FormTitle title="Hesap Değiştirici" />
      {accounts.length === 0 ? (
        <Forms.FormRow
          label="Kayıtlı hesap bulunamadı."
          subLabel="Yeni bir hesaba giriş yaparak otomatik eklenmesini sağlayabilirsin."
        />
      ) : (
        accounts.map((acc, i) => (
          <FormRow
            key={i}
            label={acc.name}
            subLabel={"•••••••••" + i}
            leading={<Forms.FormIcon icon="ic_profile_24px" />}
            onPress={async () => {
              const token = await decryptToken(acc.token, deviceKey);
              tokenModule.setToken(token);
              location.reload();
            }}
          />
        ))
      )}
    </React.Fragment>
  );
}

export default {
  onLoad: () => {
    autoRegisterToken();

    const settingsView = findByProps("getSettingsPanel").default;
    const oldRender = settingsView.prototype.render;

    settingsView.prototype.render = function () {
      const res = oldRender.call(this);
      res.props.children.push({
        type: "button",
        label: "Hesap Değiştir",
        onPress: () => showModal("Hesap Değiştirici", AccountSwitcherModal),
      });
      return res;
    };

    settingsView.prototype.render._original = oldRender;
  },

  onUnload: () => {
    const settingsView = findByProps("getSettingsPanel").default;
    if (settingsView?.prototype?.render?._original)
      settingsView.prototype.render = settingsView.prototype.render._original;
  },
};
