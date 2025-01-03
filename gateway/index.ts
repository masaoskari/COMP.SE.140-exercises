import {browserApp, apiApp, monitorApp} from "./app";

const browserAppPort = process.env.BROWSER_PORT || 8198;
const apiAppPort = process.env.API_PORT || 8197;
const monitorAppPort = process.env.MONITOR_PORT || 8098;

browserApp.listen(browserAppPort, () => {
  console.log(`Server is running and listening on port ${browserAppPort}`);
});

apiApp.listen(apiAppPort, () => {
  console.log(`Server is running and listening on port ${apiAppPort}`);
});

monitorApp.listen(monitorAppPort, () => {
  console.log(`Server is running and listening on port ${monitorAppPort}`);
});





