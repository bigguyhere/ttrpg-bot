import DiscordJS, { Client, GatewayIntentBits, Events, EmbedBuilder } from 'discord.js'
import {UtilityFunctions}  from './utility'
import dotenv from 'dotenv'
import mysql from 'mysql'
import { ActiveGame, Character, DRCharacter, DRSkill } from './models'

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
    host: `localhost`,
    user: `root`,
    password: `powerpufffluff`
})

client.on('ready', () => {
    console.log('Bot is ready.')

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
                name: 'game_name',
                description: 'Name of the TTRPG to be created.',
                required: true,
                type: 3
            },
            {
                name: 'game_type',
                description: 'Load Predefined TTRPG (Currently Implemented: DR).',
                required: false,
                type: 3
            },
            {
                name: 'additional_stats',
                description: 'Entered in form of "[Stat_Name_1]|[Data_Type],[Stat_Name_2],...". [Data_Type] is optional.',
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
                name: 'chr_name',
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
                name: 'pronouns',
                description: 'Pronouns to use by bot (Separate [P1]/[P2]). Defaults to They/Them.',
                required: false,
                type: 3
            },
            {
                name: 'chr_owner',
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
            }
        ]
    })

    commands?.create({
        name: 'rmv-chr',
        description: 'Removes character from the game',
        options: [
            {
                name: 'chr_name',
                description: 'Name of character in game.',
                required: true,
                type: 3
            }
        ]
    })

    commands?.create({
        name: 'view-chr',
        description: 'View a character of a specific name.',
        options: [
            {
                name: 'chr_name',
                description: 'Name of character in game.',
                required: true,
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
                name: 'newgame_name',
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
                name: 'chr_name',
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
            }
        ]
    })

   /* commands?.create({
        name: 'set-DM',
        description: 'Changes active game on server.',
        options: [
            {
                name: 'newDM-name',
                description: 'User who will be the new DM of the currently active game.',
                required: true,
                type: 6
            }
        ]
    })*/


    commands?.create({
        name: 'add-chr',
        description: 'Adds a character to the game.',
        options: [
            {
                name: 'chr_name',
                description: 'Name of character in game.',
                required: true,
                type: 3
            },
            {
                name: 'pronouns',
                description: 'Pronouns to use by bot (Separate [P1]/[P2]). Defaults to They/Them.',
                required: false,
                type: 3
            },
            {
                name: 'chr_owner',
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
                name: 'additional_stats',
                description: 'Additional stats to be added. Format in "[Stat_Name_1]|[Value_1],[Stat_Name_2]|[Value_2],...".',
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

    gamedb.connect( (err) => {
        if(err){
            console.log('Issue Connecting to MYSQL Database.')
        }
        return
    })

    ActiveGame.createTable(gamedb, gamesDBName)

    const guildID = '1032153970254282753'


    let activeGame = await ActiveGame.getCurrentGame(gamedb, 'GamesDB', '1032153970254282753')

    const { commandName, options } = interaction
    const userId = interaction.user.id

    if(commandName === 'create-game'){

        const gameName = options.getString('game_name')?.trim().replace(/ /g, '_')
        const gameType = options.getString('game_type')


        let newGame = new ActiveGame(guildID, gameName, gameType, userId, true)

        newGame.addToTable(gamedb, gamesDBName)

        const tableNameBase = `${gamesDBName}.${guildID}_${gameName}`;
        
        let additionalStats = Character.parseColumns(String(options.getString('additional_stats')))

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

        } else if(gameType === 'pk'){
            interaction.reply({
                content: 'PokeTTRPG has not been implemented yet.'
            })
            return
        }

        interaction.reply({
            content: 'The game ' + '**\"' + gameName + '\"** has been successfully created.'
        })
    } else if(commandName === 'add-chr'){
            
        const tableNameBase = `${gamesDBName}.${guildID}_${activeGame?.gameName}`;

        const charName = options.getString('chr_name', true)
        const chr_user = options.getUser('chr_owner')
        const stats = options.getString('additional_stats')
        let chr_id

        if(chr_user == null){
            chr_id = userId
        }else{
            chr_id = String(chr_user.id)
        }

        let additional_stats

        additional_stats = Character.parseColumns(stats)

        if(additional_stats == undefined){
            interaction.reply({
                content: 'Issue parsing additional columns.'
            })
            return
        }

        let newChar = new Character(charName, 
                                    options.getString('pronouns'),
                                    chr_id,
                                    options.getNumber('health'),
                                    0,
                                    additional_stats);
        newChar.addToTable(gamedb, tableNameBase)    

        interaction.reply({
            content: 'The character ' + '**\"' + charName + '\"** has been successfully created.'
        })
    }
    else if(commandName === 'add-chr-dr'){

        if(activeGame?.gameType !== 'dr'){
            interaction.reply({
                content: 'Cannot add dr character to non-dr game.'
            })
            return
        }
            
        const tableNameBase = `${gamesDBName}.${guildID}_${activeGame?.gameName}`;

        const charName = options.getString('chr_name', true)
        const chr_user = options.getUser('chr_owner')
        let chr_id

        if(chr_user == null){
            chr_id = userId
        }else{
            chr_id = String(chr_user.id)
        }

        let newChar = new DRCharacter(charName, 
                                    options.getString('pronouns'),
                                    chr_id,
                                    options.getString('ult-talent'),
                                    options.getNumber('brains', true),
                                    options.getNumber('brawn', true),
                                    options.getNumber('nimble', true),
                                    options.getNumber('social', true),
                                    options.getNumber('intuition', true),
                                    []);
        newChar.addToTable(gamedb, tableNameBase)    

        interaction.reply({
            content: 'The character ' + '**\"' + charName + '\"** has been successfully created.'
        })
    } else if(commandName === 'rmv-chr'){
            
        const tableNameBase = `${gamesDBName}.${guildID}_${activeGame?.gameName}`;

        const charName = options.getString('chr_name', true)

        let tbdChar = new Character(charName, null, '', -1, -1, []);
        tbdChar.removeFromTable(gamedb, tableNameBase)    

        interaction.reply({
            content: 'The character ' + '**\"' + charName + '\"** has been successfully deleted.'
        })
    } else if(commandName === 'view-chr'){
            
        const tableNameBase = `${gamesDBName}.${guildID}_${activeGame?.gameName}`;

        const charName = options.getString('chr_name', true)
        const user = interaction.user
        const guild = client.guilds.cache.get(guildID)
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

        interaction.channel?.send({embeds : [char.buildEmbed(user, guild)] });

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
    }

    /*gamedb.end( (err) => {
        if(err){
            console.log('Issue Connecting to MYSQL Database.')
        }
        return
    })*/
})

client.login(process.env.TOKEN)
