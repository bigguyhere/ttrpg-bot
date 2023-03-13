import { Client, CacheType, ChatInputCommandInteraction} from "discord.js"
import { Connection } from "mysql"
import { SelectBridge } from "./custom_interpreters/select_interpreter"
import { ActiveGame } from "../models/activegame"
import { UtilityFunctions }  from '../utility/general'
import { GameInterpreter } from "./std_interpreters/gameInterp"
import { CharacterInterpreter } from "./std_interpreters/charInterp"
import { InventoryInterpreter } from "./std_interpreters/invInterp"
import { InitInterpreter } from "./std_interpreters/initInterp"

module CommandBridge {
    /**
     * Replies with return of interpretHelper to original slash command
     * @param interaction - Interaction to be passed to interpretHelper
     * @param gamedb - Database connection to be passed to interpretHelper
     * @param guildID - GuildID (Server ID) to be passed to interpretHelper
     * @param client - Discord Client to be passed to interpretHelper
     */
    export async function reply(interaction: ChatInputCommandInteraction<CacheType>,
                                            gamedb: Connection,
                                            guildID: string,
                                            client: Client<boolean>) : Promise<void> {
        const content = await bridge(interaction, gamedb, guildID, client)
        if(content != null){
            await interaction.reply({
                content: content
            })
        }
    }

    /**
     * Interprets slash commands for characters, games, rolls, and items
     * @param interaction - Interaction generated by user's initial slash command
     * @param gamedb - Database connection where game data is stored
     * @param guildID - Current Discord Server ID
     * @param client - Discord Client generated for current instances
     */
    async function bridge(interaction: ChatInputCommandInteraction<CacheType>, 
                                            gamedb: Connection,
                                            guildID: string,
                                            client: Client<boolean>) : Promise<string | null> {
        ActiveGame.createTable(gamedb)
    
        let commandName = interaction.commandName
        const options = interaction.options
        const subcommandName = options.getSubcommand(false)

        const gameName = UtilityFunctions.formatNullString(options.getString('game-name'), / /g, '_')
        
        const activeGame = await ActiveGame.getCurrentGame(gamedb, 'GamesDB', guildID, gameName)
        const tableNameBase = `${guildID}_${activeGame?.gameName == null? gameName : activeGame?.gameName}`;
        const bridge = SelectBridge.select(activeGame?.gameType, gamedb, tableNameBase)

        if(subcommandName != null){
            const disabledCmd = bridge.getDisabledCmd(commandName, subcommandName)
            
            if(disabledCmd != undefined){
                return `**/${commandName} ${subcommandName}** is disabled for this game type. Please use **/${disabledCmd}** instead.`
            }
        }

        commandName = bridge.getOverrideCmd(commandName)

        if(commandName === 'game') {
            const gameInterpreter = new GameInterpreter(gamedb, tableNameBase, options, client, interaction)
            switch (subcommandName){
                case ('create'):
                    return gameInterpreter.createGame()
                case ('change'):
                    return gameInterpreter.changeGame()
                case ('set-dm'):
                    if(activeGame == null){
                        return 'Issue retrieving active game.'
                    }
                    return await gameInterpreter.changeDM(activeGame)
                case ('view-summary'):
                    if(activeGame == null){
                        return 'Issue retrieving active game.'
                    }
                    return await gameInterpreter.viewSummary(activeGame)
                case ('help'):
                    return await gameInterpreter.help()
            }
        } 
        else if(commandName === 'character') {
            const chrInterpreter = new CharacterInterpreter(gamedb, tableNameBase, options, client, interaction)
            const charName = UtilityFunctions.formatString(options.getString('char-name', true))
            switch (subcommandName){
                case ('add'):
                    return await chrInterpreter.add(charName)
                case ('remove'):
                    return await chrInterpreter.remove(charName)
                case ('view'):
                    return await chrInterpreter.view(charName, bridge)
                case ('change-stat'):
                    return chrInterpreter.changeStat(charName)
            }
        }
        else if(commandName === 'roll') {
            const query = options.getString('query', true)
            let identifier = options.getString('identifier')

            identifier ??= 'Result'
            identifier += ': '
    
            const result = UtilityFunctions.parseRoll(query)
            
            return `${interaction.user} :game_die:\n**${identifier}** ${result?.[0]}\n**Total:** ${result?.[1]}`
        }
        else if(commandName === 'inventory') {
            const invInterpreter = new InventoryInterpreter(gamedb, tableNameBase, options, client, interaction)
            const chrName = UtilityFunctions.formatString(options.getString('char-name', true))
            switch (subcommandName){
                case ('modify'):
                    return await invInterpreter.modify(chrName, bridge)
                case ('view'):
                    if(activeGame == null){
                        return 'Issue retrieving active game.'
                    }
                    return await invInterpreter.view(chrName, bridge, activeGame)
            }
        }
        else if (commandName === 'initiative') {
            const initInterpreter = new InitInterpreter(gamedb, tableNameBase, options, client, interaction)

            if(activeGame == null){
                return 'Issue retrieving active game.'
            }

            switch (subcommandName){
                case ('begin'):
                    return await initInterpreter.begin(activeGame)
                case ('end'):
                    return await initInterpreter.end(activeGame)
                case ('next'):
                    return await initInterpreter.next(activeGame)
                case ('add'):
                    return await initInterpreter.addCharacter(activeGame, bridge)
                case ('remove'):
                    return await initInterpreter.removeCharacter(activeGame)
                case ('active'):
                    return await initInterpreter.setActiveChar(activeGame)
                case ('hp'):
                    return await initInterpreter.changeHP(activeGame, bridge)
            }
        }

        // Calls custom interpreter if command is not within base commands
        const retVal = await bridge.parse(commandName, subcommandName, options, activeGame, client, interaction)
        return retVal === undefined ? 'Command Not Found.' : retVal
    }
    
}

export{CommandBridge}