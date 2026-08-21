/**
 * ProductCategory.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    tableName: 'TutShare',
    attributes: {
        title: {
            type: 'string',
            required: true
        },
        content: {
            type: 'string',
            required: true
        },
        comments: {
            type: 'json',
            required: true
        },
        isDeleted: {
            type: 'boolean',
            required: true,
        },
        createby: {
            type: 'string',
        },
        view: {
            type: 'number',
            defaultsTo: 0,
        },
        tags: {
            type: 'string',
        },
        description: {
            type: 'string',
        },
        thumbnail: {
            type: 'string',
        },
        youtubelink: {
            type: 'string',
        },
        langLib: {
            type: 'json',
            defaultsTo: [],
            description: 'Danh sach noi dung theo ngon ngu: [{ lang, title, description, content }]'
        },
    },

};
