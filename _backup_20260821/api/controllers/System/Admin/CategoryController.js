/**
 * CategoryController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
    createCategory: ({
        inputs: sails.config.inputs.Admin.Category.create,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { name } = inputs
            if (inputs.langLib !== undefined) inputs.langLib = sails.Ultils.normalizeLangLib(inputs.langLib)
            sails.dataProcess.find(Category, { condition: { name } }).then((result) => {
                if (result.length) {
                    return Promise.reject({
                        messageNode: 'Category',
                        message: 'exitsCategory'
                    })
                }
                return sails.dataProcess.createDocument(Category, inputs)
            }).then((result) => {
                exits.successRequest({
                    messageNode: 'Category',
                    message: 'createSuccess'
                });
            }).catch((err) => {
                sails.checkErrorOutput(err, exits)
            });
        }
    }),
    deleteCategory: ({
        inputs: sails.config.inputs.Admin.Category.delete,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { categoryId } = inputs
            sails.dataProcess.findOne(Category, { condition: { id: categoryId } }).then((result) => {
                if (result == null) {
                    return Promise.reject({
                        messageNode: 'Category',
                        message: 'notFoundCategory'
                    })
                }
                return sails.dataProcess.removeDocument(Product, { categoryId })
            }).then((result) => {
                return sails.dataProcess.removeDocument(Category, { id: categoryId })
            }).then((result) => {
                exits.successRequest({
                    messageNode: 'Category',
                    message: 'deleteSuccess'
                });
            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            })
        }
    }),
    updateCategory: ({
        inputs: sails.config.inputs.Admin.Category.update,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { name, id, price, note, category, description, imgUrl, importPrice, sold, discount, totalProduct, isHot, isActive, isSalePrice, isCheckLive, isNotPartnerPrice, langLib } = inputs
            let updateObject = { name, price, note, category, description, imgUrl, importPrice, sold, discount, totalProduct, isHot, isActive, isSalePrice, isCheckLive, isNotPartnerPrice }
            if (langLib !== undefined) updateObject.langLib = sails.Ultils.normalizeLangLib(langLib)

            let updateInfo = { condition: { id }, updateObject }
            sails.dataProcess.updateDocument(Category, updateInfo).then((result) => {
                // return sails.dataProcess.updateManyDocument(Product, { condition: { categoryId: id }, updateObject: { price } })
            }).then(result => {
                exits.successRequest({
                    messageNode: 'Category',
                    message: 'updateSuccess',
                })
            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            });
        }
    }),
    getListCategory: ({
        inputs: sails.config.inputs.Admin.Category.getListCategory,
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
            sails.dataProcess.getListDataFromModel(Category, filterCategory).then(result => {
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

    getListPartnerCategory: ({
        inputs: sails.config.inputs.Admin.Category.getListPartnerCategory,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let filterCategory = {
                condition: {

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
            if (inputs.domain) {
              filterObject.condition.baseDomain = inputs.domain
            }
            if (inputs.type) {
              filterObject.condition.type = inputs.type
            }
            sails.dataProcess.getListDataNative(PCategory, filterCategory).then(result => {
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


    updateImageCategory: ({
        inputs: sails.config.inputs.Admin.Category.updateImageCategory,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { imgUrl, pcategory } = inputs;
            let categories = [];
            if (!pcategory || !imgUrl) {
              sails.checkErrorOutput({success: false}, exits);
              return;
            } else {
              try {

                // Update imgUrl for all products in this category using $in operator
                const result = await sails.dataProcess.updateManyDocument(PCategory, {
                  condition: { id: { in: pcategory } },
                  updateObject: { imgUrl: imgUrl }
                });

                exits.successRequest({
                  messageNode: 'Category',
                  message: 'updateSuccess',
                  data: { updatedCount: categories.length }
                });
              } catch (err) {
                console.log(err);
                sails.checkErrorOutput(err, exits);
              }
            }
        }
    }),
    updateMultiCategory: ({
        inputs: sails.config.inputs.Admin.Category.updateMultiCategory,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { percent, pcategory } = inputs;
            if (Number(percent) < 10) {
                return exits.badRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'Tỷ lệ tối thiểu phải là 10%!'
                })
            }
            let categories = [];
            if (!pcategory) {
              sails.checkErrorOutput({success: false}, exits);
              return;
            } else {
              // categories = await sails.dataProcess.find(PCategory, { condition: {type : pcategory.type, baseDomain: pcategory.baseDomain, category: pcategory.id } });
              categories = await sails.dataProcess.find(PCategory, { condition: { category: pcategory.id } });
              Promise.all(
                  categories.map(async (category) => {
                      var impPrice = category.impPrice;
                      const filters = { p_id: category.p_id, type: category.type, baseDomain: category.baseDomain } ;
                      let existedCategory = await sails.dataProcess.findOne(PCategory, { condition: { p_id: category.p_id, type: category.type, baseDomain: category.baseDomain } });

                      category.price = (impPrice + Math.round(impPrice * percent / 100)) ;
                      if (!existedCategory) {
                          await sails.dataProcess.createDocument(PCategory, category);
                      } else {
                          let res = await sails.dataProcess.updateDocument(PCategory, { condition: { p_id: category.p_id, type: category.type, baseDomain: category.baseDomain }, updateObject: { price: category.price } });
                      }
                  })
              ).then(result => {
                  exits.successRequest({
                      messageNode: 'Category',
                      message: 'updateSuccess',
                  })
              }).catch((err) => {
                  console.log(err);
                  sails.checkErrorOutput(err, exits);
              });
            }
        }
    }),
    updatePartnerProductCategoryFolder: ({
        inputs: sails.config.inputs.Admin.Category.updatePartnerProductCategoryFolder,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { categoryIds, folderType, isHidden, pricePercent } = inputs;

            if (!categoryIds || categoryIds.length === 0) {
                sails.checkErrorOutput({ success: false, message: 'categoryIds is required' }, exits);
                return;
            }

            try {
                // Build update object with only non-empty values for Category table
                const categoryUpdateObject = {};

                // Only add folderType if it's not 0 (Chưa phân loại)
                if (folderType !== 0 && folderType !== null && folderType !== undefined) {
                    categoryUpdateObject.folderType = folderType;
                }

                // Only add isHidden if it's not null or empty string
                // Convert string status to boolean
                if (isHidden !== null && isHidden !== undefined && isHidden !== '') {
                    // Convert string status to boolean: 'tạm dừng' or 'inactive' -> true, 'hoạt động' or 'active' -> false
                    let isHiddenBool = isHidden;
                    if (typeof isHidden === 'string') {
                        isHiddenBool = isHidden.toLowerCase() === 'tạm dừng' || isHidden.toLowerCase() === 'inactive' || isHidden === true || isHidden === 'true';
                    }
                    categoryUpdateObject.isHidden = isHiddenBool;
                }

                // Update Category table with folderType and isHidden
                if (Object.keys(categoryUpdateObject).length > 0) {
                    await sails.dataProcess.updateManyDocument(PProductCategory, {
                        condition: { id: { in: categoryIds } },
                        updateObject: categoryUpdateObject
                    });
                }

                // Handle pricePercent update for PCategory records
                // Similar to updateMultiCategory function
                if (pricePercent !== 0 && pricePercent !== null && pricePercent !== undefined) {
                    // Get all PCategory records that belong to these categories
                    const pCategories = await sails.dataProcess.find(PCategory, {
                        condition: { category: { in: categoryIds } }
                    });

                    // Update price for each PCategory
                    await Promise.all(
                        pCategories.map(async (pcat) => {
                            // Calculate new price: newPrice = impPrice + (impPrice * pricePercent / 100)
                            const impPrice = pcat.impPrice || 0;
                            const newPrice = impPrice + Math.round(impPrice * pricePercent / 100);

                            return sails.dataProcess.updateDocument(PCategory, {
                                condition: { id: pcat.id },
                                updateObject: { price: newPrice, pricePercent: pricePercent }
                            });
                        })
                    );
                }

                exits.successRequest({
                    messageNode: 'Category',
                    message: 'updateSuccess',
                    data: { updatedCount: categoryIds.length }
                });
            } catch (err) {
                console.error('Error updating partner product category folder:', err);
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    updateSingleProductImage: ({
        inputs: sails.config.inputs.Admin.Category.updateSingleProductImage,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            const { productId, imgUrl } = inputs;
            try {
                await sails.dataProcess.updateDocument(PCategory, {
                    condition: { id: productId },
                    updateObject: { imgUrl }
                });
                exits.successRequest({ messageNode: 'Category', message: 'updateSuccess' });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    updateHotCategory: ({
        inputs: sails.config.inputs.Admin.Category.updateHotCategory,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { isHot, pcategory } = inputs;
            if (!pcategory || isHot === undefined || isHot === null) {
              sails.checkErrorOutput({success: false}, exits);
              return;
            } else {
              try {

                // Update isHot for all products in this category using $in operator
                const result = await sails.dataProcess.updateManyDocument(PCategory, {
                  condition: { id: { in: pcategory } },
                  updateObject: { isHot: isHot }
                });

                exits.successRequest({
                  messageNode: 'Category',
                  message: 'updateSuccess',
                  data: { updatedCount: pcategory.length }
                });
              } catch (err) {
                console.log(err);
                sails.checkErrorOutput(err, exits);
              }
            }
        }
    }),

    updateHiddenCategory: ({
        inputs: sails.config.inputs.Admin.Category.updateHiddenCategory,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { isHidden, pcategory } = inputs;
            if (!pcategory || isHidden === undefined || isHidden === null) {
              sails.checkErrorOutput({success: false}, exits);
              return;
            } else {
              try {
                await sails.dataProcess.updateManyDocument(PCategory, {
                  condition: { id: { in: pcategory } },
                  updateObject: { isHidden: isHidden, baseHidden: isHidden }
                });
                exits.successRequest({
                  messageNode: 'Category',
                  message: 'updateSuccess',
                  data: { updatedCount: pcategory.length }
                });
              } catch (err) {
                console.log(err);
                sails.checkErrorOutput(err, exits);
              }
            }
        }
    }),

    updateNameCategory: ({
        inputs: sails.config.inputs.Admin.Category.updateNameCategory,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { pcategory, prefix, suffix, findText, replaceText } = inputs;
            if (!pcategory || pcategory.length === 0) {
              sails.checkErrorOutput({ success: false }, exits);
              return;
            }
            try {
              const products = await sails.dataProcess.find(PCategory, { condition: { id: { in: pcategory } } });
              await Promise.all(products.map(product => {
                let name = product.name || '';
                if (prefix) name = prefix + name;
                if (suffix) name = name + suffix;
                if (findText) name = name.split(findText).join(replaceText || '');
                return sails.dataProcess.updateDocument(PCategory, {
                  condition: { id: product.id },
                  updateObject: { name }
                });
              }));
              exits.successRequest({
                messageNode: 'Category',
                message: 'updateSuccess',
                data: { updatedCount: products.length }
              });
            } catch (err) {
              console.log(err);
              sails.checkErrorOutput(err, exits);
            }
        }
    }),

    updatePayFirstCategory: ({
        inputs: sails.config.inputs.Admin.Category.updatePayFirstCategory,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { isPayFirst, pcategory } = inputs;
            if (!pcategory || isPayFirst === undefined || isPayFirst === null) {
              sails.checkErrorOutput({success: false}, exits);
              return;
            } else {
              try {

                // Update isPayFirst for all products in this category using $in operator
                const result = await sails.dataProcess.updateManyDocument(PCategory, {
                  condition: { id: { in: pcategory } },
                  updateObject: { isPayFirst: isPayFirst }
                });

                exits.successRequest({
                  messageNode: 'Category',
                  message: 'updateSuccess',
                  data: { updatedCount: pcategory.length }
                });
              } catch (err) {
                console.log(err);
                sails.checkErrorOutput(err, exits);
              }
            }
        }
    }),

    updateCategoryAssignment: ({
        inputs: sails.config.inputs.Admin.Category.updateCategoryAssignment,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { pcategory, category } = inputs;
            if (!pcategory || !Array.isArray(pcategory) || pcategory.length === 0 || !category) {
              sails.checkErrorOutput({ success: false }, exits);
              return;
            }
            try {
              await sails.dataProcess.updateManyDocument(PCategory, {
                condition: { id: { in: pcategory } },
                updateObject: { category: String(category) }
              });
              exits.successRequest({
                messageNode: 'Category',
                message: 'updateSuccess',
                data: { updatedCount: pcategory.length }
              });
            } catch (err) {
              console.log(err);
              sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
