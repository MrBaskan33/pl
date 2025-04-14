import { registerCommand } from "@vendetta/commands"
import { pluginList, themeList } from "../commands"
import { COMMAND_OPTIONS, PLUGIN_LIST_COMMAND, THEME_LIST_COMMAND } from "../consts"
import { type RegisteredCommand } from ".."

export function load(): RegisteredCommand[] {
  const registeredCommands: RegisteredCommand[] = []

  const options = [{
    name: COMMAND_OPTIONS.NAME,
    displayName: COMMAND_OPTIONS.NAME,
    description: COMMAND_OPTIONS.DESCRIPTION,
    displayDescription: COMMAND_OPTIONS.DESCRIPTION,
    type: 5,
    required: false
  }] satisfies ApplicationCommandOption[]

  const commonProperties = <ApplicationCommand> {
    options: options,
    inputType: 1,
    type: 1,
    applicationId: "-1"
  }

  registeredCommands.push(
    registerCommand({
      name: PLUGIN_LIST_COMMAND.NAME,
      displayName: PLUGIN_LIST_COMMAND.DISPLAY_NAME,
      description: PLUGIN_LIST_COMMAND.DESCRIPTION,
      displayDescription: PLUGIN_LIST_COMMAND.DESCRIPTION,
      execute: pluginList,
      ...commonProperties
    }),
    registerCommand({
      name: THEME_LIST_COMMAND.NAME,
      displayName: THEME_LIST_COMMAND.DISPLAY_NAME,
      description: THEME_LIST_COMMAND.DESCRIPTION,
      displayDescription: THEME_LIST_COMMAND.DESCRIPTION,
      execute: themeList,
      ...commonProperties
    })
  )
  return registeredCommands
}
