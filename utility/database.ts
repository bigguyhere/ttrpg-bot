import mysql, { Connection } from 'mysql'

module DatabaseFunctions{

    /**
     * Allows the user to connect to a database instance given a hostname, database name, username, and password
     * @param host Hostname of the database
     * @param un Username of the user to be used to log into the database
     * @param pw Password of the user to be used to log into the database
     * @param dbName Name of the database to be used
     * @returns Database Connection object created to connect with the MySQL instance
     */
    export function connect(host : string | undefined, un : string | undefined, 
        pw : string | undefined, dbName : string | undefined) : Connection {
        const gamedb = mysql.createConnection({
            host: host,
            user: un,
            password: pw,
            database: dbName,
            charset : 'utf8mb4',
            multipleStatements: true
        });
        
        gamedb.connect( (err) => {
            if(err){
                console.log(`Issue Connecting to MYSQL Database. ${err}`)
                throw err
            }
        });

        return gamedb;
    }

    /**
     * Allows the user to disconnect from a database instance given the SQL connection presumably generated by the connect function
     * @param gamedb Database Connection object used to connect with the MySQL instance
     */
    export function disconnect(gamedb : Connection) {
        gamedb.end( (err) => {
            if(err){
                console.log(`Issue disconnecting from MYSQL Database. ${err}`)
                throw err
            }
        });
    }
}

export {DatabaseFunctions}