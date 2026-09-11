import "dotenv/config";
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

import "./workers/order.worker.js";

console.log("Order Worker started...");
