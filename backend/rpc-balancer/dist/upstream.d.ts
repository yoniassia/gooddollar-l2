import { UpstreamConfig, UpstreamState, JsonRpcRequest, JsonRpcResponse } from './types';
export declare class UpstreamManager {
    private states;
    private healthTimer?;
    constructor(configs: UpstreamConfig[]);
    /** Start periodic health checks */
    start(): void;
    stop(): void;
    /** Get all upstream states */
    getStates(): UpstreamState[];
    /** Select the best upstream for a given request using weighted-least-connections */
    select(req: JsonRpcRequest): UpstreamState | null;
    /** Forward a JSON-RPC request to a specific upstream */
    forward(state: UpstreamState, req: JsonRpcRequest): Promise<JsonRpcResponse>;
    private recordLatency;
    /** Health-check all upstreams via eth_chainId */
    private checkAll;
}
