import request from "supertest";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);
const monitorUrl = "http://localhost:8098";
const restApiUrl = "http://localhost:8197";
const browserAppUrl = "http://localhost:8198";

describe("Monitoring service tests", () => {
  it("Should serve the monitoring HTML page", async () => {
    const response = await request(monitorUrl).get("/");
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/text\/html/);
  });

  it("should return monitoring data", async () => {
    const response = await request(monitorUrl).get("/info");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("startTime");
    expect(response.body).toHaveProperty("requestCount");
    expect(response.body.requestCount).toBe(0);

    // Send one request to rest api and browser app and
    // check if the request count is updated
    await request(restApiUrl).get("/state");
    await request(browserAppUrl).get("/");

    const updatedResponse = await request(monitorUrl).get("/info");
    expect(updatedResponse.status).toBe(200);
    expect(updatedResponse.body).toHaveProperty("requestCount");
    expect(updatedResponse.body.requestCount).toBe(2);
  });
});

describe("Browser Integration Tests", () => {

  it("should return 401 for unauthorized access", async () => {
    const response = await request(browserAppUrl).get("/");
    expect(response.status).toBe(401);
  });

  it("Should not be able to fetch data from api if app is not running state", async () => {
    const response = await request(browserAppUrl).get("/request").auth("nginx", "nginx");
    expect(response.status).toBe(503);
    expect(response.text).toBe("Service is not in running state.");
  });

  it("Should not be able to stop the service if app is not running state", async () => {
    const response = await request(browserAppUrl).post("/stop").auth("nginx", "nginx");
    expect(response.status).toBe(503);
    expect(response.text).toBe("Service can be stopped only when it is in running or paused state.");
  });

  it("Should set app state to RUNNING when successfully login", async () => {
    const response = await request(browserAppUrl).get("/").auth("nginx", "nginx");
    expect(response.status).toBe(200);

    const stateResponse = await request(restApiUrl).get("/state");
    expect(stateResponse.status).toBe(200);
    expect(stateResponse.text).toBe("RUNNING");
  });

  it("should return service information from /api", async () => {
    const response = await request(browserAppUrl).get("/request").auth("nginx", "nginx");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("service1");
    expect(response.body).toHaveProperty("service2");
    expect(response.body.service1).toHaveProperty("diskSpace");
    expect(response.body.service1).toHaveProperty("ipAddresses");
    expect(response.body.service1).toHaveProperty("osUptime");
    expect(response.body.service1).toHaveProperty("processes");
    expect(response.body.service1).toHaveProperty("serviceUptime");
    expect(response.body.service2).toHaveProperty("diskSpace");
    expect(response.body.service2).toHaveProperty("ipAddresses");
    expect(response.body.service2).toHaveProperty("osUptime");
    expect(response.body.service2).toHaveProperty("processes");
    expect(response.body.service2).toHaveProperty("serviceUptime");
  });

  it("should not fetch data from SERVICE2_URL", async () => {
    const service2Url = process.env.SERVICE2_URL || "http://service2:5000";

    try {
      await request(service2Url).get("/");
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        expect(error).toBeDefined();
        expect(error.code).toBe("ENOTFOUND");
      } else {
        throw new Error("Unexpected error type");
      }
    }
  });

  it("should stop the service from /api/stop", async () => {
    const response = await request(browserAppUrl)
      .post("/stop")
      .auth("nginx", "nginx");
    expect(response.status).toBe(200);
    expect(response.text).toBe(
      "Stopping containers. See from the terminal more information."
    );

    // Poll the status of the containers until they are stopped
    const checkContainersStopped = async () => {
      const { stdout, stderr } = await execPromise(
        'docker ps --filter "name=compse140-project" -q'
      );
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
      }
      return stdout.trim() === "";
    };

    const maxRetries = 10;
    const delay = 1000;
    let retries = 0;
    while (retries < maxRetries) {
      if (await checkContainersStopped()) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      retries++;
    }
    // Verify that the containers are stopped
    expect(await checkContainersStopped()).toBe(true);
  });
});
