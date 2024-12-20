import express, { Request, Response, Application } from "express";
import { exec } from "child_process";
import { collectServicesInformation, testMock, sleep } from "./utils";

const app: Application = express();
const service2_url = process.env.SERVICE2_URL || "http://localhost:5000";

let isProcessing = false;

app.get("/", async (_: Request, res: Response) => {
  // Ignore request if the previous request is in processing
  if (isProcessing) return;
  try {
    isProcessing = true;
    const information = await collectServicesInformation(service2_url);
    res.json(information);
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
      .send("Stopping containers. See from the terminal more information.");
    // Stopping only this exercise containers by filtering these with name
    exec(
      "docker stop $(docker ps --filter 'name=compse140-exercises' -q)",
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

app.get("/test", (_: Request, res: Response) => {
  res.send(testMock());
});

export default app;
