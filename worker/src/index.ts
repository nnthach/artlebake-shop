import "dotenv/config";
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

await import("./workers/order.worker.js");

console.log("Order Worker started...");
