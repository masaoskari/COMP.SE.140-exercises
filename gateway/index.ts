import {browserApp, apiApp} from "./app";

const browserAppPort = process.env.BROWSER_PORT || 8198;
const apiAppPort = process.env.API_PORT || 8197;

browserApp.listen(browserAppPort, () => {
  console.log(`Server is running and listening on port ${browserAppPort}`);
});

apiApp.listen(apiAppPort, () => {
  console.log(`Server is running and listening on port ${apiAppPort}`);
});



