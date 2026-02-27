import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import ApiResponse from "../utils/ApiResponse.js";

const getAllVideos = asyncHandler(async (req, res) => {});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "title and description are required");
    }

    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoLocalPath && !thumbnailLocalPath) {
        throw new ApiError(400, "video and thumbnail is required");
    }

    const uploadedVideo = await uploadOnCloudinary(videoLocalPath);
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!uploadedVideo && !uploadedThumbnail) {
        throw new ApiError(400, "failed to upload on cloudinary!");
    }

    const video = await Video.create({
        videoFile: uploadedVideo?.url,
        thumbnail: uploadedThumbnail?.url,
        title,
        description,
        isPublished: true,
        videoPublicId: uploadedVideo.public_id,
        thumbnailPublicId: uploadedThumbnail.public_id,
        duration: uploadedVideo.duration,
    });

    if (!video) {
        throw new ApiError(500, "something went wrong while saving the video");
    }

    res.status(200).json(
        new ApiResponse(200, video, "video uploaded successfully")
    );
});

export { getAllVideos, publishAVideo };
