import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { getPagination } from "../utils/pagination.js";
import { User } from "../models/user.model.js";
import cloudinary from "cloudinary";

const getAllVideos = asyncHandler(async (req, res) => {
    const { search, sortBy, sortType, userId } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const sortOrder = sortType === "asc" ? 1 : -1;

    const allowedSortFields = ["createdAt", "views"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const match = {
        owner: new mongoose.Types.ObjectId(userId),
    };

    if (search?.trim()) {
        match.$text = { $search: search };
    }

    const pipeline = [
        {
            $match: match,
        },

        {
            $sort: {
                [sortField]: sortOrder,
            },
        },

        {
            $project: {
                thumbnail: 1,
                title: 1,
                views: 1,
                duration: 1,
                createdAt: 1,
            },
        },
    ];

    const videos = await Video.aggregatePaginate(Video.aggregate(pipeline), {
        page,
        limit,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videos: videos.docs || [],

                pagination: getPagination(videos),
            },
            "videos fetched successfully"
        )
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "title and description are required");
    }

    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "video and thumbnail is required");
    }

    const uploadedVideo = await uploadOnCloudinary(videoLocalPath, "video");
    const uploadedThumbnail = await uploadOnCloudinary(
        thumbnailLocalPath,
        "image"
    );

    if (!uploadedVideo || !uploadedThumbnail) {
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
        owner: req.user._id,
    });

    if (!video) {
        throw new ApiError(500, "something went wrong while saving the video");
    }

    res.status(200).json(
        new ApiResponse(200, video, "video uploaded successfully")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "invalid video id");
    }

    const pipeline = [
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
            },
        },

        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            username: 1,
                        },
                    },
                ],
            },
        },

        {
            $lookup: {
                from: "subscriptions",
                localField: "owner",
                foreignField: "channel",
                as: "subscribers",
            },
        },

        {
            $addFields: {
                owner: {
                    $first: "$owner",
                },

                subscribersCount: {
                    $size: "$subscribers",
                },

                isSubscribed: {
                    $in: [req.user?._id, "$subscribers.subscriber"],
                },
            },
        },

        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                owner: 1,
                subscribersCount: 1,
                isSubscribed: 1,
            },
        },
    ];

    // increase the view count by 1 if the user has not watched the video before
    if (req.user) {
        const alreadyWatched = await User.findOne({
            _id: req.user._id,
            watchHistory: videoId,
        });

        if (!alreadyWatched) {
            await Video.updateOne({ _id: videoId }, { $inc: { views: 1 } });

            await User.updateOne(
                { _id: req.user._id },
                { $addToSet: { watchHistory: videoId } }
            );
        }
    } else {
        await Video.updateOne({ _id: videoId }, { $inc: { views: 1 } });
    }

    const video = await Video.aggregate(pipeline);

    if (!video.length) {
        throw new ApiError(404, "video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video[0], "video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const thumbnailLocalPath = req.file?.path;

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "invalid video id");
    }

    if (!title && !description && !thumbnailLocalPath) {
        throw new ApiError(400, "at least one field is required to update");
    }

    const video = await Video.findOne({ _id: videoId, owner: req.user._id });

    if (!video) {
        throw new ApiError(404, "video not found or you are not the owner");
    }

    if (title) {
        video.title = title;
    }

    if (description) {
        video.description = description;
    }

    const oldThumbnailPublicId = video.thumbnailPublicId;

    if (thumbnailLocalPath) {
        const uploadedThumbnail = await uploadOnCloudinary(
            thumbnailLocalPath,
            "image"
        );

        if (!uploadedThumbnail) {
            throw new ApiError(
                400,
                "failed to upload thumbnail on cloudinary!"
            );
        } else {
            video.thumbnail = uploadedThumbnail.url;
            video.thumbnailPublicId = uploadedThumbnail.public_id;
        }
    }

    if (oldThumbnailPublicId && thumbnailLocalPath) {
        await cloudinary.uploader.destroy(oldThumbnailPublicId);
    }

    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "invalid video id");
    }

    const video = await Video.findOne({ _id: videoId, owner: req.user._id });

    if (!video) {
        throw new ApiError(404, "video not found or you are not the owner");
    }

    const videoPublicId = video.videoPublicId;
    const thumbnailPublicId = video.thumbnailPublicId;

    await Video.deleteOne({ _id: videoId });

    if (videoPublicId) {
        await cloudinary.uploader.destroy(videoPublicId);
    }

    if (thumbnailPublicId) {
        await cloudinary.uploader.destroy(thumbnailPublicId);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "invalid video id");
    }

    const video = await Video.findOne({ _id: videoId, owner: req.user._id });

    if (!video) {
        throw new ApiError(404, "video not found or you are not the owner");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished: video.isPublished },
                "publish status toggled successfully"
            )
        );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
