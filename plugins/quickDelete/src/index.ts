import { findByProps, findByStoreName } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";
import { React } from "@vendetta/metro/common";

let unpatch = [];

export default {
    onLoad: () => {
        // 1. Yöntem: ConfirmationModal için direkt erişim
        const ConfirmationModal = findByProps("openLazy", "closeConfirmationModal");
        if (ConfirmationModal) {
            unpatch.push(instead("openLazy", ConfirmationModal, (args, orig) => {
                const [component, modalProps] = args[0]?.() || [];
                
                // Silme işlemi için birden fazla olasılık kontrolü
                if (
                    modalProps?.title?.includes("Delete") || 
                    modalProps?.title?.includes("Sil") ||
                    modalProps?.children === "Are you sure you want to delete this message?" ||
                    modalProps?.confirmText === "Delete" ||
                    modalProps?.confirmText === "Sil"
                ) {
                    modalProps?.onConfirm?.();
                    return () => {};
                }
                return orig(...args);
            }));
        }

        // 2. Yöntem: Mesaj store'una müdahale
        const MessageStore = findByStoreName("MessageStore");
        if (MessageStore) {
            unpatch.push(instead("deleteMessage", MessageStore, (args, orig) => {
                // Direkt silme işlemini gerçekleştir
                return orig(...args);
            }));
        }

        // 3. Yöntem: UI bileşenlerini dinleme
        const Dialogs = findByProps("show", "closeAll");
        if (Dialogs) {
            unpatch.push(instead("show", Dialogs, (args, orig) => {
                const [props] = args;
                if (
                    props?.title?.includes("Delete") ||
                    props?.children?.props?.children === "Are you sure you want to delete this message?"
                ) {
                    props?.onConfirm?.();
                    return;
                }
                return orig(...args);
            }));
        }

        // 4. Yöntem: React bileşenlerini inceleme
        const { createElement } = React;
        unpatch.push(instead("createElement", React, (args, orig) => {
            const [type, props] = args;
            
            if (
                type?.name === "ConfirmModal" && 
                (props?.header?.includes("Delete") || props?.confirmText === "Delete")
            ) {
                props?.onConfirm?.();
                return createElement("div");
            }
            
            return orig(...args);
        }));
    },
    
    onUnload: () => {
        unpatch.forEach(u => u());
        unpatch = [];
    }
}
