import mongoose from "mongoose";
import {DB_NAME} from "../constants.js" 

const connectDb = async() => {
    // try{
    //     console.log(process.env.MONGODB_URI + "/" + DB_NAME);
        
    //     const connectionInstance = await mongoose.connect("mongodb+srv://amit:amit007security@cluster0.4r3a8v6.mongodb.net/videotube")
    //     console.log(`\n MongoDB connected!! DB HOST: ${connectionInstance.connection.host}`);
        
    // } catch (err) {
    //     console.error("DB connection error: ", err);
    //     process.exit(1)
    // }
};

export default connectDb;

