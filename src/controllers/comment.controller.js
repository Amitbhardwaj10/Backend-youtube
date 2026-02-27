import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";

// fetch all video comments
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const pipeline = [
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
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
            $sort: { createdAt: -1 },
        },
    ];

    const options = {
        page,
        limit,
    };

    const comments = await Comment.aggregatePaginate(
        Comment.aggregate(pipeline),
        options
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                comments: comments.docs,

                pagination: {
                    totalComments: comments.totalDocs,
                    limit: comments.limit,
                    page: comments.page,
                    totalPages: comments.totalPages,
                    hasNextPage: comments.hasNextPage,
                    hasPrevPage: comments.hasPrevPage,
                },
            },
            "all comments fetched successfully!"
        )
    );
});

// add comment
const addComment = asyncHandler(async (req, res) => {});

export { getVideoComments, addComment };
