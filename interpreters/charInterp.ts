import {
    CacheType,
    ChatInputCommandInteraction,
    Client,
    CommandInteractionOptionResolver,
} from "discord.js";
import { Connection, Pool } from "mysql2";
import { Character } from "../models/character";
import { UtilityFunctions } from "../utility/general";
import { Bridge, Interpreter } from "./abstract_models";

export class CharacterInterpreter extends Interpreter {
    protected userID: string;

    constructor(
        gamedb: Connection | Pool,
        tableNameBase: string,
        options: Omit<
            CommandInteractionOptionResolver<CacheType>,
            "getMessage" | "getFocused"
        >,
        client: Client<boolean>,
        interaction: ChatInputCommandInteraction<CacheType>
    ) {
        super(gamedb, tableNameBase, options, client, interaction);
        this.userID = interaction.user.id;
    }

    public async add(charName: string): Promise<string> {
        const chrUser = this.options.getUser("chr-owner");
        const stats = UtilityFunctions.formatNullString(
            this.options.getString("additional-stats")
        );
        const chrId = chrUser == null ? this.userID : String(chrUser.id);

        let additionalStats = UtilityFunctions.parseColumns(stats);
        if (additionalStats == undefined) {
            return "Issue parsing additional columns.";
        }

        let newChar = new Character(
            charName,
            UtilityFunctions.getEmojiID(
                UtilityFunctions.formatNullString(
                    this.options.getString("emote")
                )
            ),
            UtilityFunctions.formatNullString(
                this.options.getString("pronouns")
            ),
            chrId,
            this.options.getNumber("health"),
            0,
            UtilityFunctions.formatNullString(this.options.getString("status")),
            additionalStats
        );

        if (!(await newChar.addToTable(this.gamedb, this.tableNameBase))) {
            return `Error: Duplicate character **\"${charName}\"**.`;
        }

        return `The character **\"${charName}\"** has been successfully created.`;
    }

    public async remove(charName: string): Promise<string> {
        new Character(charName).removeFromTable(
            this.gamedb,
            this.tableNameBase
        );

        return `The character **\"${charName}\"** has been successfully deleted.`;
    }

    public async view(charName: string, bridge: Bridge): Promise<string> {
        const char = await bridge.getCharacter(charName);

        if (char == null) {
            return `Finding character **\"${charName}\"** was unsuccessful.`;
        }

        await this.interaction.channel?.send({
            embeds: [
                await char.buildViewEmbed(this.interaction.user, this.client),
            ],
        });

        return `The character **\"${charName}\"** has been successfully viewed.`;
    }

    public async changeStat(charName: string): Promise<string> {
        const statName = UtilityFunctions.formatString(
            this.options.getString("stat-name", true)
        );
        const statValue = UtilityFunctions.formatString(
            this.options.getString("stat-value", true)
        );
        let increment = this.options.getBoolean("increment");

        increment ??= false;

        if (
            !(await new Character(charName).updateStat(
                this.gamedb,
                this.tableNameBase,
                statName,
                statValue,
                increment
            ))
        ) {
            return "Issue updating stat. Please check your spelling and remember you cannot update the name stat.";
        }

        return (
            `The character stat **\"${statName}\"** for **\"${charName}\"** has successfully ` +
            `been ${
                increment ? "incremented by" : "changed to"
            } **\"${statValue}\"**.`
        );
    }
}
