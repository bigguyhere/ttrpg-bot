import { ApplicationCommand, ApplicationCommandManager, ApplicationCommandOptionType, GuildApplicationCommandManager, GuildResolvable } from "discord.js";

module PkmSetup {
    export function setup(commands: GuildApplicationCommandManager |
        ApplicationCommandManager<ApplicationCommand<
        {guild: GuildResolvable;}>, {guild: GuildResolvable;}, null> 
        | undefined) : void {
            
            // Pkm look-up commands
            commands?.create({
                name: 'poke-db',
                description: 'Faciliates interacting with general pokemon information.',
                options: [
                    {
                        name: 'pkm-view',
                        description: 'View a pokemon from within the database.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [ 
                            {
                                name: 'name',
                                description: 'Name of the Pokemon to be viewed.',
                                required: true,
                                type: ApplicationCommandOptionType.String
                            },
                            {
                                name: 'form',
                                description: 'Name of region or form for pokemon forms. Don\'t put in original region for original region forms.',
                                required: false,
                                type: ApplicationCommandOptionType.String
                            },
                            {
                                name: 'game-name',
                                description: 'Game for which the relationship should be viewed. Defaults to currently active game.',
                                required: false,
                                type: ApplicationCommandOptionType.String
                            }
                        ]
                    },
                    {
                        name: 'pkm-moves',
                        description: 'View a pokemon\'s moves from within the database.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [ 
                            {
                                name: 'name',
                                description: 'Name of the Pokemon to be viewed.',
                                required: true,
                                type: ApplicationCommandOptionType.String
                            },
                            {
                                name: 'form',
                                description: 'Name of region or form for pokemon forms. Don\'t put in original region for original region forms.',
                                required: false,
                                type: ApplicationCommandOptionType.String
                            },
                            {
                                name: 'learn-type',
                                description: 'Method of learning of moves that to fetch. Defaults to all.',
                                required: false,
                                type: ApplicationCommandOptionType.Number,
                                choices: [
                                    {name: 'Level Up', value: 1},
                                    {name: 'TM', value: 4},
                                    {name: 'Move Tutor', value: 3},
                                    {name: 'Egg', value: 2}
                                ]
                            },
                            {
                                name: 'game-name',
                                description: 'Game for which the relationship should be viewed. Defaults to currently active game.',
                                required: false,
                                type: ApplicationCommandOptionType.String
                            }
                        ]
                    },
                    {
                        name: 'pkm-abilities',
                        description: 'View a pokemon\'s abilities from within the database.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [ 
                            {
                                name: 'name',
                                description: 'Name of the Pokemon to be viewed.',
                                required: true,
                                type: ApplicationCommandOptionType.String
                            },
                            {
                                name: 'form',
                                description: 'Name of region or form for pokemon forms. Don\'t put in original region for original region forms.',
                                required: false,
                                type: ApplicationCommandOptionType.String
                            },
                            {
                                name: 'game-name',
                                description: 'Game for which the relationship should be viewed. Defaults to currently active game.',
                                required: false,
                                type: ApplicationCommandOptionType.String
                            }
                        ]
                    },
                    {
                        name: 'move',
                        description: 'View a move\'s stats from within the database.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [ 
                            {
                                name: 'name',
                                description: 'Name of the move to be viewed.',
                                required: true,
                                type: ApplicationCommandOptionType.String
                            },
                            {
                                name: 'game-name',
                                description: 'Game for which the relationship should be viewed. Defaults to currently active game.',
                                required: false,
                                type: ApplicationCommandOptionType.String
                            }
                        ]
                    },
                    {
                        name: 'ability',
                        description: 'View a ability\'s stats from within the database.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [ 
                            {
                                name: 'name',
                                description: 'Name of the move to be viewed.',
                                required: true,
                                type: ApplicationCommandOptionType.String
                            },
                            {
                                name: 'game-name',
                                description: 'Game for which the relationship should be viewed. Defaults to currently active game.',
                                required: false,
                                type: ApplicationCommandOptionType.String
                            }
                        ]
                    }
                ]
            });

        // Pkm Character Commands
        commands?.create({
            name: 'pkm-character',
            description: 'Facilitates PKM character management.',
            options: [
                {
                    name: 'add',
                    description: 'Adds a PKM character to a PKM game.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'char-name',
                            description: 'Name of character in game.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'heart',
                            description: 'Heart stat value.',
                            required: true,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'fitness',
                            description: 'Fitness stat value. Also determines Stamina.',
                            required: true,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'research',
                            description: 'Research stat value.',
                            required: true,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'tactics',
                            description: 'Tactics stat value.',
                            required: true,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'advancement',
                            description: 'Trainer Advancement value. Defaults to 0.',
                            required: false,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'exp',
                            description: 'Currently stored EXP value. Defaults to 0.',
                            required: false,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'money',
                            description: 'Money value. Defaults to 0.',
                            required: false,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'first-impression',
                            description: 'First Impression of Trainer when meeting them.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'calling',
                            description: 'Trainer\'s calling in life.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'emote',
                            description: 'Emote of character to be displayed. Must be an emote on this server.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'pronouns',
                            description: 'Pronouns to use by bot (Separate [P1]/[P2]). Defaults to They/Them.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'char-owner',
                            description: 'User who owns the character, defaults to the user who executed the command.',
                            required: false,
                            type: ApplicationCommandOptionType.User
                        },
                        {
                            name: 'ult-talent',
                            description: 'Character\'s ultimate talent.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which character should be added to. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                }
            ]
        });
    }
}

export{PkmSetup}