import { getRedisClient } from "./utils/redis";

export async function middleware1(req, res, next) {
    const redis = await getRedisClient()

}
