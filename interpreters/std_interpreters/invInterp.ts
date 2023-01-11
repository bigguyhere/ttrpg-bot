import { CacheType, ChatInputCommandInteraction, Client, CommandInteractionOptionResolver } from "discord.js"
import { Connection } from "mysql"
import { ActiveGame } from "../../models/activegame"
import { Inventory } from "../../models/inventory"
import { UtilityFunctions } from "../../utility/general"
import { CustomInterpreter } from "../interpreter_model"

export class InventoryInterpreter{
    constructor(private gamedb : Connection, 
                private tableNameBase : string,
                private options : Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">,
                private interaction : ChatInputCommandInteraction<CacheType>){
        this.gamedb = gamedb
        this.tableNameBase = tableNameBase
        this.options = options
        this.interaction = interaction
    }

    public async modify(customInterp : CustomInterpreter | null) : Promise<string> {
        const chrName = UtilityFunctions.formatString(this.options.getString('char-name', true))

        const chr = await customInterp?.getCharacter(chrName)
        if(chr == null){
            return `Error finding character ${chrName}.`
        } 

        const item = UtilityFunctions.formatString(this.options.getString('item-name', true))
        const quant = this.options.getNumber('quantity')
        const desc = UtilityFunctions.formatNullString(this.options.getString('description'))
        const weight = this.options.getNumber('weight')

        const inv = await Inventory.getItem(this.gamedb, this.tableNameBase, chr.id, item)

        if(inv == null){
            return `Error retrieving item ${item} in inventory for ${chrName}.`
        } 

        //If doesn't exist, then add new item to inventory
        //If does exist, change quantity (Remove if quantity results in less than 0)

        if(inv == false || inv == true){
            let newChrInv = new Inventory(chr.id, item, quant, desc, weight)

            if(newChrInv.quantity <= 0){
                return `Error: Cannot add item ${item} with nonpositive quantity (${quant}).`
            }

            newChrInv.addToTable(this.gamedb, this.tableNameBase)

            return `Character **${chrName}'s** inventory has been successfully updated to add 
                    **${newChrInv.quantity}** of **\"${item}\"**.`
        } else{
            const newQuant = inv.quantity + (quant == null ? 1 : quant);

            if(newQuant <= 0){
                inv.removeFromTable(this.gamedb, this.tableNameBase)

                return `Character **${chrName}'s** inventory has been successfully updated to remove 
                        item **\"${item}\"**.`
            }else{
                inv.updateItem(this.gamedb, this.tableNameBase, newQuant, weight, desc)

                return `Character **${chrName}\'s** inventory has been successfully updated to possess 
                        **${newQuant}** of **\"${item}\"**.`
            }
        }
    }

    public async view(customInterp : CustomInterpreter | null, activeGame : ActiveGame) : Promise<string> {
        const chrName = UtilityFunctions.formatString(this.options.getString('char-name', true))
    
        const chr = await customInterp?.getCharacter(chrName)
        if(chr == null){
            return `Error finding character ${chrName}.`
        } 

        const itemName = UtilityFunctions.formatNullString(this.options.getString('item-name'))

        if(itemName == null){
            const chrItems = await chr.getAllChrItems(this.gamedb, this.tableNameBase)

            const embedBuilder = chr.buildInventoryEmbed(this.interaction.user, this.interaction.guild, chrItems)
            if(embedBuilder == null){
                return `Error building embed.`
            }
            
            this.interaction.channel?.send({embeds : [embedBuilder] });
    
            return  `**${chrName}'s** inventory has been successfully viewed.`
        }else{
            if(activeGame == null){
                return 'Issue retrieving active game.'
            }

            const item = await Inventory.getItem(this.gamedb, this.tableNameBase, chr.id, itemName)

            if(item == null){
                return 'Error retrieving item.'
            } else if(item == false || item == true){
                return 'Item does not exist.'
            }

            const embedBuilder = item.buildViewEmbed(this.interaction.user, this.interaction.guild, activeGame)
            if(embedBuilder == null){
                return 'Error building embed.'
            }
            
            this.interaction.channel?.send({embeds : [embedBuilder] });
    
            return `**${chrName}'s** item **${itemName}** has been successfully viewed.`
        }
    }

}