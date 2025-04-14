import { findByProps, findByStoreName } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";

const MessageActions = findByProps("deleteMessage", "editMessage");
const Alerts = findByProps("openLazy", "close");
const Modals = findByProps("openModal", "closeAllModals");
const Dispatcher = findByProps("dirtyDispatch", "dispatch");

let unpatch = [];

export default {
    onLoad: () => {
        // 1. Tüm modal/popup açılışlarını engelle
        unpatch.push(
            instead("openLazy", Alerts, () => () => {}),
            instead("show", findByProps("show"), () => {}),
            instead("openModal", Modals, () => () => {})
        )

        // 2. Direkt mesaj silme fonksiyonunu yakala
        unpatch.push(instead("deleteMessage", MessageActions, (args, orig) => {
            // Mesajı direkt sil
            orig(args[0], args[1]);
            
            // Oluşabilecek tüm modalları kapat
            Modals?.closeAllModals?.();
            
            // Redux dispatch'i engelle
            if (Dispatcher) {
                unpatch.push(
                    instead("dispatch", Dispatcher, (action) => {
                        if (action.type === "MODAL_OPEN") return null;
                        return action;
                    })
                );
            }
            
            return Promise.resolve();
        }))

        // 3. MessageStore'daki silme işlemini de yakala
        const MessageStore = findByStoreName("MessageStore");
        if (MessageStore) {
            unpatch.push(instead("deleteMessage", MessageStore, (args, orig) => {
                Modals?.closeAllModals?.();
                return orig(...args);
            }))
        }

        console.log("[Silme Bypass] Tamamen aktif!");
    },

    onUnload: () => {
        unpatch.forEach(u => u());
        unpatch = [];
        console.log("[Silme Bypass] Kaldırıldı!");
    }
}
