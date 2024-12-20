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
    expect(response.body).toHaveProperty("data");
  });

  it("should stop the service from /api/stop", async () => {
    const response = await request(baseUrl)
      .post("/api/stop")
      .auth("nginx", "nginx");
    expect(response.status).toBe(200);
    expect(response.text).toBe(
      "Stopping containers. See from the terminal more information."
    );
  });
});
