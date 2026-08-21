/**
 * Users.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
    // Distinct table for user avatars (previously misconfigured pointing to Users)
    tableName: 'UserAvatar',
    attributes: {
        username: {
            type: 'string',
            required: true,
        },
        userId: {
            type: 'string', // referencing Users.id
            required: true,
        },
        // Store avatar as base64 string (without data URI prefix) or as a URL/path in future
        avatar: {
            type: 'string',
            required: true,
        }
    },
};
