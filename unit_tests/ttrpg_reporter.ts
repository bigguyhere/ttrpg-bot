import { BaseReporter, Config, ReporterOnStartOptions } from "@jest/reporters";
import { AggregatedResult, TestContext } from "@jest/test-result";
import { LogLevel, LoggingFunctions } from "../utility/logging";

export default class TTRPGReporter extends BaseReporter {
    private error?: Error;

    constructor(
        protected globalConfig: Config.GlobalConfig,
        protected options?: any
    ) {
        super();
        this.globalConfig = globalConfig;
        this.options = options;
    }

    public override log(message: string) {
        LoggingFunctions.log(
            `Log Message: ${JSON.stringify(message, null, 2)}`,
            LogLevel.INFO,
            undefined,
            undefined,
            true
        );
    }

    public override onRunStart(
        _results?: AggregatedResult,
        _options?: ReporterOnStartOptions
    ): void {
        this.log("tests started");
    }

    public override onRunComplete(
        _testContexts?: Set<TestContext>,
        _aggregatedResults?: AggregatedResult
    ): Promise<void> | void {
        this.log("tests completed");
    }
}
