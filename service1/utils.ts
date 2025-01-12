import { exec } from "child_process";
import util from "util";
import os from "os";
import process from "process";

/**
 * Ensures the application closes without errors on SIGTERM.
 *
 * Listens for the SIGTERM signal and logs a shutdown message before exiting.
 */
process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, shutting down application.");
  process.exit();
});

/**
 * Promisify exec function to use async/await.
 *
 * @type {Function}
 */
const execPromise = util.promisify(exec);

/**
 * Get IP address information.
 *
 * @returns {Object} An object containing network interface names as keys and arrays of IP addresses as values.
 */
export function getIpAddressInformation() {
  // Implementation is based on https://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js
  const nets = os.networkInterfaces();
  const addresses = Object.create({});

  for (const name of Object.keys(nets)) {
    if (!nets) return;
    const netInfo = nets[name];
    if (!netInfo) continue;
    for (const net of netInfo) {
      const familyV4Value = typeof net.family === "string" ? "IPv4" : 4;
      const familyV6Value = typeof net.family === "string" ? "IPv6" : 6;
      // Skip non internal IPs
      if (
        (net.family === familyV4Value || net.family === familyV6Value) &&
        !net.internal
      ) {
        if (!addresses[name]) {
          addresses[name] = [];
        }
        addresses[name].push(net.address);
      }
    }
  }

  return addresses;
}

/**
 * Get available disk space information.
 *
 * @returns {Promise<Object>} Disk usage information
 */
export async function getAvailableDiscSpace(): Promise<object> {
  const { stdout } = await execPromise("df -h /");

  const lines = stdout.trim().split("\n");

  // Process data to json object
  const headers = lines[0].trim().split(/\s+/);
  const data = lines[1].trim().split(/\s+/);

  const diskUsage = headers.reduce(
    (acc: { [key: string]: string }, key, index) => {
      acc[key] = data[index];
      return acc;
    },
    {}
  );

  return diskUsage;
}

/**
 * Get a list of running processes.
 *
 * @returns {Promise<Object[]>} List of running processes
 */
export async function getRunningProcesses(): Promise<object[]> {
  const { stdout } = await execPromise("ps -ax");
  const lines = stdout.trim().split("\n");

  // Process data to json object
  const header = lines[0].trim().split(/\s+/);
  const processes = lines.slice(1).map((line) => {
    const [pid, tty, stat, time, ...cmdParts] = line.trim().split(/\s+/);
    const cmd = cmdParts.join(" ");
    return {
      [header[4]]: cmd,
      [header[0]]: pid,
      [header[1]]: tty,
      [header[2]]: stat,
      [header[3]]: time,
    };
  });

  return processes;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
