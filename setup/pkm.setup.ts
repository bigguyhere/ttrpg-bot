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
                    }
                ]
            })
    }
}

export{PkmSetup}