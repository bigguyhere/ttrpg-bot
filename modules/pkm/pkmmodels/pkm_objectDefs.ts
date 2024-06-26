import { RowDataPacket } from "mysql2";
import { ICharacterObj } from "../../../models/objectDefs";

interface IPKMCharacterObj extends ICharacterObj {
    Heart: number | undefined;
    Fitness: number | undefined;
    Research: number | undefined;
    Tactics: number | undefined;
    Advancement: number | undefined;
    Exp: number | undefined;
    Money: number | undefined;
    FirstImp: string | null | undefined;
    Calling: string | null | undefined;
}

export { IPKMCharacterObj };
