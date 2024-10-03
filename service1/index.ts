import express, { Request, Response, Application } from "express";
import { exec } from "child_process";
import util from "util";
import os from "os";
import process from "process";

const app: Application = express();
const port = process.env.PORT || 3000;
const service2_url = process.env.SERVICE2_URL;

app.get("/", async (_: Request, res: Response) => {
  try {
    const information = await collectServicesInformation();
    res.json(information);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to fetch data from services.");
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

//
// Utility functions (in real-world scenarios, these would be in separate files)
//

/**
 * Collect information from both service1 and service2.
 *
 * @returns {Promise<Object>} An object containing information from both services.
 * @throws {Error} If fetching service2 information fails.
 */
async function collectServicesInformation() {
  const response = await fetch(service2_url + "/info");
  if (!response.ok) {
    throw new Error(
      `Failed to fetch service 2 information, status ${response.status}.`
    );
  }

  const service2Info = await response.json();
  const processes = await getRunningProcesses();
  const diskSpace = await getAvailableDiscSpace();
  const ipAddresses = getIpAddressInformation();

  const information = {
    service1: {
      ipAddresses,
      diskSpace,
      processes,
      serviceUptime: process.uptime(),
      osUptime: os.uptime(),
    },
    service2: service2Info,
  };

  return information;
}

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
function getIpAddressInformation() {
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
async function getAvailableDiscSpace(): Promise<Object> {
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
async function getRunningProcesses(): Promise<Object[]> {
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
