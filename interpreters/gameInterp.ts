import { ApplicationCommandSubCommand, CacheType, ChatInputCommandInteraction, Client, CommandInteractionOptionResolver } from "discord.js"
import { Connection } from "mysql"
import { ActiveGame } from "../models/activegame"
import { Character } from "../models/character"
import { Inventory } from "../models/inventory"
import { UtilityFunctions } from "../utility/general"
import { Pagination } from "../utility/pagination"
import { SelectBridge } from "../modules/select_interpreter"
import { Interpreter } from "./abstract_models"

export class GameInterpreter extends Interpreter {
    protected userID : string
    protected gameName : string | null
    protected guildID : string
    constructor(gamedb : Connection, 
                tableNameBase : string,
                options : Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">,
                client : Client<boolean>,
                interaction : ChatInputCommandInteraction<CacheType>){
        super(gamedb, tableNameBase, options, client, interaction)
        this.userID = interaction.user.id
        this.guildID = String(interaction.guild?.id)
        this.gameName = UtilityFunctions.formatNullString(options.getString('game-name'), / /g, '_')
    }

    public createGame() : string {
        const gameType = UtilityFunctions.formatNullString(this.options.getString('game-type'))

        let DM = this.options.getUser('dm-name')?.id

        DM ??= this.userID

        const newGame = new ActiveGame(this.guildID, this.gameName, gameType, DM)

        newGame.addToTable(this.gamedb)
        
        let additionalStats = UtilityFunctions.parseColumns(
            UtilityFunctions.formatNullString(this.options.getString('additional-stats')))
        
        if(additionalStats == undefined){
            return 'Issue parsing additional columns.'
        }

        Character.createTable(this.gamedb, this.tableNameBase, additionalStats)
        Inventory.createTable(this.gamedb, this.tableNameBase)
        SelectBridge.select(gameType, this.gamedb, this.tableNameBase).initializeTables()

        return `The game **\"${this.gameName}\"** has been successfully created.`
    }

    public changeGame() : string {
        new ActiveGame(this.guildID, String(this.gameName), '', this.userID).changeGame(this.gamedb)
    
        return `Game successfully changed to **\"${this.gameName}\"**`
    }

    public async changeDM(activeGame : ActiveGame) : Promise<string> {
        const newDM = this.options.getUser('newdm-name', true)
    
        if(activeGame == null){
            return 'Issue retrieving active game.'
        }

        const oldDM = await this.client.users.fetch(activeGame.defaultRoll)
        activeGame.DM = newDM.id
        activeGame.setDM(this.gamedb)

        return `DM successfully changed to from ${oldDM} to ${newDM}`
    }

    public async viewSummary(activeGame : ActiveGame) : Promise<string | null> {
        if(activeGame == null){
            return 'Issue retrieving active game.'
        }

        let embeds = await Character.buildSummaryEmbed(this.client,
                                                this.interaction.user, 
                                                this.interaction.guild, 
                                                activeGame, 
                                                await Character.getAllCharacters(this.gamedb, this.tableNameBase))

        if(embeds == null){
            return 'Error finding all characters and building embed.'
        }

        const replyStr = `The characters in **\"${activeGame.gameName}\"** has been successfully viewed.`
            
        if(embeds.length != 1){
            await Pagination.getPaginatedMessage(embeds, this.interaction, replyStr)
            return null
        } 

        await this.interaction.channel?.send({ embeds : [embeds[0]]});

        return replyStr
    }

    public async help (): Promise<string | null> {

        const commandName = UtilityFunctions.formatNullString(this.options.getString('command-name'), / /g, '-')
        let commandStr = ""
        const commands = await this.interaction.client.application.commands.fetch({guildId: this.guildID})

        if(commandName == null){
            let embeds = await ActiveGame.buildSummaryEmbed(
                this.interaction.user, 
                this.interaction.guild, 
                commands)

            if(embeds == null){
                return 'Error finding all help messages and building embed.'
            }

            commandStr = 'Command List Successfully Viewed.'

            if(embeds.length != 1){
                await Pagination.getPaginatedMessage(embeds, this.interaction, commandStr)
                return null
            } 

            await this.interaction.channel?.send({ embeds : [embeds[0]]});
            
        } else{
            let command = null;
            for(const cmd of commands) {
                if(cmd[1].name === commandName){
                    command = cmd[1]
                }

                for(let opt of cmd[1].options){
                    if(opt.type == 1){
                        const option = opt as ApplicationCommandSubCommand
                        if(`${cmd[1].name}-${option.name}` === commandName){
                            command = option
                        }
                    }
                }
            }

            if(command == null) {
                return `Error finding **${commandName}**.`
            }
            
            let embeds = await ActiveGame.buildViewEmbed(
                this.interaction.user, 
                this.interaction.guild, 
                command)

            if(embeds == null){
                return `Error creating help page for **${commandName}**.`
            }

            commandStr = 'Command Successfully Viewed.'

            if(embeds.length != 1){
                await Pagination.getPaginatedMessage(embeds, this.interaction, commandStr)
                return null
            } 

            await this.interaction.channel?.send({ embeds : [embeds[0]]});
        }

        return commandStr;

    }


}