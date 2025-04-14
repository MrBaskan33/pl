import { patcher } from "@vendetta"
import { findByDisplayName, findByName, findByProps, findByPropsAll, findByStoreName, findByTypeNameAll, findByTypeName } from "@vendetta/metro"
import { General } from "@vendetta/ui/components"
import { findInReactTree } from "@vendetta/utils"
import StatusIcons from "./statusIcons"
import { getAssetByName, getAssetIDByName } from "@vendetta/ui/assets"
import { storage } from "@vendetta/plugin"
import Settings from "./settings"
import React, { useState, useEffect } from "react"
import RerenderContainer from "./rerenderContainer"
import PresenceUpdatedContainer from "./presenceUpdatedContainer"
const { Text, View } = General

let unpatches = []

export default {
  onLoad: () => {

    storage.dmTopBar ??= true
    storage.userList ??= true
    storage.profileUsername ??= true
    storage.removeDefaultMobile ??= true
    storage.fallbackColors ??= false
    storage.oldUserListIcons ??= false
    const debugLabels = false

    unpatches.push(patcher.after("render",View,(_,res) => {
      return
      if(storage.dmTopBar) {

        const textChannel = findInReactTree(res, r => r?.props?.children[1]?.type?.name == "ChannelActivity" && r?.props?.children[1]?.props?.hasOwnProperty?.("userId"))
        if(!textChannel)return
        if(textChannel.props?.children?.length != 2) return
        if(textChannel.props?.children[0]?.props?.children?.length != 2) return
                
        const target = textChannel.props?.children[0]?.props?.children
        if(target.filter(m => m?.props?.userId).length == 2) {
          const target2 = target[1]
          const uid = target2.props?.userId
          if(!uid) return
          patcher.after("type",target2,(args,res) => {
            if(!findInReactTree(res, m => m.key == "StatusIcons")) {
              res = <View style = {{
                display: "flex",
                flexDirection: "row"
              }}>
              { res }
              <PresenceUpdatedContainer key = "StatusIcons">
                { debugLabels ? <Text>DTB1</Text> : <StatusIcons userId = { uid }/> }
              </PresenceUpdatedContainer>
              </View>
            }
            return res
          })
        }
      }
    }))

    const Pressable = findByDisplayName("Pressable",false)
      unpatches.push(patcher.before("render",Pressable.default.type,(args) => {
        if(!args) return
        if(!args[0]) return
        const [ props ] = args
        if(!props) return

        if(storage.userList) {
          if(props?.children?.props?.children?.props?.children) { 
            if(props.children.props.children.props.children[1]?.type?.type?.name == "ChannelUnreadBadge") {   
              const targetCard = props.children.props.children
              const userDataElement = findInReactTree(targetCard, m => m?.user)
              if(userDataElement?.user) {           
                if(!findInReactTree(props, m => m?.key == "TabsV2-DM-List")) {
                  const userHeader = findInReactTree(props, m => (m?.props?.variant == "text-md/semibold" || m?.props?.variant == "redesign/channel-title/semibold"))
                  if(userHeader) {
                    userHeader.props.children = [
                      userHeader.props.children, 
                      <View 
                        key = "TabsV2-DM-List"
                        style = {{
                          flexDirection: "row",
                          justifyContent: "center",
                          alignContent: "flex-start"
                        }}>
                        <PresenceUpdatedContainer>
                          { debugLabels ? <Text>T2-DL-1</Text> : <StatusIcons userId = { userDataElement.user.id }/> }
                        </PresenceUpdatedContainer>
                      </View>
                    ]
                  }
                }
              }
            }
          }
        }
              
        if(props.accessibilityRole == "button") {    
          if(!storage.userList) return       
          if(props?.children?.props?.children?.props?.children) {
            if(props?.children?.props?.children?.props?.children[0]?.type?.type?.name == "GuildContainerIndicator") { 
              const userId = props?.children?.props?.children?.props?.children[1]?.props?.children[0]?.props?.children?.props?.user?.id
              if(props?.children?.props?.children?.props?.children[1]?.props?.children[0]?.props?.children?.props?.guildId) return
              if(userId) {
                const nameArea = props?.children?.props?.children?.props?.children[2]?.props?.children[0]
                if(nameArea) {
                  const userName = nameArea.props.children[0].props.children 
                  if(!findInReactTree(userName, (c) => c.key == "DMTabsV2DMList-v2")) {
                    userName.push(
                      <PresenceUpdatedContainer key = "DMTabsV2DMList-v2">
                        { debugLabels ? <Text>DTV2DL-v2</Text> : <StatusIcons userId = { userId }/> }
                      </PresenceUpdatedContainer>
                    )
                  }
                }
              }
            }
          }    
        }       
      }))
        
      const PresenceStore = findByStoreName("PresenceStore")
      unpatches.push(patcher.after("default",findByName("ChannelHeader",false),(args,res) => {

        if(!storage.dmTopBar) return
        if(!(res.type?.type?.name == "PrivateChannelHeader")) return

        patcher.after("type",res.type,(args,res) => {
          if(!res.props?.children?.props?.children) return
          const userId = findInReactTree(res,m => m.props?.user?.id)?.props?.user?.id
          if(!userId) return
                
          const dmTopBar = res.props?.children
          if(!findInReactTree(res,m => m.key == "DMTabsV2Header")) {
                    
            if(dmTopBar.props?.children?.props?.children[1]) {
              if(typeof dmTopBar.props?.children?.props?.children[1]?.type == "function") {
                const titleThing = dmTopBar.props?.children?.props?.children[1]              
                const unpatchTV2HdrV2 = patcher.after("type",titleThing, (args,res) => {      
                  unpatchTV2HdrV2()
                  if(!findInReactTree(res, (c) => c.key == "DMTabsV2Header-v2")) {
                    res.props.children[0].props.children.push(
                      <PresenceUpdatedContainer key = "DMTabsV2Header-v2">
                        { debugLabels ? <Text>DTV2H-v2</Text> : <StatusIcons userId = { userId }/>}
                      </PresenceUpdatedContainer>
                    )
                  }
                })
              } else {
                const arrowId = getAssetIDByName("arrow-right")
                const container1 = findInReactTree(dmTopBar, m => m.props?.children[1]?.props?.source == arrowId)
                container1.props?.children?.push(<View 
                  key = "DMTabsV2Header"    
                  style = {{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignContent: "flex-start"
                }}>
                <View 
                  key = "DMTabsV2HeaderIcons"
                  style = {{
                    flexDirection: "row"
                  }}></View>
                  </View>)
                }
              }
            }
          
            const topIcons = findInReactTree(res,m => m.key == "DMTabsV2HeaderIcons")
            if(topIcons) {
              topIcons.props.children = <StatusIcons userId = { userId }/>
            }   
          })
        }))
    
        const DefaultName = findByName("DefaultName", false)
        unpatches.push(patcher.after("default", DefaultName, (args, res) => {
          const user = args[0]?.user
          if (user === undefined) return
          if(!res) return
          if(!user.id) return
          if(!storage.profileUsername)return
          res.props?.children[0]?.props?.children?.push(<StatusIcons userId = { user.id }/>)
        }))

        const DisplayName = findByName("DisplayName", false)
        unpatches.push(patcher.after("default", DisplayName, (args, res) => {
          const user = args[0]?.user
          if(user === undefined) return
          if(!res) return
          if(!user.id) return
          if(!storage.profileUsername)return
          res.props?.children?.props?.children[0]?.props?.children?.push(<StatusIcons userId = { user.id }/>)
        }))

        const Status = findByName("Status", false)
        unpatches.push(patcher.before("default", Status, (args) => {
          if(!args) return
          if(!args[0]) return
          if(!storage.removeDefaultMobile)return
          args[0].isMobileOnline = false
        }))

        const Rows = findByProps("GuildMemberRow")
        if(Rows?.GuildMemberRow) {
          unpatches.push(patcher.after("type", Rows.GuildMemberRow, ([{ user }], res) => {
            if(!storage.userList) return
            if(storage.oldUserListIcons) return
            const statusIconsView = findInReactTree(res, (c) => c.key == "GuildMemberRowStatusIconsView")
            if(!statusIconsView) {
              const row = findInReactTree(res, (c) => c.props.style.flexDirection === "row")
              row.props.children.splice(2, 0,
                <View 
                  key = "GuildMemberRowStatusIconsView"
                  style = {{
                    flexDirection: "row"
                  }}>
                  { debugLabels ? <Text>GMRSIV</Text> : <StatusIcons userId = { user.id }/> }
                </View>
              )
            }
          }))
        }

        let patchedAvatar = false
        const rowPatch = ([{ user }], res) => {
          if(!storage.userList) return
            
          const modifiedStatusIcons = findInReactTree(res?.props?.label, (c) => c.key == "TabsV2MemberListStatusIconsView")
          if(!modifiedStatusIcons) {
            res.props.label = (
              <View style = {{
                justifyContent: storage.oldUserListIcons ? "space-between": "flex-start",
                flexDirection: "row",
                alignItems: "center"
              }}
              key = "TabsV2MemberListStatusIconsView">
              { res.props.label }
            <View key = "TabsV2MemberListStatusIconsView" style = {{
              flexDirection: "row"
            }}>
            { debugLabels ? <Text>TV2MLSIV</Text> : <StatusIcons userId = { user.id }/> }
          </View>
        </View>
      )
      if(!patchedAvatar) {
        unpatches.push(patcher.before("type", res.props.icon.type, (args) => {
          if(storage.removeDefaultMobile) {
            args[0].isMobileOnline = false
          }
        }))
        patchedAvatar = true
      }
    }  
  }

  findByTypeNameAll("UserRow").forEach((UserRow) => unpatches.push(patcher.after("type", UserRow, rowPatch)))

  const MessagesItemChannelContent = findByTypeName("MessagesItemChannelContent")
    unpatches.push(patcher.after("type", MessagesItemChannelContent, (args, res) => {
      const channel = args[0]?.channel
      if(channel?.recipients?.length == 1) {
        const userId = channel.recipients[0]
        const textContainer = findInReactTree(res, m => m.props.children[0].props.variant =="redesign/channel-title/semibold"
        textContainer.props.children.push(<View key="TabsV2RedesignDMListIcons" style = {{
            flexDirection: "row"
          }}>
          { debugLabels ? <Text>TV2RDMLI</Text> : <StatusIcons userId = { userId }/> }
        </View>)    
      }  
    }))  
  },
  
  onUnload: () => {
    unpatches.forEach(u => u());
  },

  settings:()=>{
    return <Settings/>
  }
}
