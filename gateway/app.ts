import express, { Request, Response, Application, NextFunction } from "express";
import path from "path";

const browserApp: Application = express();
const apiApp: Application = express();
const monitorApp: Application = express();

browserApp.use(express.text());
apiApp.use(express.text());

const nginx_url = process.env.NGINX_URL || "http://nginx:3000";

const startTime = new Date();
let requestCount = 0;

// Middleware to count the number of requests for browser and api apps
const countRequestsMiddleware = (
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  requestCount++;
  next();
};

browserApp.use(countRequestsMiddleware);
apiApp.use(countRequestsMiddleware);

type State = "INIT" | "PAUSED" | "RUNNING" | "SHUTDOWN";
let currentState: State = "INIT";
const stateLog: string[] = [];

// App 1 (browser app) routes
browserApp.get("/", async (req: Request, res: Response) => {
  await forwardRequestToNginx(req, res, "/");
});

browserApp.get("/request", (req: Request, res: Response) => {
  if (currentState !== "RUNNING") {
    res.status(503).send("Service is not in running state.");
    return;
  }
  forwardRequestToNginx(req, res, "/api/request");
});

browserApp.post("/stop", (req: Request, res: Response) => {
  if (currentState !== "RUNNING" && currentState !== "PAUSED") {
    res
      .status(503)
      .send(
        "Service can be stopped only when it is in running or paused state."
      );
    return;
  }
  forwardRequestToNginx(req, res, "/api/stop", "POST");
});

// App 2 (rest api) routes
apiApp.get("/state", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/plain");
  res.send(getState());
});

apiApp.put("/state", async (req: Request, res: Response) => {
  const newState = req.body as State;
  res.setHeader("Content-Type", "text/plain");

  if (!(await checkAuthorization(req))) {
    res
      .status(401)
      .send(
        `Unauthorized user cannot change the state. State remains ${getState()}.`
      );
    return;
  }
  if (!isValidState(newState)) {
    res
      .status(400)
      .send("Invalid state or missing 'Content-Type: text/plain' header.");
    return;
  }
  if (!isValidStateTransition(getState(), newState)) {
    res.status(400).send("Invalid state transition.");
    return;
  }
  setState(newState);
  switch (newState) {
    case "INIT":
      res.status(200).send("State set to INIT. New login required.");
      break;
    case "SHUTDOWN":
      forwardRequestToNginx(req, res, "/api/stop", "POST");
      break;
    default:
      res.send(`State set to ${newState}.`);
  }
});

apiApp.get("/run-log", (_: Request, res: Response) => {
  res.setHeader("Content-Type", "text/plain");
  res.send(stateLog.join("\n"));
});

apiApp.get("/request", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/plain");
  if (currentState !== "RUNNING") {
    res
      .status(503)
      .send(
        "Service is not in running state. Change the state to RUNNING and try again."
      );
    return;
  }
  req.headers["content-type"] = "text/plain";
  forwardRequestToNginx(req, res, "/api/request/no-auth");
});

// App 3 (monitoring app) routes
monitorApp.get("/", (_: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "monitor.html"));
});

monitorApp.get("/info", (_: Request, res: Response) => {
  res.json({
    startTime: startTime.toLocaleString("en-GB", {
      timeZone: "Europe/Helsinki",
    }),
    requestCount,
  });
});

//
// Utility functions
//

/**
 * Gets the current state of the application.
 *
 * @returns {State} The current state of the application.
 */
const getState = (): State => currentState;

/**
 * Sets a new state for the application.
 *
 * If the new state is different from the current state, the state transition
 * is logged and the current state is updated.
 *
 * @param {State} newState - The new state to set.
 */
const setState = (newState: State): void => {
  if (newState !== currentState) {
    stateLog.push(
      `${new Date().toISOString()}: ${currentState} -> ${newState}`
    );
    currentState = newState;
  }
};

/**
 * Checks if the provided state is a valid state.
 *
 * @param {State} state - The state to check.
 * @returns {boolean} True if the state is valid, false otherwise.
 */
const isValidState = (state: State): boolean => {
  return ["INIT", "PAUSED", "RUNNING", "SHUTDOWN"].includes(state);
};

/**
 * Checks if the transition from one state to another is valid.
 *
 * @param {State} from - The current state.
 * @param {State} to - The new state to transition to.
 * @returns {boolean} True if the state transition is valid, false otherwise.
 */
const isValidStateTransition = (from: State, to: State): boolean => {
  if (from === "INIT" && ["PAUSED", "SHUTDOWN"].includes(to)) {
    return false;
  }
  return true;
};

/**
 * Checks if the user is authorized by the nginx service.
 *
 * This function sends a request to the nginx service to verify the user's
 * authorization status based on the Authorization header in the request.
 *
 * @param {Request} req - The Express request object containing the Authorization header.
 * @returns {Promise<boolean>} A promise that resolves to true if the user is authorized, false otherwise.
 */
const checkAuthorization = async (req: Request): Promise<boolean> => {
  try {
    const authHeader = req.headers.authorization;
    const response = await fetch(`${nginx_url}`, {
      headers: {
        Authorization: authHeader || "",
      },
    });
    return response.status === 200;
  } catch (error) {
    console.error(error);
    return false;
  }
};

/**
 * Forwards a request to the nginx service and sends the response back to the client.
 *
 * This function sends a request to the nginx service with the specified path and method,
 * and forwards the response back to the client. Handles setting the application state
 * to RUNNING if the user login is successful.
 *
 * @param {Request} req - The Express request object containing the client's request.
 * @param {Response} res - The Express response object to send the response back to the client.
 * @param {string} path - The path to append to the nginx URL for the request.
 * @param {string} [method=GET] - The HTTP method to use for the request (default is GET).
 */
const forwardRequestToNginx = async (
  req: Request,
  res: Response,
  path: string,
  method: string = "GET"
) => {
  try {
    const response = await fetch(`${nginx_url}${path}`, {
      method: method,
      headers: new Headers(req.headers as Record<string, string>),
    });
    response.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });
    const body = await response.text();
    res.status(response.status).send(body);
    // In successful login, set the state to RUNNING
    if (path === "/" && getState() === "INIT" && response.status === 200) {
      console.log("Successfully logged in. Setting state to RUNNING.");
      setState("RUNNING");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to send request to Nginx.");
  }
};

export { browserApp, apiApp, monitorApp };
