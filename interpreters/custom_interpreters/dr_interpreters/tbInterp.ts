import { ActiveGame } from "../../../models/activegame"
import { DRCharacter } from "../../../models/custommodels/drmodels/drcharacter"
import { DRChrTBs, DRTruthBullet } from "../../../models/custommodels/drmodels/drtruthbullet"
import { UtilityFunctions } from "../../../utility/general"
import { Interpreter } from "../../interpreter_model"

export class TBInterpreter extends Interpreter {

    public add() : string {
        const tbName = UtilityFunctions.formatString(this.options.getString('tb-name', true))

        new DRTruthBullet(tbName,
            this.options.getNumber('trial'),
            UtilityFunctions.formatString(this.options.getString('description', true)),
            false).addToTable(this.gamedb, this.tableNameBase)

        return `The truth bullet **\"${tbName}\"** has been successfully created.`
    }

    public remove() : string {    
        const tbName = UtilityFunctions.formatString(this.options.getString('tb-name', true))

        new DRTruthBullet(tbName, this.options.getNumber('trial')).removeFromTable(this.gamedb, this.tableNameBase)    

        return `The skill **\"${tbName}\"** has been successfully removed.`
    }

    public use(activeGame : ActiveGame) : string {
        
        const value = activeGame.messageID == null ? null : true

        const tbName = UtilityFunctions.formatString(this.options.getString('tb-name', true))

        new DRTruthBullet(tbName, this.options.getNumber('trial')).useTB(this.gamedb, this.tableNameBase, value)

        return `Truth bullet **\"${tbName}\"** has been successfully usage toggled.`
    }

    public async assign() : Promise<string> {    
        const chrName = UtilityFunctions.formatString(this.options.getString('char-name', true))
        const tbName = UtilityFunctions.formatString(this.options.getString('tb-name', true))

        const chr = await DRCharacter.getCharacter(this.gamedb, this.tableNameBase, chrName)
        const tb = await DRTruthBullet.getTB(this.gamedb, this.tableNameBase, tbName, this.options.getNumber('trial'))

        if(chr == null){
            return `Error finding character ${chrName}.`
        } 
        
        if (tb == null){
            return `Error finding truth bullet ${tbName}.`
        }

        let newChrTB = new DRChrTBs(chr.id, tb.id)

        let exists = await newChrTB.ifExists(this.gamedb, this.tableNameBase)

        if(exists == null){
            return `Error checking if ChrTB exists.`
        }else if(exists){
            newChrTB.removeFromTable(this.gamedb, this.tableNameBase)

            return `Removed truth bullet **\"${tbName}\"** to character **\"${chrName}\"** successfully.`
        }else{
            newChrTB.addToTable(this.gamedb, this.tableNameBase)

            return `Added truth bullet **\"${tbName}\"** to character **\"${chrName}\"** successfully.`
        }
    }

    public async view(activeGame : ActiveGame) : Promise<string> {    
        const chrName = UtilityFunctions.formatNullString(this.options.getString('char-name'))
        const tbName = UtilityFunctions.formatNullString(this.options.getString('tb-name'))
        const trialNum = this.options.getNumber('trial')

        if(chrName != null && tbName != null){
            return 'Must choose either Truth Bullet summary or Character Truth Bullet summary, not both.'
        } else if(chrName != null){
            
            const chr = await DRCharacter.getCharacter(this.gamedb, this.tableNameBase, chrName)
            if(chr == null){
                return `Error finding character ${chrName}.`
            } 

            const chrSkills = await chr.getAllChrTBs(this.gamedb, this.tableNameBase, trialNum)

            const embedBuilder = chr.buildTBEmbed(this.interaction.user, this.interaction.guild, chrSkills)
            if(embedBuilder == null){
                return `Error building embed.`
            }
            
            this.interaction.channel?.send({embeds : [embedBuilder] });

            return `**${chrName}'s** truth bullets has been successfully viewed.`
        } else if(tbName != null){
            
            const tb = await DRTruthBullet.getTB(this.gamedb, this.tableNameBase, tbName, trialNum)
            if(tb == null){
                return `Error finding truth bullet ${tbName}.`
            } 
            
            this.interaction.channel?.send({embeds : 
                [tb.buildViewEmbed(this.interaction.user, this.interaction.guild, activeGame)] });

            return `Truth Bullet **\"${tbName}\"** has been successfully viewed.`
        } else{
            const allTBs = await DRTruthBullet.getAllTBs(this.gamedb, this.tableNameBase, trialNum)

            const embedBuilder = DRTruthBullet.buildSummaryEmbed(this.interaction.user, this.interaction.guild, activeGame, allTBs)
            if(embedBuilder == null){
                return `Error building embed.`
            }
            
            this.interaction.channel?.send({embeds : [embedBuilder] });

            return 'All truth bullets have been successfully viewed.'
        } 
    }

}