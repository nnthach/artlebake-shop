import "dotenv/config";
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

console.log("[Worker] DNS configured: IPv4 first");

import "./workers/order.worker.js";

console.log("Order Worker started...");
