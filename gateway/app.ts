import express, { Request, Response, Application } from "express";

const browserApp: Application = express();
const apiApp: Application = express();

browserApp.use(express.text());
apiApp.use(express.text());

const nginx_url = process.env.NGINX_URL || "http://nginx:3000";

const forwardRequestToNginx = async (req: Request, res: Response, path: string, method: string = "GET") => {
  try {
    const authHeader = req.headers.authorization;

    const response = await fetch(`${nginx_url}${path}`, {
      method: method,
      headers: {
        "Authorization": authHeader || "",
      },
    });
    response.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });
    const body = await response.text();
    res.status(response.status).send(body);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to send request to Nginx.");
  }
};

type State = "INIT" | "PAUSED" | "RUNNING" | "SHUTDOWN";

let currentState: State = "INIT";

const getState = (): State => currentState;

const setState = (newState: State): void => {
    if (newState !== currentState) {
      currentState = newState;
    }
};

const isValidState = (state: State): boolean => {
    return ["INIT", "PAUSED", "RUNNING", "SHUTDOWN"].includes(state);
};
  
const isValidStateTransition = (from: State, to: State): boolean => {
    if (from  === "INIT" && ["PAUSED", "SHUTDOWN"].includes(to)) {
        return false;
    }
    return true;
};

const checkAuthorization = async (req: Request, res: Response): Promise<boolean> => {
    try {
        const authHeader = req.headers.authorization;
        const response = await fetch(`${nginx_url}`, {
            headers: {
                "Authorization": authHeader || "",
            },
        });
        return response.status === 200;
    } catch (error) {
        console.error(error);
        return false;
    }
};

// App 1 (browser app) routes
browserApp.get("/", (req: Request, res: Response) => {
  forwardRequestToNginx(req, res, "/");
});

browserApp.get("/request", (req: Request, res: Response) => {
  forwardRequestToNginx(req, res, "/api/request");
});

browserApp.post("/stop", (req: Request, res: Response) => {
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

    if (!await checkAuthorization(req, res)) {
        res.status(401).send(`Unauthorized user cannot change the state. State remains ${getState()}.`);
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
            res.status(200).send("Stopping containers. See from the terminal more information.");
            await forwardRequestToNginx(req, res, "/api/stop", "POST");
            break;
        default:
            res.send(`State set to ${newState}.`);
    }
});


export { browserApp, apiApp };