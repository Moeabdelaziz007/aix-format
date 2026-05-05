/**
 * 🛡️ SOVEREIGN_RESILIENCE_UTILS
 * Circuit Breakers and Retry Strategies for autonomous agents.
 * Made with Moe Abdelaziz
 */

export interface CentralCircuitState {
    name: string;
    status: 'closed' | 'open' | 'half-open';
    failures: number;
    lastFailureTime?: number;
}

export class CircuitBreaker {
    private state: CentralCircuitState;
    private failureThreshold: number;
    private recoveryTimeout: number;

    constructor(config: { name: string; failureThreshold: number; recoveryTimeout: number }) {
        this.state = {
            name: config.name,
            status: 'closed',
            failures: 0
        };
        this.failureThreshold = config.failureThreshold;
        this.recoveryTimeout = config.recoveryTimeout;
    }

    public async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state.status === 'open') {
            if (Date.now() - (this.state.lastFailureTime || 0) > this.recoveryTimeout) {
                this.state.status = 'half-open';
            } else {
                throw new Error(`Circuit ${this.state.name} is OPEN`);
            }
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess() {
        this.state.failures = 0;
        this.state.status = 'closed';
    }

    private onFailure() {
        this.state.failures++;
        this.state.lastFailureTime = Date.now();
        if (this.state.failures >= this.failureThreshold) {
            this.state.status = 'open';
            console.error(`🚨 [Resilience:Breaker] Circuit ${this.state.name} opened due to ${this.state.failures} failures`);
        }
    }

    public getState(): CentralCircuitState {
        return this.state;
    }
}
