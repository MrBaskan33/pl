import { findByProps } from "@vendetta/metro";
import { i18n } from "@vendetta/metro/common";
import { instead } from "@vendetta/patcher";

let unpatch = [];

export default {
    onLoad: () => {
        // 1. Yöntem: Klasik popup için
        const Alert = findByProps("alert", "show");
        if (Alert) {
            unpatch.push(instead("alert", Alert, (args, orig) => {
                if (args?.[1]?.title === i18n.Messages.DELETE_MESSAGE) {
                    args[1]?.onConfirm?.();
                    return;
                }
                return orig(...args);
            }));
        }

        // 2. Yöntem: Yeni popup sistemi için
        const ConfirmationModal = findByProps("openLazy", "closeConfirmationModal");
        if (ConfirmationModal) {
            unpatch.push(instead("openLazy", ConfirmationModal, (args, orig) => {
                const [component, args2] = args[0]?.() || [];
                if (args2?.title === i18n.Messages.DELETE_MESSAGE) {
                    args2?.onConfirm?.();
                    return () => {};
                }
                return orig(...args);
            }));
        }

        // 3. Yöntem: Show metodunu kontrol et
        const Popup = findByProps("show", "openLazy");
        if (Popup) {
            unpatch.push(instead("show", Popup, (args, orig) => {
                if (args?.[0]?.title === i18n.Messages.DELETE_MESSAGE) {
                    args[0]?.onConfirm?.();
                    return;
                }
                return orig(...args);
            }));
        }
    },
    onUnload: () => {
        unpatch.forEach(u => u());
        unpatch = [];
    }
}
