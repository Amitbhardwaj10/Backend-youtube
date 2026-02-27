import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import {
    addComment,
    getVideoComments,
} from "../controllers/comment.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/:videoId").get(getVideoComments).post(addComment);

export default router;
