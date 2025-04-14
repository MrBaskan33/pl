import { findByProps, findByStoreName } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";

let unpatch = [];

export default {
    onLoad: () => {
        // 1. Direkt API ile mesaj silme
        const RestAPI = findByProps("deleteMessage", "editMessage");
        const MessageStore = findByStoreName("MessageStore");
        const ModalManager = findByProps("closeAllModals", "openModal");

        if (RestAPI) {
            // Mesaj silme fonksiyonunu override et
            unpatch.push(instead("deleteMessage", RestAPI, (args, orig) => {
                // Önce tüm modalları kapat
                ModalManager?.closeAllModals?.();
                
                // Direkt API çağrısı yap
                return orig(args[0], args[1]).catch(err => {
                    console.error("Mesaj silinemedi:", err);
                });
            }));
        }

        // 2. MessageStore'daki silme işlemini yakala
        if (MessageStore) {
            unpatch.push(instead("deleteMessage", MessageStore, (args, orig) => {
                ModalManager?.closeAllModals?.();
                return orig(...args);
            }));
        }

        // 3. Tüm popup ve modal oluşumlarını engelle
        const Dialogs = findByProps("show", "closeAll");
        if (Dialogs) {
            unpatch.push(instead("show", Dialogs, (args, orig) => {
                if (args[0]?.title?.toLowerCase().includes("delete")) {
                    ModalManager?.closeAllModals?.();
                    return;
                }
                return orig(...args);
            }));
        }

        // 4. ConfirmationModal'ı engelle
        const ConfirmationModal = findByProps("openLazy", "closeConfirmationModal");
        if (ConfirmationModal) {
            unpatch.push(instead("openLazy", ConfirmationModal, (args, orig) => {
                const [component, props] = args[0]?.() || [];
                if (props?.title?.toLowerCase().includes("delete")) {
                    ModalManager?.closeAllModals?.();
                    return () => {};
                }
                return orig(...args);
            }));
        }

        console.log("Silme onayı bypass aktif!");
    },

    onUnload: () => {
        unpatch.forEach(u => u());
        unpatch = [];
        console.log("Silme onayı bypass kaldırıldı!");
    }
}
