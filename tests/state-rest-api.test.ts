import request from "supertest";

describe("Rest API Tests", () => {
  const baseUrl = "http://localhost:8197";

  beforeEach(() => {
    // Reset the state of the system before each test
    return request(baseUrl)
      .put("/state")
      .auth("nginx", "nginx")
      .send("INIT")
      .set("Content-Type", "text/plain");
  });

  it("Should get the state of the system", async () => {
    const response = await request(baseUrl).get("/state");
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toBe("INIT");
  });

  it("Should get the run log", async () => {
    // Do some state transitions
    await request(baseUrl)
      .put("/state")
      .auth("nginx", "nginx")
      .send("RUNNING")
      .set("Content-Type", "text/plain");

    await request(baseUrl)
      .put("/state")
      .auth("nginx", "nginx")
      .send("PAUSED")
      .set("Content-Type", "text/plain");

    await request(baseUrl)
      .put("/state")
      .auth("nginx", "nginx")
      .send("RUNNING")
      .set("Content-Type", "text/plain");

    // Get the run log and check the state transitions
    const response = await request(baseUrl).get("/run-log");
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toMatch(/INIT -> RUNNING/);
    expect(response.text).toMatch(/RUNNING -> PAUSED/);
    expect(response.text).toMatch(/PAUSED -> RUNNING/);
  });

  it("Should not get response from request endpoint if state is not RUNNING", async () => {
    // At the beginning, the state is INIT
    let response = await request(baseUrl).get("/request");
    expect(response.status).toBe(503);
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toBe("Service is not in running state.");

    // Change the state to PAUSED
    await request(baseUrl)
      .put("/state")
      .auth("nginx", "nginx")
      .send("RUNNING")
      .set("Content-Type", "text/plain");

    await request(baseUrl)
      .put("/state")
      .auth("nginx", "nginx")
      .send("PAUSED")
      .set("Content-Type", "text/plain");

    response = await request(baseUrl).get("/request");
    
    expect(response.status).toBe(503);
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toBe("Service is not in running state.");
  });

  it("Should respond with the service information from /request endpoint", async () => {
    // Change the state to RUNNING
    await request(baseUrl)
      .put("/state")
      .auth("nginx", "nginx")
      .send("RUNNING")
      .set("Content-Type", "text/plain");

    const response = await request(baseUrl)
      .get("/request")
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/plain/);

    const responseBody = JSON.parse(response.text);

    expect(responseBody).toHaveProperty("service1");
    expect(responseBody).toHaveProperty("service2");
    expect(responseBody.service1).toHaveProperty("diskSpace");
    expect(responseBody.service1).toHaveProperty("ipAddresses");
    expect(responseBody.service1).toHaveProperty("osUptime");
    expect(responseBody.service1).toHaveProperty("processes");
    expect(responseBody.service1).toHaveProperty("serviceUptime");
    expect(responseBody.service2).toHaveProperty("diskSpace");
    expect(responseBody.service2).toHaveProperty("ipAddresses");
    expect(responseBody.service2).toHaveProperty("osUptime");
    expect(responseBody.service2).toHaveProperty("processes");
    expect(responseBody.service2).toHaveProperty("serviceUptime");
  });

  it("Should change the state of the system", async () => {
    // Check that unauthorized users cannot change the state
    let response = await request(baseUrl)
      .put("/state")
      .send("RUNNING")
      .set("Content-Type", "text/plain");
    
    expect(response.status).toBe(401);
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toBe("Unauthorized user cannot change the state. State remains INIT.");

    // Verify state is still INIT
    response = await request(baseUrl).get("/state");
    expect(response.status).toBe(200);
    expect(response.text).toBe("INIT");

    // Change state to RUNNING from INIT
    response = await request(baseUrl)
      .put("/state")
      .auth("nginx", "nginx")
      .send("RUNNING")
      .set("Content-Type", "text/plain");
      
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toBe("State set to RUNNING.");

    // Verify state is RUNNING
    response = await request(baseUrl).get("/state");
    expect(response.status).toBe(200);
    expect(response.text).toBe("RUNNING");

    // Change state to PAUSED
    response = await request(baseUrl)
      .put("/state")
      .auth("nginx", "nginx")
      .send("PAUSED")
      .set("Content-Type", "text/plain");
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toBe("State set to PAUSED.");

    // Verify state is PAUSED
    response = await request(baseUrl).get("/state");
    expect(response.status).toBe(200);
    expect(response.text).toBe("PAUSED");

    // Change state back to RUNNING
    response = await request(baseUrl)
      .put("/state")
      .auth("nginx", "nginx")
      .send("RUNNING")
      .set("Content-Type", "text/plain");
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toBe("State set to RUNNING.");

    // Verify state is RUNNING
    response = await request(baseUrl).get("/state");
    expect(response.status).toBe(200);
    expect(response.text).toBe("RUNNING");

    // Change state to INIT
    response = await request(baseUrl)
      .put("/state")
      .auth("nginx", "nginx")
      .send("INIT")
      .set("Content-Type", "text/plain");
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toBe("State set to INIT. New login required.");

    // Verify state is INIT
    response = await request(baseUrl).get("/state");
    expect(response.status).toBe(200);
    expect(response.text).toBe("INIT");

    // Attempt to change state to PAUSED from INIT (should fail)
    response = await request(baseUrl)
      .put("/state")
      .auth("nginx", "nginx")
      .send("PAUSED")
      .set("Content-Type", "text/plain");
    expect(response.status).toBe(400); 
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toBe("Invalid state transition.");

    // Attempt to change state to SHUTDOWN from INIT (should fail)
    response = await request(baseUrl)
      .put("/state")
      .auth("nginx", "nginx")
      .send("SHUTDOWN")
      .set("Content-Type", "text/plain");
    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toBe("Invalid state transition.");

    // Change state to RUNNING from INIT
    response = await request(baseUrl)
      .put("/state")
      .auth("nginx", "nginx")
      .send("RUNNING")
      .set("Content-Type", "text/plain");
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toBe("State set to RUNNING.");

    // Change state to SHUTDOWN from RUNNING
    response = await request(baseUrl)
      .put("/state")
      .auth("nginx", "nginx")
      .send("SHUTDOWN")
      .set("Content-Type", "text/plain");
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toBe("Stopping containers. See from the terminal more information.");
  });
});