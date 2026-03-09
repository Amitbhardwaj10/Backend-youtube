import Router from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controller.js";
import { checkPlaylistOwner } from "../middlewares/playlist.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createPlaylist);

router
    .route("/:playlistId/videos/:videoId")
    .post(checkPlaylistOwner, addVideoToPlaylist)
    .delete(checkPlaylistOwner, removeVideoFromPlaylist);

router.route("/user/:userId").get(getUserPlaylists);

router
    .route("/:playlistId")
    .get(getPlaylistById)
    .patch(checkPlaylistOwner, updatePlaylist)
    .delete(checkPlaylistOwner, deletePlaylist);

export default router;
