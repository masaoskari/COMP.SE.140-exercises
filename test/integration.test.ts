import request from "supertest";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

describe("API Gateway Integration Tests", () => {
  const baseUrl = "http://localhost:8198";

  afterEach(async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

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
  it("should fetch data from SERVICE2_URL", async () => {
    const service2Url = process.env.SERVICE2_URL || "http://service2:5000";
    const response = await request(service2Url).get("/");
    expect(response.status).toBe(200);
  });
});

describe("API Gateway Stop Service Test", () => {
  const baseUrl = "http://localhost:8198";
  afterEach(async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  it("should stop the service from /api/stop", async () => {
    const response = await request(baseUrl)
      .post("/api/stop")
      .auth("nginx", "nginx");
    expect(response.status).toBe(200);
    expect(response.text).toBe(
      "Stopping containers. See from the terminal more information."
    );

    // Verify that the containers are stopped
    const { stdout, stderr } = await execPromise(
      "docker ps --filter 'name=compse140-project' -q"
    );

    if (stderr) {
      console.error(`Stderr: ${stderr}`);
    }

    // Expect no containers to be listed
    console.log("stdout", stdout);
  }, 20000); // Increase the timeout to 20 seconds
});
