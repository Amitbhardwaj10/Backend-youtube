import { Playlist } from "../models/playlist.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const checkPlaylistOwner = asyncHandler(async (req, res, next) => {
    const { playlistId } = req.params;

    if (!playlistId) {
        return res.status(400).json({ message: "Playlist ID is required" });
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        return res
            .status(403)
            .json({ message: "You are not the owner of this playlist" });
    }

    req.playlist = playlist;
    next();
});

export { checkPlaylistOwner };
