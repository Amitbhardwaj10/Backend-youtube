import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    getAllVideos,
    publishAVideo,
} from "../controllers/video.controller.js";

const router = Router();

router.use(verifyJWT);

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },

            {
                name: "thumbnail",
                maxCount: 1,
            },
        ]),
        publishAVideo
    );

export default router;
