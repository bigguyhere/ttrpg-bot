import { Client, CacheType, ChatInputCommandInteraction} from "discord.js"
import { Connection } from "mysql"
import { CustomHandler } from "./custom_handler"
import { ActiveGame } from "./models/activegame"
import { Character } from "./models/character"
import { DRCharacter } from "./models/custommodels/drmodels/drcharacter"
import { DRRelationship } from "./models/custommodels/drmodels/drrelationship"
import { DRSkill } from "./models/custommodels/drmodels/drskill"
import { DRTruthBullet } from "./models/custommodels/drmodels/drtruthbullet"
import { Inventory } from "./models/inventory"
import { UtilityFunctions }  from './utility'

module CommandInterpreter{
    export async function interpret(interaction: ChatInputCommandInteraction<CacheType>,
                                            gamedb: Connection,
                                            guildID: string,
                                            client: Client<boolean>) : Promise<void> {
        interaction.reply({
            content: await interpretHelper(interaction, gamedb, guildID, client)
        })
    }

    export async function interpretHelper(interaction: ChatInputCommandInteraction<CacheType>, 
                                            gamedb: Connection,
                                            guildID: string,
                                            client: Client<boolean>) : Promise<string> {
        ActiveGame.createTable(gamedb)
    
        const { commandName, options } = interaction
        const userId = interaction.user.id
    
        const gameName = UtilityFunctions.formatString(options.getString('game-name'), / /g, '_')
    
        let activeGame = await ActiveGame.getCurrentGame(gamedb, 'GamesDB', guildID, gameName)
                
        const tableNameBase = `${guildID}_${activeGame?.gameName == null? gameName : activeGame?.gameName}`;

        if(commandName === 'create-game'){

            const gameType = UtilityFunctions.formatNullString(options.getString('game-type'))
            let DM = options.getUser('dm-name')?.id
    
            DM ??= userId
    
            const newGame = new ActiveGame(guildID, gameName, gameType, DM, true)
    
            newGame.addToTable(gamedb)
            
            let additionalStats = Character.parseColumns(
                UtilityFunctions.formatNullString(options.getString('additional-stats')))
            
            if(additionalStats == undefined){
                return 'Issue parsing additional columns.'
            }

            CustomHandler.initializeTables(gameType, gamedb, tableNameBase)
    
            Character.createTable(gamedb, tableNameBase, additionalStats)
            Inventory.createTable(gamedb, tableNameBase)

            return `The game **\"${gameName}\"** has been successfully created.`
        } else if(commandName === 'add-chr'){
    
            const charName = UtilityFunctions.formatString(options.getString('chr-name', true))
            const chrUser = options.getUser('chr-owner')
            const stats = UtilityFunctions.formatNullString(options.getString('additional-stats'))
            const chrId = chrUser == null ? userId : String(chrUser.id)

            let additionalStats = Character.parseColumns(stats)
            if(additionalStats == undefined){
                return 'Issue parsing additional columns.'
            }
    
            let newChar = new Character(charName, 
                                        UtilityFunctions.getEmojiID(
                                            UtilityFunctions.formatNullString(
                                                options.getString('emote'))),
                                        UtilityFunctions.formatNullString(options.getString('pronouns')),
                                        chrId,
                                        options.getNumber('health'),
                                        0,
                                        additionalStats);
            newChar.addToTable(gamedb, tableNameBase)    
    
            return `The character **\"${charName}\"** has been successfully created.`
        }else if(commandName === 'rmv-chr'){
            const charName = UtilityFunctions.formatString(options.getString('chr-name', true))
            const tbdChar = activeGame?.gameType === 'dr' 
                ? await DRCharacter.getCharacter(gamedb, tableNameBase, charName)
                : new Character(charName, null, null, '', -1, -1, [])
    
            tbdChar?.removeFromTable(gamedb, tableNameBase)    
    
            return `The character **\"${charName}\"** has been successfully deleted.`
        } else if(commandName === 'view-chr'){
            const charName = UtilityFunctions.formatString(options.getString('chr-name', true))
            const user = interaction.user
            const guild = interaction.guild
            const char = activeGame?.gameType === 'dr'
                ? await DRCharacter.getCharacter(gamedb, tableNameBase, charName)
                : await Character.getCharacter(gamedb, tableNameBase, charName)
    
            if(char == null){
                return `Finding character **\"${charName}\"** was unsuccessful.`
            }
    
            interaction.channel?.send({embeds : [char.buildViewEmbed(user, guild)] });
    
            return `The character **\"${charName}\"** has been successfully viewed.`
        } else if(commandName === 'roll'){
            const query = UtilityFunctions.formatString(options.getString('query', true))
            let identifier = UtilityFunctions.formatNullString(options.getString('identifier'))

            identifier ??= 'Result'
            identifier += ': '
    
            const result = UtilityFunctions.parseRoll(query)
            
            interaction.reply({content: `${interaction.user} :game_die:\n**${identifier}** ${result?.[0]}\n**Total:** ${result?.[1]}`})
        } else if(commandName === 'change-stat'){
            const charName = UtilityFunctions.formatString(options.getString('chr-name', true))
            const statName = UtilityFunctions.formatString(options.getString('stat-name', true))
            const statValue = UtilityFunctions.formatString(options.getString('stat-value', true))
            
            let tbdChar = new Character(charName, null, null, '', -1, -1, []);
            if(!tbdChar.updateStat(gamedb, tableNameBase, statName, statValue)){
                return 'Cannot update the Name column of a character. Instead please remove the character and replace them with a new one.'
            }

            return `The character stat **\"${statName}\"** for **\"${charName}\"** has successfully been changed to **\"${statValue}\"**.`
        } else if(commandName === 'set-dm'){
            const newDM = options.getUser('newdm-name', true)
    
            if(activeGame == null){
                return 'Issue retrieving active game.'
            }

            const guild = client.guilds.cache.get(guildID)
            const oldDM = guild?.members.cache.get(activeGame.DM)
    
            activeGame.DM = newDM.id
            activeGame.setDM(gamedb)
    
            return `DM successfully changed to from ${oldDM} to ${newDM}`
        } else if(commandName === 'change-game'){
            new ActiveGame(guildID, String(gameName), '', userId, true).changeGame(gamedb)
    
            return `Game successfully changed to **\"${gameName}\"**`
        } else if(commandName === 'view-summary'){
            if(activeGame == null){
                return 'Issue retrieving active game.'
            }
    
            let embed = Character.buildSummaryEmbed(interaction.user, 
                                                    interaction.guild, 
                                                    activeGame, 
                                                    await Character.getAllCharacters(gamedb, tableNameBase))
    
            if(embed == null){
                return 'Error finding all characters and building embed.'
            }
    
            interaction.channel?.send({embeds : [embed] });
    
            return `The characters in **\"${activeGame.gameName}\"** has been successfully viewed.`
        }  else if(commandName == 'view-inv'){
            const chrName = UtilityFunctions.formatString(options.getString('char-name', true))
    
            const chr = await Character.getCharacter(gamedb, tableNameBase, chrName)
            if(chr == null){
                return `Error finding character ${chrName}.`
            } 
    
            const itemName = UtilityFunctions.formatNullString(options.getString('item-name'))
    
            if(itemName == null){
                const chrItems = await chr.getAllChrItems(gamedb, tableNameBase)
    
                const embedBuilder = chr.buildInventoryEmbed(interaction.user, interaction.guild, chrItems)
                if(embedBuilder == null){
                    return `Error building embed.`
                }
                
                interaction.channel?.send({embeds : [embedBuilder] });
        
                return  `**${chrName}'s** inventory has been successfully viewed.`
            }else{
                if(activeGame == null){
                    return 'Issue retrieving active game.'
                }
    
                const item = await Inventory.getItem(gamedb, tableNameBase, chr.id, itemName)
    
                if(item == null){
                    return 'Error retrieving item.'
                } else if(item == false || item == true){
                    return 'Item does not exist.'
                }
    
                const embedBuilder = item.buildViewEmbed(interaction.user, interaction.guild, activeGame)
                if(embedBuilder == null){
                    return 'Error building embed.'
                }
                
                interaction.channel?.send({embeds : [embedBuilder] });
        
                return `**${chrName}'s** item **${itemName}** has been successfully viewed.`
            }
        }else if(commandName === 'modify-inv'){
            const chrName = UtilityFunctions.formatString(options.getString('char-name', true))

            const chr = await DRCharacter.getCharacter(gamedb, tableNameBase, chrName)
            if(chr == null){
                return `Error finding character ${chrName}.`
            } 

            const item = UtilityFunctions.formatString(options.getString('item-name', true))
            const quant = options.getNumber('quantity')
            const desc = UtilityFunctions.formatNullString(options.getString('description'))
            const weight = options.getNumber('weight')

            const inv = await Inventory.getItem(gamedb, tableNameBase, chr.id, item)

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

                newChrInv.addToTable(gamedb, tableNameBase)

                return `Character **${chrName}'s** inventory has been successfully updated to add 
                        **${newChrInv.quantity}** of **\"${item}\"**.`
            } else{
                const newQuant = inv.quantity + (quant == null ? 1 : quant);

                if(newQuant <= 0){
                    inv.removeFromTable(gamedb, tableNameBase)

                    return `Character **${chrName}'s** inventory has been successfully updated to remove 
                            item **\"${item}\"**.`
                }else{
                    inv.updateItem(gamedb, tableNameBase, newQuant, weight, desc)

                    return `Character **${chrName}\'s** inventory has been successfully updated to possess 
                            **${newQuant}** of **\"${item}\"**.`
                }
            }
        }

        return CustomHandler.determineInterpreter(activeGame?.gameType, commandName, options, activeGame, interaction, gamedb, tableNameBase)
    }
    
}

export{CommandInterpreter}