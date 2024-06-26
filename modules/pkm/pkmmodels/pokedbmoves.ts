import DiscordJS, { Client, EmbedBuilder } from "discord.js";
import {
    EmojiTypeMap,
    MoveLearnMethod,
    PkmUtilityFunctions,
    Status,
    StatusEffect,
    Type,
} from "../pkm_utility";
import { PokeDBPKM } from "./pokedbpkm";
import { ActiveGame } from "../../../models/activegame";

export class PokeDBMove {
    public statusList: Status[] = [];
    public effect: string | null = null;
    public type: string = "NONE";

    constructor(
        public name: string,
        data: any | null,
        public label?: string | null
    ) {
        this.name = PkmUtilityFunctions.formatStr(name);
        this.label = label;
        if (data) {
            const flavor = data["flavor"];
            if (flavor && Array.isArray(flavor) && flavor.length == 1) {
                this.effect = flavor[0]["flavor_text"] as string;
            }

            if (data["type_id"]) {
                this.type = Type[data["type_id"] - 1];
            }

            if (data["meta"] && data["meta"][0]) {
                const metadata = data["meta"][0];
                if (metadata["ailment"] && metadata["ailment"]["name"]) {
                    const key = metadata["ailment"]["name"];
                    const value = StatusEffect[key];
                    if (key && key.toLowerCase() !== "none" && value) {
                        this.statusList.push({
                            name: key,
                            value: -1,
                            emoji: value,
                        });
                    }
                }

                if (metadata["flinch_chance"]) {
                    const value = StatusEffect["flinch"];
                    this.statusList.push({
                        name: "flinch",
                        value: metadata["flinch_chance"],
                        emoji: value,
                    });
                }
            }

            if (data["stat_changes"]) {
                const stats = data["stat_changes"];
                let increase = false,
                    decrease = false;
                for (let i = 0; i < stats.length; ++i) {
                    if (stats[i]["change"] > 0) {
                        increase = true;
                    } else {
                        decrease = true;
                    }
                }

                if (increase) {
                    const value = StatusEffect["increaseStat"];
                    this.statusList.push({
                        name: "increaseStat",
                        value: 1,
                        emoji: value,
                    });
                }

                if (decrease) {
                    const value = StatusEffect["decreaseStat"];
                    this.statusList.push({
                        name: "decreaseStat",
                        value: -1,
                        emoji: value,
                    });
                }
            }
        }
    }

    public static async getMoveList(data: any | null): Promise<PokeDBMove[]> {
        let movesList: PokeDBMove[] = [];
        if (data["moves"] && Array.isArray(data["moves"])) {
            for (let i = 0; i < data["moves"].length; ++i) {
                const move = data["moves"][i]["move"];
                const method = data["moves"][i][
                    "move_learn_method_id"
                ] as number;

                movesList.push(
                    new PokeDBMove(
                        move["name"],
                        move,
                        MoveLearnMethod[method - 1]
                    )
                );
            }
        }

        return movesList;
    }

    private static pruneMoves(moves: Array<PokeDBMove>) {
        return moves
            .filter((move) => {
                return move.label !== null;
            })
            .sort((move1, move2) => {
                const lbl1 = !move1.label ? "" : move1.label;
                const lbl2 = !move2.label ? "" : move2.label;

                if (lbl1 > lbl2) {
                    return 1;
                } else if (lbl1 < lbl2) {
                    return -1;
                } else {
                    return 0;
                }
            });
    }

    public async buildViewEmbed(
        user: DiscordJS.User,
        client: Client<boolean>,
        activeGame: ActiveGame
    ): Promise<EmbedBuilder> {
        const emoji = EmojiTypeMap[this.type];
        let descStr = `**DM:** ${await client.users.fetch(activeGame.DM)}\n
                        **Type:** ${emoji} ${this.type} ${emoji}\n
                        **Description:** ${this.effect}\n`;

        if (this.statusList.length > 0) {
            descStr += "\n**Statuses:**\n";

            for (let status of this.statusList) {
                descStr += `${
                    status.emoji
                } ${PkmUtilityFunctions.formatUpperCase(status.name)} ${
                    status.emoji
                } `;
            }
        }

        return new EmbedBuilder()
            .setColor(0x7852a9)
            .setTitle(`**${this.name}**`)
            .setAuthor({
                name: `${user.username}`,
                iconURL: String(user.displayAvatarURL()),
            })
            .setDescription(descStr)
            .setTimestamp();
    }

    public static async buildSummaryEmbed(
        user: DiscordJS.User,
        client: Client<boolean>,
        activeGame: ActiveGame,
        pkm: PokeDBPKM,
        moves: Array<PokeDBMove> | null,
        paginationLimit: number = 10
    ): Promise<EmbedBuilder[] | null> {
        if (moves == null) {
            return null;
        }

        let embeds: EmbedBuilder[] = [];
        moves = this.pruneMoves(moves);
        const numEmbeds =
            moves.length > 0 ? Math.ceil(moves.length / paginationLimit) : 1;

        for (let i = 0; i < numEmbeds; ++i) {
            embeds.push(
                new EmbedBuilder()
                    .setColor(0x7852a9)
                    .setTitle(`**${pkm.name} Move Summary Page ${i + 1}**`)
                    .setAuthor({
                        name: `${user.username}`,
                        iconURL: String(user.displayAvatarURL()),
                    })
                    .setThumbnail(pkm.imageURL)
                    .setTimestamp()
            );

            let descStr = `**DM:** ${await client.users.fetch(
                activeGame.DM
            )}\n`;

            const curLimit = paginationLimit * (i + 1);
            const limit = curLimit > moves.length ? moves.length : curLimit;
            for (let j = paginationLimit * i; j < limit; ++j) {
                const typeEmoji = EmojiTypeMap[moves[j].type];
                descStr += `\n${typeEmoji} **${
                    moves[j].name
                }** - ${PkmUtilityFunctions.formatStr(String(moves[j].label))}`;
                if (moves[j].statusList.length > 0) {
                    descStr += " - ";
                    for (let status of moves[j].statusList) {
                        descStr += status.emoji;
                    }
                }
            }

            embeds[i].setDescription(descStr);
        }

        return embeds;
    }
}
