import { UpstreamManager } from './upstream';
import 'dotenv/config';
declare const manager: UpstreamManager;
declare const app: import("express-serve-static-core").Express;
export { app, manager };
