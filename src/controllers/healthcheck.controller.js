import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const healthCheck = asyncHandler(async (req , res) => {
    return res
        .status(200)
        .json(new apiResponse(200 , "ok" , "health check passed"))
})

