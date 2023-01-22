import { ActiveGame } from "../../../models/activegame"
import { DRCharacter } from "../../../models/custommodels/drmodels/drcharacter"
import { DRChrTBs, DRTruthBullet } from "../../../models/custommodels/drmodels/drtruthbullet"
import { UtilityFunctions } from "../../../utility/general"
import { Pagination } from "../../../utility/pagination"
import { Interpreter } from "../../interpreter_model"

export class TBInterpreter extends Interpreter {

    public async add() : Promise<string> {
        const tbName = UtilityFunctions.formatString(this.options.getString('tb-name', true))
        const assignAll = this.options.getBoolean('assign-all')

        const tb = new DRTruthBullet(tbName,
            this.options.getNumber('trial'),
            UtilityFunctions.formatString(this.options.getString('description', true)),
            false)
        tb.addToTable(this.gamedb, this.tableNameBase)

        if(assignAll){
            const chrs = await DRCharacter.getAllCharacters(this.gamedb, this.tableNameBase, true)

            if(chrs == null){
                return 'Issue getting characters.'
            }
            for(const chr of chrs){
                let newChrTB = new DRChrTBs(chr.id, tb.id)

                let exists = await newChrTB.ifExists(this.gamedb, this.tableNameBase)

                if(exists == null){
                    return `Error checking if ChrTB exists.`
                }else if(exists){
                    newChrTB.removeFromTable(this.gamedb, this.tableNameBase)
                }else{
                    newChrTB.addToTable(this.gamedb, this.tableNameBase)
                }
            }
        }

        return `The truth bullet **\"${tbName}\"** has been successfully created.`
    }

    public remove() : string {    
        const tbName = UtilityFunctions.formatString(this.options.getString('tb-name', true))

        new DRTruthBullet(tbName, this.options.getNumber('trial')).removeFromTable(this.gamedb, this.tableNameBase)    

        return `The truth bullet **\"${tbName}\"** has been successfully removed.`
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

    public async view(activeGame : ActiveGame) : Promise<string | null> {    
        const chrName = UtilityFunctions.formatNullString(this.options.getString('char-name'))
        const tbName = UtilityFunctions.formatNullString(this.options.getString('tb-name'))
        const trialNum = this.options.getNumber('trial')
        const isDM = activeGame.DM === this.interaction.user.id

        if(chrName != null && tbName != null){
            return 'Must choose either Truth Bullet summary or Character Truth Bullet summary, not both.'
        } else if(chrName != null){
            
            const chr = await DRCharacter.getCharacter(this.gamedb, this.tableNameBase, chrName)
            if(chr == null){
                return `Error finding character ${chrName}.`
            } 

            let chrTBs = await chr.getAllChrTBs(this.gamedb, this.tableNameBase, trialNum)

            if(chrTBs != null && !isDM && chr.owner !== this.interaction.user.id){
                chrTBs = chrTBs.filter(tb => tb.isUsed)
            }

            if(chrTBs?.length == 1){
                this.interaction.channel?.send({embeds : [chrTBs[0].buildViewEmbed(this.interaction.user, this.interaction.guild, activeGame)] });

                return `**${chrName}'s** Truth Bullet **\"${chrTBs[0].name}\"** has been successfully viewed`
            }

            const embeds = chr.buildTBEmbed(this.interaction.user, this.interaction.guild, chrTBs)
            if(embeds == null){
                return `Error building embed.`
            }

            const replyStr = `**${chrName}'s** truth bullets has been successfully viewed.`
            
            if(embeds.length != 1){
                Pagination.getPaginatedMessage(embeds, this.interaction, replyStr)
                return null
            }
            
            this.interaction.channel?.send({ embeds : [embeds[0]]});

            return replyStr
        } else if(tbName != null){
            
            const tb = await DRTruthBullet.getTB(this.gamedb, this.tableNameBase, tbName, trialNum)
            if(tb == null){
                return `Error finding truth bullet ${tbName}.`
            } 

            if(!tb.isUsed && !isDM && 
                !await tb.isViewable(this.gamedb, this.tableNameBase, this.interaction.user.id)){
                return 'Error: You do not have access to this truth bullet.'
            }
            
            this.interaction.channel?.send({embeds : 
                [tb.buildViewEmbed(this.interaction.user, this.interaction.guild, activeGame)] });

            return `Truth Bullet **\"${tbName}\"** has been successfully viewed.`
        } else{
            let allTBs = await DRTruthBullet.getAllTBs(this.gamedb, this.tableNameBase, trialNum)

             if(allTBs != null && !isDM){
                allTBs = allTBs.filter(tb => tb.isUsed)
            }

            const embeds = DRTruthBullet.buildSummaryEmbed(this.interaction.user, this.interaction.guild, activeGame, allTBs)
            if(embeds == null){
                return `Error building embed.`
            }
            
            const replyStr = 'All truth bullets have been successfully viewed.'
            
            if(embeds.length != 1){
                Pagination.getPaginatedMessage(embeds, this.interaction, replyStr)
                return null
            } 

            this.interaction.channel?.send({ embeds : [embeds[0]]});

            return replyStr
        } 
    }

}