import { Like } from "../models/like.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const existingLike = await Like.findOne({
        likedBy: req.user._id,
        video: videoId,
    });

    if (existingLike) {
        await existingLike.deleteOne({ _id: existingLike._id }, { new: true });
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { liked: false },
                    "Video unliked successfully"
                )
            );
    }

    await Like.create({
        likedBy: req.user._id,
        video: videoId,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, { liked: true }, "Video liked successfully")
        );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const existingLike = await Like.findOne({
        likedBy: req.user._id,
        comment: commentId,
    });

    if (existingLike) {
        await existingLike.deleteOne({ _id: existingLike._id }, { new: true });
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { liked: false },
                    "Comment unliked successfully"
                )
            );
    }

    await Like.create({
        likedBy: req.user._id,
        comment: commentId,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, { liked: true }, "Comment liked successfully")
        );
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const likedVideos = await Like.aggregatePaginate(
        Like.aggregate([
            {
                $match: {
                    likedBy: req.user._id,
                    video: { $ne: null },
                },
            },

            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "videoDetails",
                    pipeline: [
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
                            $project: {
                                title: 1,
                                thumbnail: 1,
                                duration: 1,
                                views: 1,
                                createdAt: 1,
                                owner: 1,
                            },
                        },
                    ],
                },
            },

            {
                $addFields: {
                    videoDetails: {
                        $first: "$videoDetails",
                    },
                },
            },

            {
                $sort: { createdAt: -1 },
            },

            {
                $project: {
                    _id: 0,
                    videoDetails: 1,
                },
            },
        ]),
        {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
        }
    );

    if (!likedVideos || likedVideos.docs.length === 0) {
        return res
            .status(404)
            .json(
                new ApiResponse(
                    404,
                    null,
                    "No liked videos found for this user"
                )
            );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videos: likedVideos.docs,

                pagination: getPagination(likedVideos),
            },
            "Liked videos retrieved successfully"
        )
    );
});

export { getLikedVideos, toggleVideoLike, toggleCommentLike };
