import express, { Request, Response, Application } from "express";
import { exec } from "child_process";
import {
  getRunningProcesses,
  getAvailableDiscSpace,
  getIpAddressInformation,
  sleep,
} from "./utils";
import os from "os";

const app: Application = express();
const service2_url = process.env.SERVICE2_URL || "http://localhost:5000";

let isProcessing = false;

app.get("/", async (req: Request, res: Response) => {
  // Ignore request if the previous request is in processing
  if (isProcessing) return;
  try {
    isProcessing = true;
    const information = await collectServicesInformation(service2_url);
    if (req.headers["content-type"] === "text/plain") {
      res.setHeader("Content-Type", "text/plain");
      res.send(JSON.stringify(information, null, 2));
    } else {
      res.json(information);
    }
    await sleep(2000);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to fetch data from services.");
  } finally {
    isProcessing = false;
  }
});

app.post("/stop", async (_: Request, res: Response) => {
  if (isProcessing) return;
  try {
    res
      .status(200)
      .setHeader("Content-Type", "text/plain")
      .send("Stopping containers. See from the terminal more information.");
    // Stopping only this exercise containers by filtering these with name
    exec(
      "docker stop $(docker ps --filter 'name=compse140-project' -q)",
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error when stopping containers: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`Stderr: ${stderr}`);
          return;
        }
        console.log(`Stdout: ${stdout}`);
      }
    );
  } catch (error) {
    console.log(error);
  }
});
export default app;

/**
 * Collect information from both service1 and service2.
 *
 * @returns {Promise<Object>} An object containing information from both services.
 * @throws {Error} If fetching service2 information fails.
 */
async function collectServicesInformation(service2_url: string) {
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
