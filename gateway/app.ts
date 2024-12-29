import express, { Request, Response, Application } from "express";

const app: Application = express();

app.use(express.text());

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

app.get("/", (req: Request, res: Response) => {
  forwardRequestToNginx(req, res, "/");
});

app.get("/request", (req: Request, res: Response) => {
  forwardRequestToNginx(req, res, "/api/request");
});

app.post("/stop", (req: Request, res: Response) => {
  forwardRequestToNginx(req, res, "/api/stop", "POST");
});

export default app;