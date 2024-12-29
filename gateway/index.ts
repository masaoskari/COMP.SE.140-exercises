import app from "./app";

const port1 = process.env.PORT || 8198;

app.listen(port1, () => {
  console.log(`Server is running and listening on port ${port1}`);
});



