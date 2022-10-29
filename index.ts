import DiscordJS, { Client, GatewayIntentBits, Events, EmbedBuilder } from 'discord.js'
import {UtilityFunctions}  from './utility'
import dotenv from 'dotenv'
import mysql from 'mysql'
import { ActiveGame, Character, DRCharacter, DRRelationship, DRSkill } from './models'

var DrCharacter = require('./models.ts').Character

const currentGameType = 'dr'
const gamesDBName = 'GamesDB'

dotenv.config()

const client = new DiscordJS.Client({
    intents:[
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
})

const gamedb = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'powerpufffluff',
    charset : 'utf8mb4'
})

gamedb.connect( (err) => {
    if(err){
        console.log('Issue Connecting to MYSQL Database.')
    }
    return
})

client.on('ready', () => {
    console.log('Bot is ready.')

    gamedb.query(`CREATE DATABASE IF NOT EXISTS ${gamesDBName}`, (err, res) => {
        if(err){
            console.log(err)
        }
    })

    const guildID = '1032153970254282753'

    const guild = client.guilds.cache.get(guildID)
    let commands

    if(guild){
        commands = guild.commands
    } else{
        commands = client.application?.commands
    }
    
    commands?.create({
        name: 'create-game',
        description: 'Creates game',
        options: [
            {
                name: 'game-name',
                description: 'Name of the TTRPG to be created.',
                required: true,
                type: 3
            },
            {
                name: 'dm-name',
                description: 'User who will be the DM of the created game. Defaults to user who set command.',
                required: false,
                type: 6
            },
            {
                name: 'game-type',
                description: 'Load Predefined TTRPG (Currently Implemented: DR).',
                required: false,
                type: 3
            },
            {
                name: 'additional-stats',
                description: 'Entered in form of "[Stat-Name-1]|[Data-Type],[Stat-Name-2],...". [Data-Type] is optional.',
                required: false,
                type: 3
            }
        ]
    })

    commands?.create({
        name: 'dr-add-chr',
        description: 'Adds a character to the game.',
        options: [
            {
                name: 'chr-name',
                description: 'Name of character in game.',
                required: true,
                type: 3
            },
            {
                name: 'brains',
                description: 'Brains stat value.',
                required: true,
                type: 10
            },
            {
                name: 'brawn',
                description: 'Brains stat value.',
                required: true,
                type: 10
            },
            {
                name: 'nimble',
                description: 'Brains stat value.',
                required: true,
                type: 10
            },
            {
                name: 'social',
                description: 'Brains stat value.',
                required: true,
                type: 10
            },
            {
                name: 'intuition',
                description: 'Brains stat value.',
                required: true,
                type: 10
            },
            {
                name: 'emote',
                description: 'Emote of character to be displayed. Must be an emote on this server.',
                required: false,
                type: 3
            },
            {
                name: 'pronouns',
                description: 'Pronouns to use by bot (Separate [P1]/[P2]). Defaults to They/Them.',
                required: false,
                type: 3
            },
            {
                name: 'chr-owner',
                description: 'User who owns the character, defaults to the user who executed the command.',
                required: false,
                type: 6
            },
            {
                name: 'ult-talent',
                description: 'Character\'s ultimate talent.',
                required: false,
                type: 3
            },
            {
                name: 'skills-list',
                description: 'List of skills for the character, should be less than the SP Total.',
                required: false,
                type: 3
            },
            {
                name: 'game-name',
                description: 'Game for which character should be added to. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    commands?.create({
        name: 'rmv-chr',
        description: 'Removes character from the game',
        options: [
            {
                name: 'chr-name',
                description: 'Name of character in game.',
                required: true,
                type: 3
            },
            {
                name: 'game-name',
                description: 'Game for which character should be removed resides. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    commands?.create({
        name: 'view-chr',
        description: 'View a character of a specific name.',
        options: [
            {
                name: 'chr-name',
                description: 'Name of character in game.',
                required: true,
                type: 3
            },
            {
                name: 'game-name',
                description: 'Game for which character should be viewed resides. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    commands?.create({
        name: 'roll',
        description: 'Rolls dice.',
        options: [
            {
                name: 'query',
                description: 'Query for dice roll. Should be in the form of [Number]d[Sides of Dice] +/- [Modifierd]',
                required: true,
                type: 3
            },
            {
                name: 'identifier',
                description: 'Replace "Result:" in roll with identifier.',
                required: false,
                type: 3
            }
        ]
    })

    commands?.create({
        name: 'change-game',
        description: 'Changes active game on server.',
        options: [
            {
                name: 'game-name',
                description: 'Name of the new active game.',
                required: true,
                type: 3
            }
        ]
    })

    commands?.create({
        name: 'change-stat',
        description: 'Changes stat of a character.',
        options: [
            {
                name: 'chr-name',
                description: 'Name of character whose stat should be changed.',
                required:true,
                type: 3
            },
            {
                name: 'stat-name',
                description: 'Name of stat to be changed.',
                required: true,
                type: 3
            },
            {
                name: 'stat-value',
                description: 'Value of stat to be changed.',
                required: true,
                type: 3
            },
            {
                name: 'game-name',
                description: 'Game where character\'s stats will be changed resides. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    commands?.create({
        name: 'set-dm',
        description: 'Changes active game on server.',
        options: [
            {
                name: 'newdm-name',
                description: 'User who will be the new DM of the specified.',
                required: true,
                type: 6
            },
            {
                name: 'game-name',
                description: 'Game for which DM will be changed. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    commands?.create({
        name: 'add-chr',
        description: 'Adds a character to the game.',
        options: [
            {
                name: 'chr-name',
                description: 'Name of character in game.',
                required: true,
                type: 3
            },
            {
                name: 'emote',
                description: 'Emote of character to be displayed. Must be an emote on this server.',
                required: false,
                type: 3
            },
            {
                name: 'pronouns',
                description: 'Pronouns to use by bot (Separate [P1]/[P2]). Defaults to They/Them.',
                required: false,
                type: 3
            },
            {
                name: 'chr-owner',
                description: 'User who owns the character, defaults to the user who executed the command.',
                required: false,
                type: 6
            },
            {
                name: 'health',
                description: 'Numerical value for health.',
                required: false,
                type: 10
            },
            {
                name: 'additional-stats',
                description: 'Additional stats to be added. Format in "[Stat-Name-1]|[Value-1],[Stat-Name-2]|[Value-2],...".',
                required: false,
                type: 3
            },
            {
                name: 'game-name',
                description: 'Game for which character should be added. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    commands?.create({
        name: 'view-summary',
        description: "View Summary of all characters in currently active game.",
        options:[
            {
                name: 'game-name',
                description: 'Game for which summary should be found for. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    commands?.create({
        name: 'view-relationship',
        description: 'View relationship between two characters',
        options: [
            {
                name: 'character-1',
                description: 'Name of character 1.',
                required: true,
                type: 3
            },
            {
                name: 'character-2',
                description: 'Name of character 2.',
                required: true,
                type: 3
            },
            {
                name: 'game-name',
                description: 'Game for which the relationship should be viewed. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    commands?.create({
        name: 'change-relationship',
        description: 'View relationship between two characters',
        options: [
            {
                name: 'character-1',
                description: 'Name of character 1.',
                required: true,
                type: 3
            },
            {
                name: 'character-2',
                description: 'Name of character 2.',
                required: true,
                type: 3
            },
            {
                name: 'value',
                description: 'Value in which to change the relationship.',
                required: true,
                type: 10
            },
            {
                name: 'game-name',
                description: 'Game for which relationship should be changed. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    console.log('Bot has completed setup.')
})

client.on(Events.InteractionCreate, async (interaction) => {
    if(!interaction.isChatInputCommand()){
        return
    }

    ActiveGame.createTable(gamedb, gamesDBName)

    const guildID = '1032153970254282753'

    const { commandName, options } = interaction
    const userId = interaction.user.id

    const gameName = options.getString('game-name')?.trim().replace(/ /g, '_')

    let activeGame = await ActiveGame.getCurrentGame(gamedb, 'GamesDB', '1032153970254282753', gameName)
            
    const tableNameBase = `${gamesDBName}.${guildID}_${activeGame?.gameName == null? gameName : activeGame?.gameName}`;

    if(commandName === 'create-game'){

        const gameType = options.getString('game-type')
        let DM = options.getUser('dm-name')?.id

        if(DM == null){
            DM = userId
        }

        let newGame = new ActiveGame(guildID, String(gameName), gameType, DM, true)

        newGame.addToTable(gamedb, gamesDBName)
        
        let additionalStats = Character.parseColumns(String(options.getString('additional-stats')))

        if(additionalStats == undefined){
            interaction.reply({
                content: 'Issue parsing additional columns.'
            })
            return
        }

        Character.createTable(gamedb, tableNameBase, additionalStats)

        if(gameType === 'dr'){
            DRCharacter.createTable(gamedb, tableNameBase)

            DRSkill.createTables(gamedb, tableNameBase)

            DRRelationship.createTable(gamedb, tableNameBase)

        } else if(gameType === 'pk'){
            interaction.reply({
                content: 'PokeTTRPG has not been implemented yet.'
            })
            return
        } else if(gameType === 'dnd'){
            interaction.reply({
                content: 'DnD has not been implemented yet.'
            })
            return   
        }

        interaction.reply({
            content: 'The game ' + '**\"' + gameName + '\"** has been successfully created.'
        })
    } else if(commandName === 'add-chr'){

        const charName = options.getString('chr-name', true)
        const chrUser = options.getUser('chr-owner')
        const stats = options.getString('additional-stats')
        let chrId

        if(chrUser == null){
            chrId = userId
        }else{
            chrId = String(chrUser.id)
        }

        let additionalStats

        additionalStats = Character.parseColumns(stats)

        if(additionalStats == undefined){
            interaction.reply({
                content: 'Issue parsing additional columns.'
            })
            return
        }

        let newChar = new Character(charName, 
                                    UtilityFunctions.getEmojiID(options.getString('emote')),
                                    options.getString('pronouns'),
                                    chrId,
                                    options.getNumber('health'),
                                    0,
                                    additionalStats);
        newChar.addToTable(gamedb, tableNameBase)    

        interaction.reply({
            content: 'The character ' + '**\"' + charName + '\"** has been successfully created.'
        })
    }
    else if(commandName === 'dr-add-chr'){

        if(activeGame?.gameType !== 'dr'){
            interaction.reply({
                content: 'Cannot add dr character to non-dr game.'
            })
            return
        }

        const charName = options.getString('chr-name', true)
        const chrUser = options.getUser('chr-owner')
        let chrId

        if(chrUser == null){
            chrId = userId
        }else{
            chrId = String(chrUser.id)
        }

        let newChar = new DRCharacter(charName, 
                                    UtilityFunctions.getEmojiID(options.getString('emote')),
                                    options.getString('pronouns'),
                                    chrId,
                                    options.getString('ult-talent'),
                                    0,
                                    0,
                                    options.getNumber('brains', true),
                                    options.getNumber('brawn', true),
                                    options.getNumber('nimble', true),
                                    options.getNumber('social', true),
                                    options.getNumber('intuition', true),
                                    []);
        newChar.addToTable(gamedb, tableNameBase)
        newChar.generateRelations(gamedb, tableNameBase)  

        interaction.reply({
            content: 'The character ' + '**\"' + charName + '\"** has been successfully created.'
        })
    } else if(commandName === 'rmv-chr'){
        const charName = options.getString('chr-name', true)

        let tbdChar
        if(activeGame?.gameType === 'dr'){
            tbdChar = await DRCharacter.getCharacter(gamedb, tableNameBase, charName)
        }else{
            tbdChar = new Character(charName, null, null, '', -1, -1, [])
        }

        tbdChar?.removeFromTable(gamedb, tableNameBase)    

        interaction.reply({
            content: 'The character ' + '**\"' + charName + '\"** has been successfully deleted.'
        })
    } else if(commandName === 'view-chr'){

        const charName = options.getString('chr-name', true)
        const user = interaction.user
        const guild = interaction.guild
        let char : Character | null

        if(activeGame?.gameType === 'dr'){
            char = await DRCharacter.getCharacter(gamedb, tableNameBase, charName)
        }else{
            char = await Character.getCharacter(gamedb, tableNameBase, charName)
        }

        if(char == null){
            interaction.reply({
                content: 'Finding character ' + '**\"' + charName + '\"** was unsuccessful.'
            })
            return
        }

        interaction.channel?.send({embeds : [char.buildViewEmbed(user, guild)] });

        interaction.reply({
            content: 'The character ' + '**\"' + charName + '\"** has been successfully viewed.'
        })
    } else if(commandName === 'roll'){
        const query = options.getString('query', true)
        let identifier = options.getString('identifier')

        if(identifier == null){
            identifier = 'Result'
        }

        identifier += ': '

        const result = UtilityFunctions.parseRoll(query)
        
        interaction.reply({content: `${interaction.user} :game_die:\n**${identifier}** ${result?.[0]}\n**Total:** ${result?.[1]}`})
    } else if(commandName === 'change-stat'){

        const charName = options.getString('chr-name', true)
        const statName = options.getString('stat-name', true)
        const statValue = options.getString('stat-value', true)
        
        let tbdChar = new Character(charName, null, null, '', -1, -1, []);
        if(!tbdChar.updateStat(gamedb, tableNameBase, statName, statValue)){
            interaction.reply({
                content: 'Cannot update the Name column of a character. Instead please remove the character and replace them with a new one.'
            })
            return 
        }

        interaction.reply({
            content: `The character stat **\"${statName}\"** for **\"${charName}\"** has successfully been changed to **\"${statValue}\"**.`
        })
    } else if(commandName === 'set-dm'){
        const newDM = options.getUser('newdm-name', true)

        if(activeGame == null){
            interaction.reply({
                content: 'Issue retrieving active game.'
            })
            return
        }
        const guild = client.guilds.cache.get(guildID)
        let oldDM = guild?.members.cache.get(activeGame.DM)

        activeGame.DM = newDM.id
        activeGame.setDM(gamedb, gamesDBName)

        interaction.reply({
            content: `DM successfully changed to from ${oldDM} to ${newDM}`
        })
    } else if(commandName === 'change-game'){

        let newGame = new ActiveGame(guildID, String(gameName), '', userId, true)

        newGame.changeGame(gamedb, gamesDBName)

        interaction.reply({
            content: `Game successfully changed to **\"${gameName}\"**`
        })
    } else if(commandName === 'view-summary'){
        
        if(activeGame == null){
            interaction.reply({
                content: 'Issue retrieving active game.'
            })
            return
        }

        let embed = Character.buildSummaryEmbed(interaction.user, interaction.guild, activeGame, await Character.getAllCharacters(gamedb, tableNameBase))

        if(embed == null){
            interaction.reply({
                content: 'Error finding all characters and building embed.'
            })
            return
        }

        interaction.channel?.send({embeds : [embed] });

        interaction.reply({
            content: 'The characters in ' + '**\"' + activeGame.gameName + '\"** has been successfully viewed.'
        })
        
    } else if(commandName === 'view-relationship'){
        const charName1 = options.getString('character-1', true)
        const charName2 = options.getString('character-2', true)

        let char1 = await DRCharacter.getCharacter(gamedb, tableNameBase, charName1)
        let char2 = await DRCharacter.getCharacter(gamedb, tableNameBase, charName2)

        if(char1 == null){
            interaction.reply({
                content: 'Error obtaining character 1.'
            })
            return
        } else if(char2 == null){
            interaction.reply({
                content: 'Error obtaining character 2.'
            })
            return
        }

        let relationship = await new DRRelationship(char1, char2).getRelationship(gamedb, tableNameBase)

        if(relationship == null){
            interaction.reply({
                content: 'Error obtaining relationship.'
            })
            return
        }

        interaction.channel?.send({embeds : [relationship.buildViewEmbed(interaction.user, interaction.guild)] });

        interaction.reply({
            content: `${charName1} and ${charName2}'s relationship has been successfully viewed`
        })
    } else if(commandName === 'change-relationship'){

        const charName1 = options.getString('character-1', true)
        const charName2 = options.getString('character-2', true)
        const value = options.getNumber('value', true)

        let char1 = await DRCharacter.getCharacter(gamedb, tableNameBase, charName1)
        let char2 = await DRCharacter.getCharacter(gamedb, tableNameBase, charName2)

        if(char1 == null){
            interaction.reply({
                content: 'Error obtaining character 1.'
            })
            return
        } else if(char2 == null){
            interaction.reply({
                content: 'Error obtaining character 2.'
            })
            return
        }

        let relationship = new DRRelationship(char1, char2)

        relationship.changeRelationship(gamedb, tableNameBase, value)

        interaction.reply({
            content: `${charName1} and ${charName2}'s relationship has been successfully updated to ${value}`
        })
    }
})

client.login(process.env.TOKEN)
