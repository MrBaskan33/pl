import { findByStoreName } from "@vendetta/metro"
import { findInReactTree } from "@vendetta/utils"
import React from "react"
import StatusIcon from "./statusIcon"
import { getStatusColor } from "./colors"
import { FluxDispatcher } from "@vendetta/metro/common"
import { storage } from "@vendetta/plugin"
import { useProxy } from "@vendetta/storage"

const PresenceStore = findByStoreName("PresenceStore")
const SessionsStore = findByStoreName("SessionsStore")
const UserStore = findByStoreName("UserStore")

let statusCache
let statusCacheHits = 0
let statusCacheTimeout
let currentUserId

function queryPresenceStoreWithCache() {
  if(!statusCacheTimeout) {
    statusCacheTimeout = setTimeout(() => {
      statusCacheHits = 0
      statusCacheTimeout = null
    },5000)
  }

  if(!statusCache || statusCacheHits == 0) {
    statusCache = PresenceStore.getState()
  }

  statusCacheHits = (statusCacheHits+1) % 20
  return statusCache
}

function getUserStatuses(userId) {
  let statuses

  if(!currentUserId) {
    currentUserId = UserStore.getCurrentUser()?.id
  }

  if(userId == currentUserId) {
    statuses = Object.values(SessionsStore.getSessions()).reduce((acc: any, curr: any) => {
      if(curr.clientInfo.client !== "unknown")
      acc[curr.clientInfo.client] = curr.status
      return acc
    }, {})
  } else {
    statuses = queryPresenceStoreWithCache()?.clientStatuses[userId]
  }
  return statuses
}

export default function StatusIcons(props) {
  useProxy(storage)
  const userId = props.userId
  const iconSize = props.size ?? 16
  const statuses = getUserStatuses(userId)
    
  return (
    <>
      { Object.keys(statuses ?? {}).map((s) => 
      <StatusIcon platform = {s} color = { getStatusColor(statuses[s],storage.fallbackColors) } iconSize = { iconSize }/>) }
    </>
  )
}
