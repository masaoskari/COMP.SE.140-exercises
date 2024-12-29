import request from "supertest";

describe("Rest API Tests", () => {
  const baseUrl = "http://localhost:8197";
  it ("Should get the state of the system", async () => {
    const response = await request(baseUrl).get("/state");
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toBe("INIT");
  });

  it("Should change the state of the system", async () => {
    // Change state to RUNNING
    let response = await request(baseUrl)
      .put("/state")
      .send("RUNNING")
      .set("Content-Type", "text/plain");
    expect(response.status).toBe(200);
    expect(response.text).toBe("State set to RUNNING.");

    // Verify state is RUNNING
    response = await request(baseUrl).get("/state");
    expect(response.status).toBe(200);
    expect(response.text).toBe("RUNNING");

    // Change state to PAUSED
    response = await request(baseUrl)
      .put("/state")
      .send("PAUSED")
      .set("Content-Type", "text/plain");
    expect(response.status).toBe(200);
    expect(response.text).toBe("State set to PAUSED.");

    // Verify state is PAUSED
    response = await request(baseUrl).get("/state");
    expect(response.status).toBe(200);
    expect(response.text).toBe("PAUSED");

    // Change state to INIT
    // Change state to SHUTDOWN
    response = await request(baseUrl)
      .put("/state")
      .send("SHUTDOWN")
      .set("Content-Type", "text/plain");
    expect(response.status).toBe(200);
    expect(response.text).toBe("Stopping containers. See from the terminal more information.");
  });
});

