import { instead } from "@vendetta/patcher";

let unpatch = [];

export default {
    onLoad: () => {
        // Tüm alert ve confirm çağrılarını engelle
        unpatch.push(
            instead("alert", window, () => {}),
            instead("confirm", window, () => true)
        );

        // React modal oluşumunu engelle
        const React = vendetta.metro.common.React;
        unpatch.push(
            instead("createElement", React, (args) => {
                if (args[0]?.name?.includes("Modal")) return null;
                return args[0];
            })
        );

        console.log("[Nükleer Bypass] Tüm popup'lar engellendi!");
    },
    onUnload: () => unpatch.forEach(u => u())
};
