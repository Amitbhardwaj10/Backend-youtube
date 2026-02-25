import "dotenv/config";
import connectDb from "./db/index.js";
import app from "./app.js";

const port = process.env.PORT || 8000;

connectDb()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is running at port: ${port}`);
        });
    })
    .catch((err) => {
        console.log("MONO db connection failed!!", err);
    });
