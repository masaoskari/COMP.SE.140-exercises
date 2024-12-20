import request from "supertest";

describe("API Gateway Integration Tests", () => {
  const baseUrl = "http://nginx:8198";

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

  it("should stop the service from /api/stop", async () => {
    const response = await request(baseUrl)
      .post("/api/stop")
      .auth("nginx", "nginx");
    expect(response.status).toBe(200);
    expect(response.text).toBe(
      "Stopping containers. See from the terminal more information."
    );
  }, 10000);
});
