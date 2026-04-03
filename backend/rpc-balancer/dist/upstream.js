"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpstreamManager = void 0;
const types_1 = require("./types");
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)({ name: 'rpc-upstream' });
const HEALTH_CHECK_INTERVAL_MS = 10_000;
const LATENCY_WINDOW_SIZE = 100;
const MAX_CONSECUTIVE_FAILURES = 3;
const RECOVERY_PROBE_INTERVAL_MS = 30_000;
class UpstreamManager {
    states = new Map();
    healthTimer;
    constructor(configs) {
        for (const config of configs) {
            this.states.set(config.name, {
                config,
                healthy: true, // assume healthy until proven otherwise
                latencyMs: 0,
                lastCheck: 0,
                consecutiveFailures: 0,
                requestsInFlight: 0,
                requestsTotal: 0,
                errorsTotal: 0,
                latencyWindow: [],
            });
        }
    }
    /** Start periodic health checks */
    start() {
        this.healthTimer = setInterval(() => this.checkAll(), HEALTH_CHECK_INTERVAL_MS);
        // initial check
        this.checkAll();
    }
    stop() {
        if (this.healthTimer)
            clearInterval(this.healthTimer);
    }
    /** Get all upstream states */
    getStates() {
        return Array.from(this.states.values());
    }
    /** Select the best upstream for a given request using weighted-least-connections */
    select(req) {
        const isWrite = types_1.WRITE_METHODS.has(req.method);
        const candidates = Array.from(this.states.values()).filter(s => {
            if (!s.healthy)
                return false;
            if (isWrite && s.config.readOnly)
                return false;
            if (s.requestsInFlight >= s.config.maxConcurrent)
                return false;
            return true;
        });
        if (candidates.length === 0)
            return null;
        // Weighted least-connections: score = inFlight / weight (lower = better)
        candidates.sort((a, b) => {
            const scoreA = a.requestsInFlight / a.config.weight;
            const scoreB = b.requestsInFlight / b.config.weight;
            if (scoreA !== scoreB)
                return scoreA - scoreB;
            // tie-break on latency
            return a.latencyMs - b.latencyMs;
        });
        return candidates[0];
    }
    /** Forward a JSON-RPC request to a specific upstream */
    async forward(state, req) {
        state.requestsInFlight++;
        state.requestsTotal++;
        const start = Date.now();
        try {
            const res = await fetch(state.config.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(req),
                signal: AbortSignal.timeout(30_000),
            });
            const body = await res.json();
            const elapsed = Date.now() - start;
            this.recordLatency(state, elapsed);
            state.consecutiveFailures = 0;
            if (body.error) {
                // RPC-level error (not transport) — upstream is still healthy
                return body;
            }
            return body;
        }
        catch (err) {
            state.errorsTotal++;
            state.consecutiveFailures++;
            const elapsed = Date.now() - start;
            this.recordLatency(state, elapsed);
            if (state.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                state.healthy = false;
                logger.warn({ upstream: state.config.name }, 'Marking upstream unhealthy after %d failures', state.consecutiveFailures);
            }
            throw err;
        }
        finally {
            state.requestsInFlight--;
        }
    }
    recordLatency(state, ms) {
        state.latencyMs = ms;
        state.latencyWindow.push(ms);
        if (state.latencyWindow.length > LATENCY_WINDOW_SIZE) {
            state.latencyWindow.shift();
        }
    }
    /** Health-check all upstreams via eth_chainId */
    async checkAll() {
        const now = Date.now();
        const promises = Array.from(this.states.values()).map(async (state) => {
            // For unhealthy nodes, only probe at recovery interval
            if (!state.healthy && now - state.lastCheck < RECOVERY_PROBE_INTERVAL_MS)
                return;
            state.lastCheck = now;
            const start = Date.now();
            try {
                const res = await fetch(state.config.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 0 }),
                    signal: AbortSignal.timeout(5_000),
                });
                const body = await res.json();
                const elapsed = Date.now() - start;
                if (body.result) {
                    if (!state.healthy) {
                        logger.info({ upstream: state.config.name }, 'Upstream recovered (latency: %dms)', elapsed);
                    }
                    state.healthy = true;
                    state.consecutiveFailures = 0;
                    this.recordLatency(state, elapsed);
                }
                else {
                    throw new Error('No result in health check');
                }
            }
            catch {
                state.consecutiveFailures++;
                if (state.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                    state.healthy = false;
                }
            }
        });
        await Promise.allSettled(promises);
    }
}
exports.UpstreamManager = UpstreamManager;
//# sourceMappingURL=upstream.js.map