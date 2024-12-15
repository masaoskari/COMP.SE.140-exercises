import request from "supertest";
import app from "../app";
import { collectServicesInformation, sleep } from "../utils";

jest.mock("../utils", () => {
  return {
    collectServicesInformation: jest.fn(),
    sleep: jest.fn(),
  };
});

describe("GET /", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return service information", async () => {
    (collectServicesInformation as jest.Mock).mockResolvedValue({
      data: "test",
    });
    (sleep as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: "test" });
    expect(collectServicesInformation).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledWith(2000);
  });

  it("should return 500 if there is an error", async () => {
    (collectServicesInformation as jest.Mock).mockRejectedValue(
      new Error("Test error")
    );
    const response = await request(app).get("/");
    expect(response.status).toBe(500);
    expect(response.text).toBe("Failed to fetch data from services.");
    expect(collectServicesInformation).toHaveBeenCalledTimes(1);
  });
});
