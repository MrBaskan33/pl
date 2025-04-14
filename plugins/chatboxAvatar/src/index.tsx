import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";
import { React, ReactNative } from "@vendetta/metro/common";
import { useState } from "react";

const { getCurrentUser } = findByProps("getCurrentUser");
const { updateLocalPresence } = findByProps("updateLocalPresence");
const { View, Text, Image, TouchableOpacity, TextInput, Modal } = ReactNative;

const STATUS_OPTIONS = [
  { key: "online", label: "Online" },
  { key: "idle", label: "Idle" },
  { key: "dnd", label: "Do Not Disturb" },
  { key: "invisible", label: "Invisible" }
];

export default () => {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState("online");
  const [customStatus, setCustomStatus] = useState("");

  const user = getCurrentUser();

  const applyStatus = () => {
    updateLocalPresence({ status, customText: customStatus });
    showToast(`Durum güncellendi: ${status}${customStatus ? " - " + customStatus : ""}`);
    setVisible(false);
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center", padding: 4 }}>
      <TouchableOpacity onPress={() => setVisible(true)}>
        <Image
          source={{ uri: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128` }}
          style={{ width: 32, height: 32, borderRadius: 16 }}
        />
      </TouchableOpacity>

      {visible && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={visible}
          onRequestClose={() => setVisible(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: "#000000aa",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <View style={{
              backgroundColor: "#1e1f22",
              padding: 20,
              borderRadius: 12,
              width: "80%"
            }}>
              <Text style={{ color: "white", fontSize: 18, marginBottom: 10 }}>Durum Ayarla</Text>

              {STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setStatus(opt.key)}
                  style={{
                    backgroundColor: status === opt.key ? "#5865F2" : "#2f3136",
                    padding: 10,
                    borderRadius: 6,
                    marginBottom: 6
                  }}
                >
                  <Text style={{ color: "white" }}>{opt.label}</Text>
                </TouchableOpacity>
              ))}

              <TextInput
                placeholder="Özel Durum..."
                placeholderTextColor="#aaa"
                style={{
                  backgroundColor: "#2f3136",
                  color: "white",
                  borderRadius: 6,
                  padding: 10,
                  marginTop: 10
                }}
                value={customStatus}
                onChangeText={setCustomStatus}
              />

              <TouchableOpacity
                onPress={applyStatus}
                style={{
                  marginTop: 12,
                  backgroundColor: "#5865F2",
                  padding: 10,
                  borderRadius: 6
                }}
              >
                <Text style={{ color: "white", textAlign: "center" }}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};
