import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose, { Aggregate } from "mongoose";

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

    const match = {};

    if (search?.trim()) {
        match.title = { $regex: search.trim(), $options: "i" };
    }

    if (userId) {
        match.owner = new mongoose.Types.ObjectId(userId);
    }

    const pipeline = [
        {
            $match: match,
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
                            username: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },

        {
            $addFields: {
                owner: {
                    $first: "$owner",
                },
            },
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
                owner: 1,
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

                pagination: {
                    totalVideos: videos.totalDocs,
                    limit: videos.limit,
                    page: videos.page,
                    totalPages: videos.totalPages,
                    hasNextPage: videos.hasNextPage,
                    hasPrevPage: videos.hasPrevPage,
                },
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

    const uploadedVideo = await uploadOnCloudinary(videoLocalPath);
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

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

export { getAllVideos, publishAVideo };
