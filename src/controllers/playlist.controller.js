import { Playlist } from "../models/playlist.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description, videos } = req.body;

    if (!name) {
        return res.status(400).json({ message: "Name is required" });
    }

    if (videos && videos.length < 1) {
        return res
            .status(400)
            .json({ message: "At least one video is required" });
    }

    const playlist = await Playlist.create({
        name,
        description,
        videos,
        owner: req.user._id,
    });

    if (!playlist) {
        return res.status(500).json({ message: "Failed to create playlist" });
    }

    return res
        .status(201)
        .json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const playlist = req.playlist;

    if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
    }

    if (playlist.videos.includes(videoId)) {
        return res
            .status(400)
            .json({ message: "Video already exists in playlist!" });
    }

    playlist.videos.push(videoId);

    await playlist.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Video added to playlist successfully"
            )
        );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const playlist = req.playlist;
    const { videoId } = req.params;

    playlist.videos = playlist.videos.filter((id) => id.toString() !== videoId);
    await playlist.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Video removed from playlist successfully"
            )
        );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const playlists = await Playlist.find({ owner: userId });

    if (!playlists || playlists.length === 0) {
        return res
            .status(404)
            .json({ message: "This channel has no playlists" });
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlists,
                "User playlists retrieved successfully"
            )
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    const playlist = await Playlist.findById(playlistId)
        .populate("videos", "title thumbnail duration")
        .populate("owner", "username");

    if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist retrieved successfully")
        );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!name) {
        return res
            .status(400)
            .json(new ApiResponse(400, null, "Name is required"));
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            name,
            description,
        },
        { new: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Playlist updated successfully"
            )
        );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    await Playlist.findByIdAndDelete(playlistId);

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Playlist deleted successfully"));
});

export {
    createPlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getUserPlaylists,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
};
