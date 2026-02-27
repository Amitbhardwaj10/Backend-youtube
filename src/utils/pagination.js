export const getPagination = (result) => ({
    total: result.totalDocs,
    limit: result.limit,
    page: result.page,
    totalPages: result.totalPages,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
});
