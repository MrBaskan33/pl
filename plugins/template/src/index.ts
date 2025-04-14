import { findByName } from "@vendetta/metro"
import { after } from "@vendetta/patcher"
import { findInReactTree } from "@vendetta/utils"

const MessageActionSheet = findByName("MessageActionSheet")
let unpatch

export default {
  onLoad() {
    unpatch = after("default", MessageActionSheet, ([props], ret) => {
      const deleteButton = findInReactTree(ret, r => 
        r?.props?.label === "Delete" || 
        r?.props?.label === "Sil"
      )  
      if(deleteButton) {
        deleteButton.props.onPress = () => {
          try {
            props.message?.delete()?.catch(() => {})
          } catch (e) {
            console.log("Deleted error:", e)
          }
        }
      }         
      return ret
    })
  },
  onUnload() {
    unpatch?.()
  }
}
