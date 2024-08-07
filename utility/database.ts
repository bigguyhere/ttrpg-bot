import mysql, { Connection } from "mysql2";
import { Pool } from "mysql2/typings/mysql/lib/Pool";
import { LogLevel, LoggingFunctions, SeverityLevel } from "./logging";

module DatabaseFunctions {
    export function createDatabase(
        host: string | undefined,
        un: string | undefined,
        pw: string | undefined,
        dbName: string | undefined,
        port: number | undefined
    ) {
        const gamedb = mysql.createConnection({
            host: host,
            user: un,
            password: pw,
            port: port,
            charset: "utf8mb4",
        });

        gamedb.execute(
            `CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`,
            (err) => {
                if (err) {
                    LoggingFunctions.log(
                        `Issue Connecting to MYSQL Database\n${err.stack}`,
                        LogLevel.CRITICAL,
                        SeverityLevel.VERY_HIGH,
                        undefined,
                        true
                    );
                    throw err;
                }
            }
        );

        disconnect(gamedb);
    }

    /**
     * Allows the user to connect to a database instance given a hostname, database name, username, and password
     * @param host Hostname of the database
     * @param un Username of the user to be used to log into the database
     * @param pw Password of the user to be used to log into the database
     * @param dbName Name of the database to be used
     * @returns Database Connection object created to connect with the MySQL instance
     */
    export function connect(
        host: string | undefined,
        un: string | undefined,
        pw: string | undefined,
        dbName: string | undefined,
        port: number | undefined
    ): Connection {
        const gamedb = mysql.createConnection({
            host: host,
            user: un,
            password: pw,
            database: dbName,
            port: port,
            charset: "utf8mb4",
            multipleStatements: true,
        });

        gamedb.connect((err) => {
            if (err) {
                LoggingFunctions.log(
                    `Issue Connecting to MYSQL Database\n${err.stack}`,
                    LogLevel.CRITICAL,
                    SeverityLevel.VERY_HIGH,
                    undefined,
                    true
                );
                throw err;
            }
        });

        return gamedb;
    }

    export function createPool(
        host: string | undefined,
        un: string | undefined,
        pw: string | undefined,
        dbName: string | undefined,
        port: number | undefined
    ): Pool {
        const gamedb = mysql.createPool({
            host: host,
            user: un,
            password: pw,
            database: dbName,
            port: port,
            charset: "utf8mb4",
            multipleStatements: true,
        });

        return gamedb;
    }

    /**
     * Allows the user to disconnect from a database instance given the SQL connection presumably generated by the connect function
     * @param gamedb Database Connection object used to connect with the MySQL instance
     */
    export function disconnect(gamedb: Connection | Pool | undefined) {
        if (typeof gamedb === "undefined") {
            return;
        }

        gamedb.end((err) => {
            if (err) {
                LoggingFunctions.log(
                    `Issue disconnecting from MYSQL Database\n${err.stack}`,
                    LogLevel.ERROR,
                    SeverityLevel.HIGH
                );
                throw err;
            }
        });
    }
}

export { DatabaseFunctions };
