import request from "supertest";

describe("Rest API Tests", () => {
  const baseUrl = "http://localhost:8197";

  it("Should get the state of the system", async () => {
    const response = await request(baseUrl).get("/state");
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toBe("INIT");
  });

  it("Should change the state of the system", async () => {
    // Change state to RUNNING from INIT
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

    // Change state back to RUNNING
    response = await request(baseUrl)
      .put("/state")
      .send("RUNNING")
      .set("Content-Type", "text/plain");
    expect(response.status).toBe(200);
    expect(response.text).toBe("State set to RUNNING.");

    // Verify state is RUNNING
    response = await request(baseUrl).get("/state");
    expect(response.status).toBe(200);
    expect(response.text).toBe("RUNNING");

    // Change state to INIT
    response = await request(baseUrl)
      .put("/state")
      .send("INIT")
      .set("Content-Type", "text/plain");
    expect(response.status).toBe(200);
    expect(response.text).toBe("State set to INIT. New login required.");

    // Verify state is INIT
    response = await request(baseUrl).get("/state");
    expect(response.status).toBe(200);
    expect(response.text).toBe("INIT");

    // Attempt to change state to PAUSED from INIT (should fail)
    response = await request(baseUrl)
      .put("/state")
      .send("PAUSED")
      .set("Content-Type", "text/plain");
    expect(response.status).toBe(400); 
    expect(response.text).toBe("Invalid state transition.");

    // Attempt to change state to SHUTDOWN from INIT (should fail)
    response = await request(baseUrl)
      .put("/state")
      .send("SHUTDOWN")
      .set("Content-Type", "text/plain");
    expect(response.status).toBe(400);
    expect(response.text).toBe("Invalid state transition.");

    // Change state to RUNNING from INIT
    response = await request(baseUrl)
      .put("/state")
      .send("RUNNING")
      .set("Content-Type", "text/plain");
    expect(response.status).toBe(200);
    expect(response.text).toBe("State set to RUNNING.");

    // Change state to SHUTDOWN from RUNNING
    response = await request(baseUrl)
      .put("/state")
      .send("SHUTDOWN")
      .set("Content-Type", "text/plain");
    expect(response.status).toBe(200);
    expect(response.text).toBe("Stopping containers. See from the terminal more information.");
  });
});