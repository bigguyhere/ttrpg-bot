import { CacheType, ChatInputCommandInteraction, Client, CommandInteractionOptionResolver } from "discord.js"
import { Connection } from "mysql"
import { ActiveGame } from "../../models/activegame"
import { Character } from "../../models/character"
import { Inventory } from "../../models/inventory"
import { UtilityFunctions } from "../../utility/general"
import { SelectInterpreter } from "../select_interpreter"

export class GameInterpreter{
    private userID : string
    private gameName : string | null
    constructor(private gamedb : Connection, 
                private tableNameBase : string,
                private options : Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">,
                private interaction : ChatInputCommandInteraction<CacheType>,
                private guildID : string){
        this.gamedb = gamedb
        this.tableNameBase = tableNameBase
        this.options = options
        this.interaction = interaction
        this.userID = interaction.user.id
        this.guildID = guildID
        this.gameName = UtilityFunctions.formatNullString(options.getString('game-name'), / /g, '_')
    }

    public createGame() : string {
        const gameType = UtilityFunctions.formatNullString(this.options.getString('game-type'))

        let DM = this.options.getUser('dm-name')?.id

        DM ??= this.userID

        const newGame = new ActiveGame(this.guildID, this.gameName, gameType, DM, true, '',
                         0, 0, false, null, null)

        newGame.addToTable(this.gamedb)
        
        let additionalStats = UtilityFunctions.parseColumns(
            UtilityFunctions.formatNullString(this.options.getString('additional-stats')))
        
        if(additionalStats == undefined){
            return 'Issue parsing additional columns.'
        }

        Character.createTable(this.gamedb, this.tableNameBase, additionalStats)
        Inventory.createTable(this.gamedb, this.tableNameBase)
        SelectInterpreter.select(gameType, this.gamedb, this.tableNameBase)?.initializeTables()

        return `The game **\"${this.gameName}\"** has been successfully created.`
    }

    public changeGame() : string {
        new ActiveGame(this.guildID, String(this.gameName), '', 
            this.userID, true, '', 0, 0, false, null, null).changeGame(this.gamedb)
    
        return `Game successfully changed to **\"${this.gameName}\"**`
    }

    public changeDM(activeGame : ActiveGame, client: Client<boolean>) : string {
        const newDM = this.options.getUser('newdm-name', true)
    
        if(activeGame == null){
            return 'Issue retrieving active game.'
        }

        const guild = client.guilds.cache.get(this.guildID)
        const oldDM = guild?.members.cache.get(activeGame.DM)

        activeGame.DM = newDM.id
        activeGame.setDM(this.gamedb)

        return `DM successfully changed to from ${oldDM} to ${newDM}`
    }

    public async viewSummary(activeGame : ActiveGame) : Promise<string> {
        if(activeGame == null){
            return 'Issue retrieving active game.'
        }

        let embed = Character.buildSummaryEmbed(this.interaction.user, 
                                                this.interaction.guild, 
                                                activeGame, 
                                                await Character.getAllCharacters(this.gamedb, this.tableNameBase))

        if(embed == null){
            return 'Error finding all characters and building embed.'
        }

        this.interaction.channel?.send({embeds : [embed] });

        return `The characters in **\"${activeGame.gameName}\"** has been successfully viewed.`
    }
}