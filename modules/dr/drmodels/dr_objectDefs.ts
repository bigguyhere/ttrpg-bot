import { RowDataPacket } from "mysql2";
import { ICharacterObj } from "../../../models/objectDefs";

interface IDRCharacterObj extends ICharacterObj {
    Talent: string | null;
    Hope: number;
    Despair: number;
    Brains: number;
    Brawn: number;
    Nimble: number;
    Social: number;
    Intuition: number;
}

interface IDRSkillObj extends RowDataPacket {
    Name: string;
    Prereqs: string | null | undefined;
    Description: string | undefined;
    SPCost: number | undefined;
    Type: string | null | undefined;
    SKL_ID: number;
}

interface IDRTruthBulletObj extends RowDataPacket {
    Name: string;
    Description: string;
    Trial: number | null;
    isUsed: boolean;
    TB_ID: number;
}

interface IDRHopeDespairChangeObj extends RowDataPacket {
    Name: string;
    Change: number;
}

interface IDRVoteResults extends RowDataPacket {
    Candidate: string | null;
    Emote: string | null;
    Talent: string | null;
    Status: string | null;
    Votes: number;
}

export {
    IDRCharacterObj,
    IDRSkillObj,
    IDRTruthBulletObj,
    IDRHopeDespairChangeObj,
    IDRVoteResults,
};
