import { findByProps } from "@revenge/metro";
import { instead } from "@revenge/patcher";

const MessageActions = findByProps("deleteMessage");
const FluxDispatcher = findByProps("dirtyDispatch");

let unpatch = [];

export default {
    onLoad: () => {
        // 1. Direkt mesaj silme (API seviyesinde)
        unpatch.push(instead("deleteMessage", MessageActions, (args, orig) => {
            return new Promise((resolve) => {
                orig(args[0], args[1]);
                resolve();
            });
        }))

        // 2. Tüm modal dispatch'leri engelle
        unpatch.push(instead("dirtyDispatch", FluxDispatcher, (action, orig) => {
            if (action.type?.includes("MODAL") || action.type?.includes("DIALOG")) {
                return null;
            }
            return orig(action);
        }))

        // 3. UI katmanını tamamen bypass et
        const React = findByProps("createElement");
        unpatch.push(instead("createElement", React, (args) => {
            if (args[0]?.type?.name?.includes("Confirm")) {
                args[0].props.onConfirm();
                return null;
            }
            return args[0];
        }));

        console.log("[Kesin Çözüm] Aktif!");
    },
    onUnload: () => unpatch.forEach(u => u())
};
