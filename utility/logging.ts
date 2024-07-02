import FileSystem from "fs";
import Path from "path";

export enum LogLevel {
    DEFAULT,
    INFO,
    DEBUG,
    WARNING,
    ERROR,
    CRITICAL,
}

export enum SeverityLevel {
    NONE,
    VERY_LOW, // Negligible errors: Errors that do not effect much of anything at all
    LOW, // Lower scale errors: Typically functionality can still be performed, but some minor inessential part has failed due to configuration or user error
    MEDIUM, // Typical errors: Errors where functionality cannot be performed, but doesn't imply a larger issue that will cause further problems
    HIGH, // Large-scale errors: Errors that cause functionality of command to not work and imply a larger system/configuration/implementation issue
    VERY_HIGH, // Critical/Load-bearing errors: Errors that cause entire application as a whole to not be able to function
}

module LoggingFunctions {
    export let DefaultPath: string = getDefaultPath();

    function getDefaultPath(): string {
        let returnStr = "";
        if (!FileSystem.existsSync("logs")) {
            FileSystem.mkdirSync("logs");
        }

        const now = new Date();
        const dateComponents: number[] = [
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            now.getHours(),
        ];

        for (const component of dateComponents) {
            returnStr += "-";

            if (component < 10) {
                returnStr += "0";
            }

            returnStr += component;
        }

        return `logs/${returnStr.substring(1)}h-log.log`;
    }

    export async function log(
        message: string,
        logLevel: LogLevel = LogLevel.DEFAULT,
        severity: SeverityLevel = SeverityLevel.NONE,
        path: string = DefaultPath,
        printToConsole: boolean = false,
        time?: number | string
    ): Promise<string> {
        const logLvlStr = logLevel === 0 ? "" : ` ${LogLevel[logLevel]}`;
        const severityStr =
            severity === 0 ? "" : ` (${SeverityLevel[severity]})`;
        const timeStr = time === undefined ? "" : `(${time} ms)`;
        const logMsg = `${new Date().toISOString()}${logLvlStr}${severityStr}: ${timeStr} ${message}`;

        const absolutePath = Path.resolve(path);
        FileSystem.writeFileSync(absolutePath, logMsg + "\n", { flag: "a" });

        if (printToConsole) {
            console.log(logMsg);
        }

        return message;
    }

    export async function logFunc<T>(
        message: string,
        logLevel: LogLevel = LogLevel.DEFAULT,
        severity: SeverityLevel = SeverityLevel.NONE,
        path: string = DefaultPath,
        printToConsole: boolean = false,
        func: (...args: any[]) => T,
        ...args: any[]
    ): Promise<T> {
        let time = performance.now();
        const returnValue = await func(...args);
        time = performance.now() - time;

        await log(
            message,
            logLevel,
            severity,
            path,
            printToConsole,
            time.toFixed(4)
        );

        return returnValue;
    }
}

export { LoggingFunctions };
