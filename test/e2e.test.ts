import request from "supertest";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

describe("API Gateway Integration Tests", () => {
  const baseUrl = "http://localhost:8198";

  //afterEach(async () => {
  //  await new Promise((resolve) => setTimeout(resolve, 2000));
  //});

  it("should return 401 for unauthorized access", async () => {
    const response = await request(baseUrl).get("/");
    expect(response.status).toBe(401);
  });

  it("should return service information from /api", async () => {
    const response = await request(baseUrl).get("/api").auth("nginx", "nginx");
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
      const response = await request(service2Url).get("/");
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        expect(error).toBeDefined();
        expect((error as any).code).toBe("ENOTFOUND");
      } else {
        throw new Error("Unexpected error type");
      }
    }
  });
  it("should stop the service from /api/stop", async () => {
    const response = await request(baseUrl)
      .post("/api/stop")
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
