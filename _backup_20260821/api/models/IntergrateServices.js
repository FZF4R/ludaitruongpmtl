/**
 * IntergrateServices.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    // Unique ID
    pid: {
      type: 'string',
      required: true,
      description: 'Platform ID duy nhất'
    },

    // Platform Information
    is_hidden: {
      type: 'boolean',
      defaultsTo: false,
      description: 'Ẩn nền tảng hoặc không'
    },

    platform_id: {
      type: 'string',
      required: true,
      description: 'ID nền tảng duy nhất'
    },

    platform_slug: {
      type: 'string',
      required: true,
      description: 'Slug của nền tảng (ví dụ: lazada, shopee, facebook)'
    },

    is_maintaining: {
      type: 'boolean',
      defaultsTo: false,
      description: 'Trạng thái bảo trì'
    },

    serviceType: {
      type: 'number',
      description: 'Loại dịch vụ / DomainType của config (để phân biệt các nguồn dữ liệu khác nhau)'
    },

    platformType: {
      type: 'number',
      description: 'Dịch vụ thuộc nền tảng nào (Tiktok, Facebook, Insta,...)'
    },

    // Categories - Danh mục dịch vụ
    categories: {
      type: 'json',
      defaultsTo: [],
      description: 'Danh sách danh mục và dịch vụ',
      columnType: 'longtext'
    },

    /**
     * Cấu trúc categories:
     * [
     *   {
     *     "is_hidden": boolean,
     *     "category_id": number,
     *     "category_slug": string,
     *     "is_maintaining": boolean,
     *     "services": [
     *       {
     *         "id": number,
     *         "slug": string,
     *         "name": string,
     *         "info": string,
     *         "note": string|null,
     *         "price": number (giá sau khi thêm chênh lệch),
     *         "original_price": number (giá gốc trước khi thêm chênh lệch),
     *         "commission_percent": number (phần trăm chênh lệch),
     *         "commission_amount": number (số tiền chênh lệch),
     *         "stats": {
     *           "total": number,
     *           "completed": number,
     *           "percent_completed": number
     *         },
     *         "status": boolean,
     *         "options": {
     *           "min_buy": number,
     *           "max_buy": number,
     *           "reaction": boolean,
     *           "comments": boolean,
     *           "charge_by": string,
     *           "form_type": string,
     *           "select_post": boolean
     *         }
     *       }
     *     ]
     *   }
     * ]
     */

    // Timestamps
    createdAt: {
      type: 'ref',
      columnName: 'created_at',
      autoCreatedAt: true
    },

    updatedAt: {
      type: 'ref',
      columnName: 'updated_at',
      autoUpdatedAt: true
    }

  },

  tableName: 'IntegrateServices',

};
