import { CacheType, ChatInputCommandInteraction, CommandInteractionOptionResolver } from "discord.js"
import { Connection } from "mysql"
import { Character } from "../../models/character"
import { UtilityFunctions } from "../../utility/general"
import { CustomInterpreter } from "../interpreter_model"

export class CharacterInterpreter{
    private userID : string
    constructor(private gamedb : Connection, 
                private tableNameBase : string,
                private options : Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">,
                private interaction : ChatInputCommandInteraction<CacheType>){
        this.gamedb = gamedb
        this.tableNameBase = tableNameBase
        this.options = options
        this.interaction = interaction
        this.userID = interaction.user.id
    }

    public async add() : Promise<string> {
        const charName = UtilityFunctions.formatString(this.options.getString('chr-name', true))
        const chrUser = this.options.getUser('chr-owner')
        const stats = UtilityFunctions.formatNullString(this.options.getString('additional-stats'))
        const chrId = chrUser == null ? this.userID : String(chrUser.id)

        let additionalStats = UtilityFunctions.parseColumns(stats)
        if(additionalStats == undefined){
            return 'Issue parsing additional columns.'
        }

        let newChar = new Character(charName, 
                                    UtilityFunctions.getEmojiID(
                                        UtilityFunctions.formatNullString(
                                            this.options.getString('emote'))),
                                    UtilityFunctions.formatNullString(this.options.getString('pronouns')),
                                    chrId,
                                    this.options.getNumber('health'),
                                    0,
                                    UtilityFunctions.formatNullString(this.options.getString('status')),
                                    additionalStats);
                                    
        if(!(await newChar.addToTable(this.gamedb, this.tableNameBase))){
            return `Error: Duplicate character **\"${charName}\"**.`
        }
        
        return `The character **\"${charName}\"** has been successfully created.`
    }

    public async remove(customInterp : CustomInterpreter | null) : Promise<string> {
        const charName = UtilityFunctions.formatString(this.options.getString('chr-name', true))
        const tbdChar = await customInterp?.getCharacter(charName)

        tbdChar?.removeFromTable(this.gamedb, this.tableNameBase)    

        return `The character **\"${charName}\"** has been successfully deleted.`
    }

    public async view(customInterp : CustomInterpreter | null) : Promise<string> {
        const charName = UtilityFunctions.formatString(this.options.getString('chr-name', true))
        const char = await customInterp?.getCharacter(charName)

        if(char == null){
            return `Finding character **\"${charName}\"** was unsuccessful.`
        }

        this.interaction.channel?.send(
            {embeds : [char.buildViewEmbed(this.interaction.user, this.interaction.guild)] })

        return `The character **\"${charName}\"** has been successfully viewed.`
    }

    public changeStat() : string {
        const charName = UtilityFunctions.formatString(this.options.getString('chr-name', true))
        const statName = UtilityFunctions.formatString(this.options.getString('stat-name', true))
        const statValue = UtilityFunctions.formatString(this.options.getString('stat-value', true))
        let increment = this.options.getBoolean('increment')

        increment ??= false
        
        let tbdChar = new Character(charName, null, null, '', -1, -1, '', []);
        if(!tbdChar.updateStat(this.gamedb, this.tableNameBase, statName, statValue, increment)){
            return 'Cannot update the Name column of a character. ' +
                    'Instead please remove the character and replace them with a new one.'
        }

        return `The character stat **\"${statName}\"** for **\"${charName}\"** has successfully been changed to **\"${statValue}\"**.`
    }
}