import {
    ApplicationCommand,
    ApplicationCommandManager,
    GuildApplicationCommandManager,
    GuildResolvable,
} from "discord.js";
import { DRSetup } from "./dr/dr_setup";
import { PkmSetup } from "./pkm/pkm.setup";

module CustomSetup {
    export function setup(
        commands:
            | GuildApplicationCommandManager
            | ApplicationCommandManager<
                  ApplicationCommand<{ guild: GuildResolvable }>,
                  { guild: GuildResolvable },
                  null
              >
            | undefined
    ): void {
        DRSetup.setup(commands);

        PkmSetup.setup(commands);
    }
}

export { CustomSetup };
