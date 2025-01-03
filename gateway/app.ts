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

const countRequestsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  requestCount++;
  next();
};

browserApp.use(countRequestsMiddleware);
apiApp.use(countRequestsMiddleware);

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

type State = "INIT" | "PAUSED" | "RUNNING" | "SHUTDOWN";

let currentState: State = "INIT";
const stateLog: string[] = [];

const getState = (): State => currentState;

const setState = (newState: State): void => {
  if (newState !== currentState) {
    stateLog.push(
      `${new Date().toISOString()}: ${currentState} -> ${newState}`
    );
    currentState = newState;
  }
};

const isValidState = (state: State): boolean => {
  return ["INIT", "PAUSED", "RUNNING", "SHUTDOWN"].includes(state);
};

const isValidStateTransition = (from: State, to: State): boolean => {
  if (from === "INIT" && ["PAUSED", "SHUTDOWN"].includes(to)) {
    return false;
  }
  return true;
};

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
    res.status(503).send("Service can be stopped only when it is in running or paused state.");
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
    res.status(400).send("Invalid state.");
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
    res.status(503).send("Service is not in running state.");
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
    startTime: startTime.toISOString(),
    requestCount,
  });
});

export { browserApp, apiApp, monitorApp };
