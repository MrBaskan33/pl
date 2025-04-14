import { findByProps, findByName, findByStoreName } from "@revenge/metro";
import { instead } from "@revenge/patcher";

const MessageActions = findByProps("deleteMessage", "editMessage");
const ModalUtils = findByProps("openModal", "closeAllModals");
const DialogManager = findByProps("showDialog", "dismissAllDialogs");
const MessageStore = findByStoreName("MessageStore");

let unpatch = [];

export default {
    onLoad: () => {
        // 1. Tüm dialog/modal açılışlarını engelle
        unpatch.push(
            instead("showDialog", DialogManager, () => {}),
            instead("openModal", ModalUtils, () => {}),
            instead("push", findByProps("push"), () => {})
        );

        // 2. Direkt API ile mesaj silme (ana bypass)
        unpatch.push(instead("deleteMessage", MessageActions, (args, orig) => {
            // Mesajı direkt sil (channelId, messageId)
            orig(args[0], args[1]);
            
            // Açık kalan tüm UI elementlerini temizle
            ModalUtils?.closeAllModals?.();
            DialogManager?.dismissAllDialogs?.();
            
            return Promise.resolve(); // Hata vermemesi için
        }))

        // 3. MessageStore'daki silme işlemini de yakala
        if (MessageStore) {
            unpatch.push(instead("deleteMessage", MessageStore, (args, orig) => {
                orig(...args);
                return true; // Store'un işlemi engellemesini önle
            }));
        }

        // 4. React seviyesinde modal engelleme (nükleer seçenek)
        const React = findByProps("createElement");
        if (React) {
            unpatch.push(instead("createElement", React, (args) => {
                if (args[0]?.type?.name?.includes("Modal")) return null;
                return args[0];
            }));
        }

        console.log("[Revenge Delete Bypass] Aktif!");
    },

    onUnload: () => {
        unpatch.forEach(u => u());
        unpatch = [];
        console.log("[Revenge Delete Bypass] Kaldırıldı!");
    }
}
