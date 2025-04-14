import { findByProps } from "@vendetta/metro"
import { i18n } from "@vendetta/metro/common";
import { instead } from "@vendetta/patcher";

let unpatch: () => any;
export default {
    onLoad: () => {
        const Popup = findByProps("show", "openLazy")
        unpatch = instead("show", Popup, (args, fn) => {
            if (args?.[0]?.title === i18n.Messages.DELETE_MESSAGE) 
                args[0].onConfirm?.()
            else fn(...args)
        })
    },
    onUnload: () => unpatch?.()
}
