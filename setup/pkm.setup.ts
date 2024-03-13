import { ApplicationCommand, ApplicationCommandManager, ApplicationCommandOptionType, GuildApplicationCommandManager, GuildResolvable } from "discord.js";

module PkmSetup {
    export function setup(commands: GuildApplicationCommandManager |
        ApplicationCommandManager<ApplicationCommand<
        {guild: GuildResolvable;}>, {guild: GuildResolvable;}, null> 
        | undefined) : void {

            commands?.create({
                name: 'poke-db',
                description: 'Faciliates interacting with general pokemon information.',
                options: [
                    {
                        name: 'view',
                        description: 'View a pokemon from within the database.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [ 
                            {
                                name: 'pkm-name',
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
                        name: 'moves',
                        description: 'View a pokemon\'s moves from within the database.',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [ 
                            {
                                name: 'pkm-name',
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
                    }
                ]
            })
    }
}

export{PkmSetup}