import { ActiveGame } from "../../../models/activegame";
import { DRCharacter } from "../drmodels/drcharacter";
import { DRChrSkills, DRSkill } from "../drmodels/drskill";
import { UtilityFunctions } from "../../../utility/general";
import { Pagination } from "../../../utility/pagination";
import { Interpreter } from "../../../interpreters/abstract_models";

export class SkillInterpreter extends Interpreter {
    public add(): string {
        const skillName = UtilityFunctions.formatString(
            this.options.getString("skill-name", true)
        );

        new DRSkill(
            skillName,
            UtilityFunctions.formatNullString(
                this.options.getString("prereqs")
            ),
            UtilityFunctions.formatString(
                this.options.getString("description", true)
            ),
            this.options.getNumber("sp-cost", true),
            this.options.getString("type")
        ).addToTable(this.gamedb, this.tableNameBase);

        return `The skill **\"${skillName}\"** has been successfully created.`;
    }

    public remove(): string {
        const skillName = UtilityFunctions.formatString(
            this.options.getString("skill-name", true)
        );

        new DRSkill(skillName).removeFromTable(this.gamedb, this.tableNameBase);

        return `The skill **\"${skillName}\"** has been successfully removed.`;
    }

    public async assign(): Promise<string> {
        const chrName = UtilityFunctions.formatString(
            this.options.getString("char-name", true)
        );
        const skillName = UtilityFunctions.formatString(
            this.options.getString("skill-name", true)
        );

        const chr = await DRCharacter.getCharacter(
            this.gamedb,
            this.tableNameBase,
            chrName
        );
        const skill = await DRSkill.getSkill(
            this.gamedb,
            this.tableNameBase,
            skillName
        );

        if (chr == null) {
            return `Error finding character ${chrName}.`;
        }

        if (skill == null) {
            return `Error finding skill ${skillName}.`;
        }

        let newChrSkill = new DRChrSkills(chr.id, skill.id);

        let exists = await newChrSkill.ifExists(
            this.gamedb,
            this.tableNameBase
        );

        if (exists == null) {
            return `Error checking if ChrSkill exists.`;
        } else if (exists) {
            newChrSkill.removeFromTable(this.gamedb, this.tableNameBase);
            const decrement = -1 * skill.spCost;
            await chr.updateStat(
                this.gamedb,
                this.tableNameBase,
                "SPUsed",
                String(decrement),
                true
            );

            return `Removed skill **\"${skillName}\"** to character **\"${chrName}\"** successfully.`;
        } else {
            newChrSkill.addToTable(this.gamedb, this.tableNameBase);
            await chr.updateStat(
                this.gamedb,
                this.tableNameBase,
                "SPUsed",
                String(skill.spCost),
                true
            );

            return `Added skill **\"${skillName}\"** to character **\"${chrName}\"** successfully.`;
        }
    }

    public async view(activeGame: ActiveGame): Promise<string | null> {
        const chrName = UtilityFunctions.formatNullString(
            this.options.getString("char-name")
        );
        const skillName = UtilityFunctions.formatNullString(
            this.options.getString("skill-name")
        );
        const isDM = activeGame.DM === this.interaction.user.id;
        let isDynamic = this.options.getBoolean("is-dynamic");

        if (chrName != null && skillName != null) {
            return "Must choose either Skill summary or Character Skill summary, not both.";
        } else if (chrName != null) {
            if (isDynamic == null) {
                isDynamic = true;
            }

            return await this.viewChrTBs(chrName, isDM, isDynamic, activeGame);
        } else if (skillName != null) {
            return await this.viewSkill(skillName, isDM, activeGame);
        } else {
            if (isDynamic == null) {
                isDynamic = false;
            }

            return await this.viewTBSummary(isDM, isDynamic, activeGame);
        }
    }

    private async viewChrTBs(
        chrName: string,
        isDM: boolean,
        isDynamic: boolean,
        activeGame: ActiveGame
    ): Promise<string | null> {
        const chr = await DRCharacter.getCharacter(
            this.gamedb,
            this.tableNameBase,
            chrName
        );
        if (chr == null) {
            return `Error finding character ${chrName}.`;
        }

        let chrSkills = await chr.getAllChrSkills(
            this.gamedb,
            this.tableNameBase
        );

        if (
            chrSkills != null &&
            !isDM &&
            chr.owner !== this.interaction.user.id
        ) {
            chrSkills = chrSkills.filter((skill) => skill.Type === "PUB");
        }

        if (chrSkills?.length == 1) {
            await this.interaction.channel?.send({
                embeds: [
                    await chrSkills[0].buildViewEmbed(
                        this.interaction.user,
                        this.interaction.guild,
                        this.client,
                        activeGame
                    ),
                ],
            });

            return `**${chrName}'s** Skill **\"${chrSkills[0].name}\"** has been successfully viewed`;
        }

        const replyStr = `**${chrName}'s** skills has been successfully viewed.`;
        const embeds = isDynamic
            ? await DRSkill.buildDynamicViewEmbed(
                  this.interaction.user,
                  this.interaction.guild,
                  this.client,
                  activeGame,
                  chrSkills
              )
            : await chr.buildSkillEmbed(
                  this.interaction.user,
                  this.client,
                  chrSkills
              );

        if (embeds == null) {
            return `Error building embed.`;
        }

        if (embeds.length == 0) {
            return `No skills found for character **${chrName}**.`;
        }

        if (embeds.length != 1) {
            await Pagination.getPaginatedMessage(
                embeds,
                this.interaction,
                replyStr
            );
            return null;
        }

        await this.interaction.channel?.send({ embeds: [embeds[0]] });

        return replyStr;
    }

    private async viewSkill(
        skillName: string,
        isDM: boolean,
        activeGame: ActiveGame
    ): Promise<string | null> {
        const skill = await DRSkill.getSkill(
            this.gamedb,
            this.tableNameBase,
            skillName
        );
        if (skill == null) {
            return `Error finding skill ${skillName}.`;
        }

        if (
            skill.Type === "PRV" &&
            !isDM &&
            !(await skill.isViewable(
                this.gamedb,
                this.tableNameBase,
                this.interaction.user.id
            ))
        ) {
            return "Error: You do not have access to this skill.";
        }

        await this.interaction.channel?.send({
            embeds: [
                await skill.buildViewEmbed(
                    this.interaction.user,
                    this.interaction.guild,
                    this.client,
                    activeGame
                ),
            ],
        });

        return `Skill **\"${skillName}\"** has been successfully viewed`;
    }

    private async viewTBSummary(
        isDM: boolean,
        isDynamic: boolean,
        activeGame: ActiveGame
    ): Promise<string | null> {
        let allSkills = await DRSkill.getAllSkills(
            this.gamedb,
            this.tableNameBase
        );

        if (allSkills != null && !isDM) {
            allSkills = allSkills.filter((skill) => skill.Type !== "PRV");
        }

        const replyStr = "All skills have been successfully viewed";
        const embeds = isDynamic
            ? await DRSkill.buildDynamicViewEmbed(
                  this.interaction.user,
                  this.interaction.guild,
                  this.client,
                  activeGame,
                  allSkills
              )
            : await DRSkill.buildSummaryEmbed(
                  this.interaction.user,
                  this.interaction.guild,
                  this.client,
                  activeGame,
                  allSkills
              );

        if (embeds == null) {
            return `Error building embed.`;
        }

        if (embeds.length == 0) {
            return "No skills found.";
        }

        if (embeds.length != 1) {
            await Pagination.getPaginatedMessage(
                embeds,
                this.interaction,
                replyStr
            );
            return null;
        }

        await this.interaction.channel?.send({ embeds: [embeds[0]] });

        return replyStr;
    }
}
