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



export { browserApp, apiApp };