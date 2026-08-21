/**
 * PublicController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const Speakeasy = require("speakeasy")

// Key bắt buộc trong body để được phép chạy health check
const HEALTH_CHECK_KEY = '11111111'

module.exports = {

    // API public kiểm tra tình trạng server, chỉ chạy khi body có key = '11111111'
    checkHealth: ({
        inputs: sails.config.inputs.Public.checkHealth,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            if (inputs.key !== HEALTH_CHECK_KEY) {
                exits.invalidInputParam({
                    messageNode: 'GlobalNotifications',
                    message: 'invalidInputParam'
                });
                return;
            }

            // Kiểm tra kết nối database bằng lệnh ping nhẹ, hỏng thì báo degraded chứ không throw
            let dbStatus = 'ok';
            try {
                await Product.getDatastore().manager.command({ ping: 1 });
            } catch (err) {
                dbStatus = 'error';
            }

            exits.successRequest({
                messageNode: 'GlobalNotifications',
                message: 'success',
                data: {
                    status: dbStatus === 'ok' ? 'healthy' : 'degraded',
                    database: dbStatus,
                    uptime: Math.floor(process.uptime()),
                    timestamp: new Date().toISOString()
                }
            });
        }
    }),

    getConfig: ({
        inputs: sails.config.inputs.Public.getConfig,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let filterGroup = {
                condition: {

                },
                limit: 500,
                page: 1
            }
            let filterCategory = {
                condition: {

                },
                limit: 500,
                page: 1,
                orderBy: [
                    { name: 'DESC' }
                ]
            }
            if (inputs.filter) {
                filterGroup.condition = inputs.filter
            }
            let response = {}
            let totalProduct = await Product.count({ isSell: true });
            if (totalProduct > 9999) {
                await sails.ProductService.backupProductToTable(totalProduct);
            }
            sails.dataProcess.getListDataFromModel(Category, filterCategory).then(({ data }) => {
                sails.PromiseMap(data, async cat => {
                    let totalGroupProduct = await Product.count({ categoryId: cat.id, isSell: false });
                    cat.totalProduct = totalGroupProduct ? totalGroupProduct : 0;
                    let res = { category: cat }
                    return res
                }).then(async(result) => {
                    response.clone = result
                    exits.successRequest({
                        messageNode: 'GlobalNotifications',
                        message: 'success',
                        data: response
                    });
                })
            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            });
        }
    }),
    getNotify: ({
        inputs: sails.config.inputs.Public.notify,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let filterNotify = {
                condition: {
                    isShow: true
                },
                orderBy: [
                    { createdAt: 'DESC' }
                ],
                limit: 10,
                page: 1
            }
            if (inputs.filter) {
                filterNotify.condition = inputs.filter
            }
            const lang = sails.Ultils.resolveLang(this.req)
            const notifyFields = sails.Ultils.langLibFields('notify')
            sails.dataProcess.getListDataFromModel(Notify, filterNotify).then((result) => {
                if (result && Array.isArray(result.data)) {
                    result.data = result.data.map(item => sails.Ultils.applyLangLib(item, lang, notifyFields))
                }
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: result
                });
            }).catch((error) => {
                sails.checkErrorOutput(error, exits);
            })
        }
    }),
    get2FA: ({
        inputs: sails.config.inputs.Public.get2FA,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let code = Speakeasy.totp({
                secret: inputs.secret,
                encoding: "base32"
            })
            exits.successRequest({
                messageNode: 'GlobalNotifications',
                message: 'success',
                data: code
            });
        }
    }),

    getIntegrateServicesByType: ({
        inputs: sails.config.inputs.Public.getIntegrateServicesByType,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            try {
                // Load SystemSettings configuration
                let systemSettings = await sails.dataProcess.findOne(SystemSettings, {
                    condition: {
                        id: sails.ID_CONFIG || '111111111111111111111111'
                    }
                });

                // Build filter condition with domainType
                let filterCondition = {
                    platformType: inputs.serviceType
                };

                if (systemSettings && systemSettings.serviceConfig && systemSettings.serviceConfig.length && systemSettings.serviceConfig.find(x=>x.is_active)) {
                    filterCondition.serviceType = systemSettings.serviceConfig.find(x=>x.is_active).DomainType;
                }

                let intergrateServices = await sails.dataProcess.findOne(IntergrateServices, {
                    condition: filterCondition
                });

                if (intergrateServices.is_maintaining)  {
                  intergrateServices.categories = [];
                } else if (intergrateServices && intergrateServices.categories && intergrateServices.categories.length) {
                  intergrateServices.categories = intergrateServices.categories ? intergrateServices.categories.filter(x=>x.is_hidden == false) : [];
                  intergrateServices.categories = intergrateServices.categories.sort((a,b) =>  (a.display_order - b.display_order ));
                  intergrateServices.categories.forEach(category => {
                    category.categoryName = category.category_id;
                    if (!category || !category.services || !category.services.length ) return;
                    category.services = category.services.filter(x=>!x.is_hidden);
                    category.services = category.services.sort((a,b) =>  (a.display_order - b.display_order ));

                    category.services.forEach(service => {
                      service.is_maintaining = category.is_maintaining ? category.is_maintaining : service.is_maintaining;
                      if (service.original_price) delete service.original_price;
                      if (service.commission_amount) delete service.commission_amount;
                      if (service.commission_percent) delete service.commission_percent;
                      if (service.basename) delete service.basename;
                      if (service.basedesc) delete service.basedesc;
                      if (service.user_rank) delete service.user_rank;
                    });
                  });
                }

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: intergrateServices
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),


    getServiceSettings: ({
        inputs: sails.config.inputs.Public.getSettings,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let filterObject = {
                condition: {
                    id: '000000000000000000000000'
                }
            }
            let systemSettings = await sails.dataProcess.findOne(SystemSettings, filterObject);
            let serviceSettings = {
                shareCost: systemSettings.serviceShareBuffCost,
                viewCost: systemSettings.serviceViewBuffCost,
                commentCost: systemSettings.serviceCommentBuffCost,
                isPublicServiceForAll: systemSettings.isPublicServiceForAll
            }
            exits.successRequest({
                messageNode: 'GlobalNotifications',
                message: 'success',
                data: serviceSettings
            });
        }
    }),

    getSettings: ({
        inputs: sails.config.inputs.Public.getSettings,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let filterObject = {
                condition: {
                    id: '000000000000000000000000'
                }
            }
            let systemSettings = await sails.dataProcess.findOne(SystemSettings, filterObject);
            delete systemSettings.adminSystem
            delete systemSettings.accountSessionUrl
            delete systemSettings.followServiceUrl
            delete systemSettings.jsessionId
            delete systemSettings.loginPageUrl
            delete systemSettings.loginPass
            delete systemSettings.loginUser
            delete systemSettings.pageTK
            delete systemSettings.serviceCommentBuffCost
            delete systemSettings.servisceCommentBuffUrl
            delete systemSettings.serviceShareBuffCost
            delete systemSettings.servisceShareBuffUrl
            delete systemSettings.serviceViewBuffCost
            delete systemSettings.serviceViewBuffUrl
            delete systemSettings.updatedAt
            delete systemSettings.serviceAuthToken
            delete systemSettings.isPublicServiceForAll
            delete systemSettings.serviceToken
            delete systemSettings.id

            const lang = sails.Ultils.resolveLang(this.req)
            const langWarning = sails.Ultils.langLibValue(systemSettings, lang, 'mainWarning')
            systemSettings = sails.Ultils.applyLangLib(systemSettings, lang, sails.Ultils.langLibFields('systemSettings'))
            if (!langWarning && lang !== 'vi' && systemSettings.mainWarningEng) {
                systemSettings.mainWarning = systemSettings.mainWarningEng
            }

            exits.successRequest({
                messageNode: 'GlobalNotifications',
                message: 'success',
                data: systemSettings
            });
        }
    }),

    // Return Warning field from a specific SystemSettings record
    getSystemWarning: ({
        inputs: sails.config.inputs.Public.getSettings,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            try {
                const WARN_ID = sails.SERVICE_ID;
                let filterObject = {
                    condition: {
                        id: WARN_ID
                    }
                };

                let systemSettings = await sails.dataProcess.findOne(SystemSettings, filterObject);

                const warningContent = systemSettings && systemSettings.Warning ? systemSettings.Warning : null;

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { warning: warningContent }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),


    getListCategory: ({
        inputs: sails.config.inputs.Public.getListCategory,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let filterCategory = {
                condition: {},
                limit: inputs.limit,
                page: inputs.page,
                orderBy: [
                    { name: 'DESC' }
                ]
            }
            if (inputs.filter) {
                filterCategory.condition = inputs.filter
            }

            sails.dataProcess.getListDataFromModel(Category, filterCategory).then(({ data }) => {
                sails.PromiseMap(data, async cat => {
                    // let a = await sails.Product.getListGroupPublicByCategory(cat.id);
                    let totalGroupProduct = await Product.count({ categoryId: cat.id, isSell: false, isDie: false });
                    cat.totalProduct = totalGroupProduct ? totalGroupProduct : 0;
                    if (cat.importPrice) delete cat.importPrice;
                    let res = { category: cat }
                    return res
                }).then(async(result) => {
                    exits.successRequest({
                        messageNode: 'GlobalNotifications',
                        message: 'success',
                        data: result
                    });
                })

            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    getListProductCategoryV2: ({
        inputs: sails.config.inputs.Public.getListProductCategoryV2,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { filter, limit, page, folderTypes } = inputs

            // Ngon ngu cua request (header x-language). langLib rong thi giu nguyen ban goc.
            const lang = sails.Ultils.resolveLang(this.req)
            const translate = (record, field, fallback) => sails.Ultils.langLibValue(record, lang, field) || fallback

            if (!folderTypes || !folderTypes.length) {
              exits.successRequest({
                  messageNode: 'GlobalNotifications',
                  message: 'success',
                  data: {}
              });
              return;
            }

            // Chuyển folderTypes từ string sang array numbers
            let folderTypeIds = Array.isArray(folderTypes) ? folderTypes : folderTypes.split(',').map(Number)

            // Danh mục đến từ 2 bảng khác nhau nên phải lấy hết rồi mới phân trang thủ công được
            const FOLDER_QUERY_LIMIT = 1000

            // imgUrl mặc định của model là tên icon (vd 'ri-facebook-fill') nên phải bỏ để giao diện dùng ảnh mặc định
            const toImageLink = (imgUrl) => /^(https?:\/\/|\/|data:)/.test(imgUrl || '') ? imgUrl : ''

            try {
                // ===== Sản phẩm đối tác: PProductCategory + PCategory =====
                let partnerFolderResult = await sails.dataProcess.getListDataFromModel(PProductCategory, {
                    condition: {
                        folderType: { in: folderTypeIds },
                        isHidden: false,
                    },
                    orderBy: [
                        { createdAt: 'DESC' }
                    ],
                    limit: FOLDER_QUERY_LIMIT,
                    page: 1
                })

                // Lấy categoryIds TRƯỚC khi reshape để query PCategory phụ thuộc
                let partnerFolderIds = partnerFolderResult.data.map(pc => pc.id).filter(id => id);

                // Load toàn bộ PCategory phụ thuộc
                let allPCategories = partnerFolderIds.length ? await sails.dataProcess.getListDataFromModel(PCategory, {
                    condition: {
                        category: { in: partnerFolderIds },
                        totalProduct: { '>': 0 },
                        isHidden: false
                    },
                    limit: FOLDER_QUERY_LIMIT,
                    page: 1,
                    orderBy: [
                        { name: 'ASC' }
                    ]
                }) : { data: [] }

                // Whitelist mapping: chỉ trả các field cần thiết, tránh lộ data nhạy cảm
                let partnerFolders = partnerFolderResult.data.map(productCategory => ({
                    id: productCategory.id,
                    name: translate(productCategory, 'name', productCategory.name),
                    imgUrl: toImageLink(productCategory.imgUrl),
                    description: translate(productCategory, 'description', productCategory.description || ''),
                    color: productCategory.color || '',
                    folderType: productCategory.folderType,
                    products: (allPCategories.data || [])
                        .filter(product => product.category === productCategory.id)
                        .map(product => ({
                            id: product.id,
                            name: translate(product, 'name', product.name),
                            price: product.price,
                            totalProduct: product.totalProduct,
                            sold: product.sold,
                            note: translate(product, 'note', product.note),
                            description: translate(product, 'description', product.description || ''),
                            isNotPartnerPrice: product.isNotPartnerPrice,
                            imgUrl: toImageLink(product.imgUrl),
                            isHot: product.isHot
                        }))
                }))

                // ===== Sản phẩm nội bộ: ProductCategory + Category =====
                // ProductCategory không có field isHidden, dùng '!= false' để không ẩn bản ghi cũ chưa có isActive
                let internalFolderResult = await sails.dataProcess.getListDataFromModel(ProductCategory, {
                    condition: {
                        folderType: { in: folderTypeIds },
                        isActive: { '!=': false }
                    },
                    orderBy: [
                        { createdAt: 'DESC' }
                    ],
                    limit: FOLDER_QUERY_LIMIT,
                    page: 1
                })

                let internalFolderIds = internalFolderResult.data.map(pc => pc.id).filter(id => id);

                let allCategories = internalFolderIds.length ? await sails.dataProcess.getListDataFromModel(Category, {
                    condition: {
                        category: { in: internalFolderIds },
                        isActive: { '!=': false }
                    },
                    limit: FOLDER_QUERY_LIMIT,
                    page: 1,
                    orderBy: [
                        { name: 'ASC' }
                    ]
                }) : { data: [] }

                // Tồn kho thật của sản phẩm nội bộ nằm ở bảng Product, Category.totalProduct do admin nhập tay nên không dùng được
                let availableCountByCategory = {}
                let internalProductIds = (allCategories.data || []).map(product => product.id)
                if (internalProductIds.length) {
                    let rawCollection = Product.getDatastore().manager.collection(Product.tableName)
                    let groupedCount = await rawCollection.aggregate([
                        { $match: { categoryId: { $in: internalProductIds }, isSell: false, isDie: false } },
                        { $group: { _id: '$categoryId', total: { $sum: 1 } } }
                    ]).toArray()
                    groupedCount.forEach(row => {
                        availableCountByCategory[row._id] = row.total
                    })
                }

                let internalFolders = internalFolderResult.data.map(productCategory => ({
                    id: productCategory.id,
                    name: translate(productCategory, 'name', productCategory.name),
                    imgUrl: toImageLink(productCategory.imgUrl),
                    description: sails.Ultils.langLibValue(productCategory, lang, 'description')
                        || sails.Ultils.langLibValue(productCategory, lang, 'note')
                        || productCategory.note || '', // ProductCategory không có field description
                    color: productCategory.color || '',
                    folderType: productCategory.folderType,
                    products: (allCategories.data || [])
                        .filter(product => product.category === productCategory.id)
                        .map(product => ({
                            id: product.id,
                            name: translate(product, 'name', product.name),
                            price: product.price,
                            totalProduct: availableCountByCategory[product.id] || 0,
                            sold: product.sold,
                            note: translate(product, 'note', product.note),
                            description: translate(product, 'description', product.description || ''),
                            imgUrl: toImageLink(product.imgUrl),
                            isHot: product.isHot,
                            isNotPartnerPrice: product.isNotPartnerPrice,
                            discount: product.discount,
                            isCheckLive: product.isCheckLive
                        }))
                        .filter(product => product.totalProduct > 0) // Chỉ trả sản phẩm còn hàng, giống nhánh đối tác
                }))

                // Sản phẩm chính (nội bộ) luôn đứng trước sản phẩm đối tác
                let allFolders = [...internalFolders, ...partnerFolders]

                // Phân trang thủ công vì dữ liệu đã gộp từ 2 collection
                let pageSize = limit > 0 ? limit : allFolders.length
                let skip = (page > 1 ? page - 1 : 0) * pageSize
                let pageData = allFolders.slice(skip, skip + pageSize)

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: {
                        Page: page,
                        total: allFolders.length,
                        TotalInList: pageData.length,
                        data: pageData
                    }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    // Giống getListProductCategoryV2 nhưng lấy toàn bộ danh mục/sản phẩm (không lọc theo folderType),
    // gộp cả 2 nguồn: sản phẩm đối tác (PProductCategory + PCategory) và sản phẩm nội bộ (ProductCategory + Category)
    getAllProductCategoryV2: ({
        inputs: sails.config.inputs.Public.getAllProductCategoryV2,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { pageSize } = inputs

            // Ngon ngu cua request (header x-language). langLib rong thi giu nguyen ban goc.
            const lang = sails.Ultils.resolveLang(this.req)
            const translate = (record, field, fallback) => sails.Ultils.langLibValue(record, lang, field) || fallback

            // API này trả về toàn bộ dữ liệu nên phải tự query hết các trang thay vì phân trang theo request
            const getAllRecords = async (processModel, condition, orderBy) => {
                const MAX_PAGE = 100
                let allRecords = []
                for (let currentPage = 1; currentPage <= MAX_PAGE; currentPage++) {
                    let result = await sails.dataProcess.getListDataFromModel(processModel, {
                        condition: Object.assign({}, condition),
                        orderBy: orderBy,
                        limit: pageSize,
                        page: currentPage
                    })
                    let pageData = result.data || []
                    allRecords.push(...pageData)
                    if (pageData.length < pageSize) {
                        break
                    }
                }
                return allRecords
            }

            // Tồn kho thật của sản phẩm nội bộ nằm ở bảng Product, Category.totalProduct do admin nhập tay nên không dùng được
            const countAvailableProducts = async (categoryIds) => {
                if (!categoryIds.length) {
                    return {}
                }
                let processAdapter = Product.getDatastore().manager
                let rawCollection = processAdapter.collection(Product.tableName)
                let groupedCount = await rawCollection.aggregate([
                    { $match: { categoryId: { $in: categoryIds }, isSell: false, isDie: false } },
                    { $group: { _id: '$categoryId', total: { $sum: 1 } } }
                ]).toArray()

                let countByCategory = {}
                groupedCount.forEach(row => {
                    countByCategory[row._id] = row.total
                })
                return countByCategory
            }

            // imgUrl mặc định của model là tên icon (vd 'ri-facebook-fill') nên phải bỏ để giao diện dùng ảnh mặc định
            const toImageLink = (imgUrl) => /^(https?:\/\/|\/|data:)/.test(imgUrl || '') ? imgUrl : ''

            // Gom sản phẩm theo danh mục cha để không phải filter lại cho từng danh mục
            const groupByParentCategory = (products) => {
                let productsByCategory = {}
                products.forEach(product => {
                    if (!productsByCategory[product.category]) {
                        productsByCategory[product.category] = []
                    }
                    productsByCategory[product.category].push(product)
                })
                return productsByCategory
            }

            try {
                // ===== Sản phẩm đối tác: PProductCategory + PCategory =====
                let partnerFolders = await getAllRecords(PProductCategory, {
                    isHidden: false
                }, [
                    { folderType: 'ASC' },
                    { createdAt: 'DESC' }
                ])

                let partnerFolderIds = partnerFolders.map(folder => folder.id).filter(id => id)

                let partnerProducts = partnerFolderIds.length ? await getAllRecords(PCategory, {
                    category: { in: partnerFolderIds },
                    totalProduct: { '>': 0 },
                    isHidden: false
                }, [
                    { name: 'ASC' }
                ]) : []

                // Whitelist mapping: chỉ trả các field cần thiết, tránh lộ data nhạy cảm
                let partnerProductsByFolder = groupByParentCategory(partnerProducts.map(product => ({
                    id: product.id,
                    category: product.category,
                    name: translate(product, 'name', product.name),
                    price: product.price,
                    totalProduct: product.totalProduct,
                    sold: product.sold,
                    note: translate(product, 'note', product.note),
                    description: translate(product, 'description', product.description || ''),
                    isNotPartnerPrice: product.isNotPartnerPrice,
                    imgUrl: toImageLink(product.imgUrl),
                    isHot: product.isHot
                })))

                // ===== Sản phẩm nội bộ: ProductCategory + Category =====
                // Dùng '!= false' để không ẩn các bản ghi cũ chưa có field isActive
                let internalFolders = await getAllRecords(ProductCategory, {
                    isActive: { '!=': false }
                }, [
                    { folderType: 'ASC' },
                    { createdAt: 'DESC' }
                ])

                let internalFolderIds = internalFolders.map(folder => folder.id).filter(id => id)

                let internalProducts = internalFolderIds.length ? await getAllRecords(Category, {
                    category: { in: internalFolderIds },
                    isActive: { '!=': false }
                }, [
                    { name: 'ASC' }
                ]) : []

                let availableCountByCategory = await countAvailableProducts(internalProducts.map(product => product.id))

                let internalProductsByFolder = groupByParentCategory(internalProducts.map(product => ({
                    id: product.id,
                    category: product.category,
                    name: translate(product, 'name', product.name),
                    price: product.price,
                    totalProduct: availableCountByCategory[product.id] || 0,
                    sold: product.sold,
                    note: translate(product, 'note', product.note),
                    description: translate(product, 'description', product.description || ''),
                    imgUrl: toImageLink(product.imgUrl),
                    isHot: product.isHot,
                    isNotPartnerPrice: product.isNotPartnerPrice,
                    discount: product.discount,
                    isCheckLive: product.isCheckLive
                })).filter(product => product.totalProduct > 0)) // Chỉ trả sản phẩm còn hàng, giống nhánh đối tác

                // Bỏ danh mục rỗng, sắp theo folderType rồi tới tên
                const cleanUpFolders = (folders) => folders
                    .filter(folder => folder.products.length > 0)
                    .sort((a, b) => (a.folderType || 0) - (b.folderType || 0) || (a.name || '').localeCompare(b.name || '', 'vi'))

                // Sản phẩm chính (nội bộ) luôn đứng trước sản phẩm đối tác
                let data = [
                    ...cleanUpFolders(internalFolders.map(folder => ({
                        id: folder.id,
                        name: translate(folder, 'name', folder.name),
                        imgUrl: toImageLink(folder.imgUrl),
                        description: sails.Ultils.langLibValue(folder, lang, 'description')
                            || sails.Ultils.langLibValue(folder, lang, 'note')
                            || folder.note || '',
                        color: folder.color || '',
                        folderType: folder.folderType,
                        products: internalProductsByFolder[folder.id] || []
                    }))),
                    ...cleanUpFolders(partnerFolders.map(folder => ({
                        id: folder.id,
                        name: translate(folder, 'name', folder.name),
                        imgUrl: toImageLink(folder.imgUrl),
                        description: translate(folder, 'description', folder.description || ''),
                        color: folder.color || '',
                        folderType: folder.folderType,
                        products: partnerProductsByFolder[folder.id] || []
                    })))
                ]

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: {
                        Page: 1,
                        total: data.length,
                        TotalInList: data.length,
                        data: data
                    }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    getListProductCategory: ({
        inputs: sails.config.inputs.Public.getListProductCategory,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { filter, limit, page } = inputs
            let filterObject = {
                condition: {

                },
                orderBy: [
                    { createdAt: 'DESC' }
                ],
                limit: limit,
                page: page
            }

            if (inputs.filter) {
                try {
                  filterObject.condition = JSON.parse(inputs.filter)
                } catch(error) {

                }
            }

            sails.dataProcess.getListDataFromModel(ProductCategory, filterObject).then((result) => {
              exits.successRequest({
                  messageNode: 'GlobalNotifications',
                  message: 'success',
                  data: result
              });
            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    getPartnerListCategory: ({
        inputs: sails.config.inputs.Public.getListCategory,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let filterCategory = {
                condition: {
                  productCount: {'>' : 0},
                  isHidden: false,
                },
                limit: inputs.limit,
                page: inputs.page,
                orderBy: [
                    { name: 'DESC' }
                ]
            }
            if (inputs.filter) {
                filterCategory.condition = inputs.filter
            }

            sails.dataProcess.getListDataFromModel(PCategory, filterCategory).then((result) => {
              result.data = result.data.map(pcategory=>({
                      id: pcategory.id,
                      name: pcategory.name,
                      price: pcategory.price,
                      totalProduct: pcategory.totalProduct,
                      sold: pcategory.sold,
                      note: pcategory.note,
                      // description: pcategory.description || pcategory.note,
                      imgUrl: pcategory.imgUrl
                    }))
              exits.successRequest({
                  messageNode: 'GlobalNotifications',
                  message: 'success',
                  data: result
              });
            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    getPartnerListProductCategory: ({
        inputs: sails.config.inputs.Public.getListProductCategory,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { filter, limit, page } = inputs
            let filterObject = {
                condition: {
                  isHidden: false,
                },
                orderBy: [
                    { createdAt: 'DESC' }
                ],
                limit: limit,
                page: page
            }

            if (inputs.filter) {
                try {
                  filterObject.condition = JSON.parse(inputs.filter)
                } catch(error) {

                }
            }

            let filterPObject = {
                condition: {

                },
                limit: 100,
                page: 1,
                orderBy: [
                    { name: 'DESC' }
                ]
            }

            sails.dataProcess.getListDataFromModel(PProductCategory, filterPObject).then((vcloneProductCategories) => {
              if (vcloneProductCategories && vcloneProductCategories.data) {
                  var visibleProductCategory = [];
                  vcloneProductCategories.data.forEach(vcloneProductCategory => {
                      if (vcloneProductCategory.isHidden) return;
                      vcloneProductCategory.isPartner = true;

                      if (vcloneProductCategory.products) delete vcloneProductCategory.products
                      if (vcloneProductCategory.baseInfo) delete vcloneProductCategory.baseInfo
                      if (vcloneProductCategory.baseDomain) delete vcloneProductCategory.baseDomain
                      if (vcloneProductCategory.isHidden) delete vcloneProductCategory.isHidden
                      if (vcloneProductCategory.urlIcon) delete vcloneProductCategory.urlIcon
                      visibleProductCategory.push(vcloneProductCategory);
                  });

                  vcloneProductCategories.data = visibleProductCategory;
              }
              exits.successRequest({
                  messageNode: 'GlobalNotifications',
                  message: 'success',
                  data: vcloneProductCategories
              });
          }).catch((err) => {
              sails.checkErrorOutput(err, exits);
          });
        }
    })
};
