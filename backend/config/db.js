import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDBAndStartServer = (app) => {
  console.log("🔍 Mongo URI:", process.env.MONGO_URI);
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      app.listen(process.env.PORT, () => {
        console.log(
          "✅ Connected to db and server listening at port",
          process.env.PORT
        );
      });

    })
    .catch((error) => {
      console.error("❌ Error connecting to the database:", error.message);
      app.get("/", (req, res) => {
        res
          .status(500)
          .send("Internal Server Error. Unable to connect to the database.");
      });
    });
};

export default connectDBAndStartServer;