import { RowDataPacket } from "mysql2";

interface ICharacterObj extends RowDataPacket {
    CHR_ID: number;
    Name: string;
    Emote: string | null;
    Pronouns: string | null;
    Owner: string;
    Health: number;
    DmgTaken: number;
    Status: string | null;
}

interface IItemObj extends RowDataPacket {
    CHR_ID: number;
    ItemName: string;
    Quantity: number | null;
    Description: string | null;
    Weight: number | null;
}

interface IInitiativeObj extends RowDataPacket {
    Name: string;
    Roll: number;
    isTurn: boolean;
    HP: number;
    Dmg: number;
    User: string;
    Emote: string | null;
}

interface IArbitraryStat extends RowDataPacket {
    Field: string;
    Type: string | number | boolean;
}

export { ICharacterObj, IItemObj, IInitiativeObj, IArbitraryStat };
