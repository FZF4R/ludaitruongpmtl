const redis = require('redis');
const { RateLimiterRedis } = require('rate-limiter-flexible');

const redisClient = redis.createClient({
    host: 'localhost',
    // port: 6379,
    port: 27017,
    enable_offline_queue: false,
});

const rateLimiter = new RateLimiterRedis({
    keyPrefix: 'x-create-oder',
    points: 1,
    pointsConsumed: 1,
    inmemoryBlockOnConsumed: 0,
    duration: 1,
    blockDuration: 0,
    inmemoryBlockDuration: 0,
    storeClient: redisClient,
    errorMessage: 'Rate limit exceeded'
});
const rateLimiterMiddleware = (req, res, next) => {
    return rateLimiter.consume(req.ip)
        .then(() => {
            return next();
        })
        .catch((err) => {
            return res.status(429).send('Too Many Requests');
        });
};
module.exports = {
    rateLimiter,
    rateLimiterMiddleware
};