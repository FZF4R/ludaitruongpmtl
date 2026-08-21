module.exports.inputs = {
    FacebookService: {
        PageFollow: {
            getPageFollowOptions: {

            },
        }
    },
    Users: {
        markViewedNotification: {
            User: {
                type: 'json'
            },
            notifications: {
                type: 'json',
                required: true
            },
        },

        getAllNotify: {
            User: {
                type: 'json'
            },

            page: {
                type: 'number',
                defaultsTo: 1
            },
            limit: {
                type: 'number',
                defaultsTo: 5
            },
        },
        buffShare: {
            User: {
                type: 'json'
            },
            Link: {
                type: 'string',
                required: true,
            },
            NumberEyes: {
                type: 'string',
                required: true,
            },
            TimeStart: {
                type: 'string',
                required: true,
            },
            Note: {
                type: 'string',
                required: true,
            },
            Note: {
                type: 'string',
            },
            Type: {
                type: 'string',
            }
        },

        updateServiceCost: {
            User: {
                type: 'json'
            },
            serviceViewBuffCost: {
                type: 'string',
                required: true,
            },
            serviceShareBuffCost: {
                type: 'string',
                required: true,
            },
            serviceCommentBuffCost: {
                type: 'string',
                required: true,
            }
        },

        buffComment: {
            User: {
                type: 'json'
            },
            Link: {
                type: 'string',
                required: true,
            },
            NumberEyes: {
                type: 'string',
                required: true,
            },
            TimeStart: {
                type: 'string',
                required: true,
            },
            Note: {
                type: 'string',
                required: true,
            },
            Note: {
                type: 'string',
            },
            Type: {
                type: 'string',
            }
        },
        buffView: {
            User: {
                type: 'json'
            },
            Duration: {
                type: 'string',
                required: true,
            },
            Link: {
                type: 'string',
                required: true,
            },
            NumberEyes: {
                type: 'string',
                required: true,
            },
            TimeStart: {
                type: 'string',
                required: true,
            },
            Note: {
                type: 'string',
                required: true,
            },
            Note: {
                type: 'string',
            },
            Type: {
                type: 'string',
            }
        },

        buySubFollowServiceV2: {
            User: {
                type: 'json'
            },
            serverOrder: {
                type: 'string'
            },
            note: {
                type: 'string',
            },
            amount: {
                type: 'number',
                required: true,
            },
            fbUid: {
                type: 'string',
                required: true,
            },
            productId: {
                type: 'number',
                required: true,
            },
        },

        buySubFollowService: {
            User: {
                type: 'json'
            },
            alreadyHave: {
                type: 'number',
                required: true,
            },
            amount: {
                type: 'number',
                required: true,
            },
            fbUid: {
                type: 'string',
                required: true,
            },
            productId: {
                type: 'number',
                required: true,
            },
        },

        register: {
            username: {
                type: 'string',
                required: true
            },
            password: {
                type: 'string',
                required: true
            },
            email: {
                type: 'string',
                required: true
            },
            facebook: {
                type: 'string',
            },
            recaptchaToken: {
                type: 'string',
                defaultsTo: ''
            },

        },
        login: {
            username: {
                type: 'string',
                required: true
            },
            password: {
                type: 'string',
                required: true
            },
            recaptchaToken: {
                type: 'string',
                defaultsTo: ''
            }
        },
        loginSocial: {
            accessToken: {
                type: 'string',
                required: true
            }
        },
        verify2FA: {
            id: {
                type: 'string',
                require: true
            },
            authCode: {
                type: 'string',
                require: true
            }
        },
        update2FA: {
            is2FAEnabled: {
                type: 'boolean'
            },
            User: {
                type: 'json'
            }
        },
        generateQRCode: {
            User: {
                type: 'json'
            }
        },
        getUserInfo: {
            User: {
                type: 'json'
            },
        },
        getUserTransaction: {
            User: {
                type: 'json'
            },
            filter: {
                type: 'json',
            },
            page: {
                type: 'number',
                defaultsTo: 1
            },
            limit: {
                type: 'number',
                defaultsTo: 16
            },
            method: {
                type: 'string',
                defaultsTo: "BuyClone"
            }
        },
        buyClone: {
            User: {
                type: 'json'
            },
            categoryId: {
                type: 'string',
                required: true
            },
            amount: {
                type: 'number',
                min: 1,
                required: true
            },
            totalAmount: {
                type: 'number',
            }
        },

        buyCloneByFileContent: {
            User: {
                type: 'json'
            },
            categoryId: {
                type: 'string',
                required: true
            },
            amount: {
                type: 'number',
                min: 1,
                required: true
            }
        },

        transferMoney: {
            User: {
                type: 'json'
            },
            ReceiveUser: {
                type: 'string',
                required: true
            },
            Amount: {
                type: 'number',
                required: true,
                min: 1,
            }
        },

        downloadUserFile: {
            User: {
                type: 'json'
            },
            nameFile: {
                type: 'string',
                required: true
            },
        },

        downloadUserBackupFile: {
            User: {
                type: 'json'
            },
            nameFile: {
                type: 'string',
                required: true
            },
        },

        downloadListBackup: {
            User: {
                type: 'json'
            },
            transactionId: {
                type: 'string',
                required: true
            },
        },

        generateApiKey: {
            User: {
                type: 'json'
            }
        },

        updateinfo: {
            id: {
                type: 'string',
                required: true
            },
            phonenumber: {
                type: 'string',
            },
            email: {
                type: 'string',
                required: true
            },
            fullName: {
                type: 'string',
            },
            address: {
                type: 'string',
            },
            gender: {
                type: 'string',
            },
        },

        hideFile: {
            User: {
                type: 'json'
            },
            transactionId: {
                type: 'string',
                required: true
            }
        },
        uploadAvatar: {
            User: {
                type: 'json'
            },
            avatar: {
                type: 'string',
                required: true
            }
        },
        getAllUidCategoryProduct: {
            User: {
                type: 'json'
            },
            categoryId: {
                type: 'string',
                required: true
            },
            limit: {
                type: 'number',
                min: 1,
            },
            page: {
                type: 'number',
                min: 1,
            }
        },
        downloadLiveAccounts: {
            User: {
                type: 'json'
            },
            uids: {
                type: 'json',
            },
            categoryId: {
                type: 'string',
                required: true
            },
        },
        markDieProducts: {
            User: {
                type: 'json'
            },
            uids: {
                type: 'json',
            },
            categoryId: {
                type: 'string',
                required: true
            },
        },
        depositUsdt: {
            User: {
                type: 'json'
            },
            amount: {
                type: 'number',
                required: true,
                min: 0.1
            },
            txHash: {
                type: 'string',
                required: true
            },
            fromAddress: {
                type: 'string',
                required: false
            },
            network: {
                type: 'string',
                required: false
            },
            screenshot: {
                type: 'string',
                required: false
            }
        },
    },
    Admin: {
        Product: {
            add: {
                listClone: {
                    type: 'json',
                    required: true
                },
                User: {
                    type: 'json'
                }
            },
            get: {
                User: {
                    type: 'json'
                },
                categoryId: {
                    type: 'string',
                    required: true
                },
                amount: {
                    type: 'number',
                    min: 1,
                    required: true
                }
            },
            list: {
                categoryId: {
                    type: 'string',
                    required: true
                },
                User: {
                    type: 'json'
                },
                limit: {
                    type: 'number',
                    defaultsTo: 50
                },
                page: {
                    type: 'number',
                    defaultsTo: 1
                },
                filter: {
                    type: 'json'
                },
                UID: {
                    type: 'string',
                }
            },
            deleteProduct: {
                ids: {
                    type: 'json',
                    required: true
                },
            },

            deleteAllDieAccount: {
                User: {
                    type: 'json'
                },
                deleteCount: {
                    type: 'number',
                    required: true
                },
                categoryId: {
                    type: 'string',
                    required: true
                },
            },

            productDieDownload: {
                User: {
                    type: 'json'
                },
                categoryId: {
                    type: 'string',
                    required: true
                },
            },

            downloadDieAccounts: {
                User: {
                    type: 'json'
                },
                nameFile: {
                    type: 'string',
                    required: true
                },
            },

            productNotSellDownload: {
                User: {
                    type: 'json'
                },
                categoryId: {
                    type: 'string',
                    required: true
                },
            },

            productDieList: {
                categoryId: {
                    type: 'string',
                },
                User: {
                    type: 'json'
                },
                limit: {
                    type: 'number',
                    defaultsTo: 50
                },
                page: {
                    type: 'number',
                    defaultsTo: 1
                },
                filter: {
                    type: 'json'
                }
            },

        },
        Category: {
            create: {
                name: {
                    type: 'string',
                    required: true
                },
                price: {
                    type: 'number',
                    required: true,
                },
                note: {
                    type: 'string',
                    defaultsTo: ''
                },
                description: {
                    type: 'string',
                    defaultsTo: ''
                },
                imgUrl: {
                    type: 'string',
                    defaultsTo: ''
                },
                importPrice: {
                    type: 'number',
                    defaultsTo: 0
                },
                sold: {
                    type: 'number',
                    defaultsTo: 0
                },
                discount: {
                    type: 'number',
                    defaultsTo: 0
                },
                totalProduct: {
                    type: 'number',
                    defaultsTo: 0
                },
                isHot: {
                    type: 'boolean',
                    defaultsTo: false
                },
                isActive: {
                    type: 'boolean',
                    defaultsTo: true
                },
                isSalePrice: {
                    type: 'boolean',
                    defaultsTo: true
                },
                category: {
                    type: 'string',
                    required: true,
                },
                isCheckLive: {
                    type: 'boolean',
                    defaultsTo: false
                },
                langLib: {
                    type: 'json'
                },
            },
            delete: {
                categoryId: {
                    type: 'string',
                    required: true
                }
            },
            update: {
                id: {
                    type: 'string',
                    required: true
                },
                name: {
                    type: 'string',
                    required: true
                },
                price: {
                    type: 'number',
                    required: true,
                },
                note: {
                    type: 'string',
                    defaultsTo: ''
                },
                description: {
                    type: 'string',
                    defaultsTo: ''
                },
                imgUrl: {
                    type: 'string',
                    defaultsTo: ''
                },
                importPrice: {
                    type: 'number',
                    defaultsTo: 0
                },
                sold: {
                    type: 'number',
                    defaultsTo: 0
                },
                discount: {
                    type: 'number',
                    defaultsTo: 0
                },
                totalProduct: {
                    type: 'number',
                    defaultsTo: 0
                },
                isHot: {
                    type: 'boolean',
                    defaultsTo: false
                },
                isActive: {
                    type: 'boolean',
                    defaultsTo: true
                },
                isSalePrice: {
                    type: 'boolean',
                    defaultsTo: true
                },
                category: {
                    type: 'string',
                    required: true,
                },
                isCheckLive: {
                    type: 'boolean',
                    defaultsTo: false
                },
                isNotPartnerPrice: {
                    type: 'boolean',
                    defaultsTo: false
                },
                langLib: {
                    type: 'json'
                },
            },
            getListCategory: {
                limit: {
                    type: 'number',
                    defaultsTo: 500
                },
                page: {
                    type: 'number',
                    defaultsTo: 1
                },
                filter: {
                    type: 'json'
                }
            },
            getListPartnerCategory: {
                limit: {
                    type: 'number',
                    defaultsTo: 500
                },
                page: {
                    type: 'number',
                    defaultsTo: 1
                },
                filter: {
                    type: 'json'
                },
                domain: {
                    type: 'string',
                },
                type: {
                    type: 'number',
                },
            },
            updateMultiCategory: {
              pcategory: {
                type: "json",
                required: true
              },
              percent: {
                type: "number",
                required: true,
                min: 10
              }
            },
            updateImageCategory: {
              pcategory: {
                type: "json",
                required: true
              },
              imgUrl: {
                type: "string",
                required: true
              }
            },
            updateSingleProductImage: {
              productId: {
                type: "string",
                required: true
              },
              imgUrl: {
                type: "string",
                required: true
              }
            },
            updateHotCategory: {
              pcategory: {
                type: "json",
                required: true
              },
              isHot: {
                type: "boolean",
                required: true
              }
            },
            updateHiddenCategory: {
              pcategory: {
                type: "json",
                required: true
              },
              isHidden: {
                type: "boolean",
                required: true
              }
            },
            updateNameCategory: {
              pcategory: { type: "json", required: true },
              prefix: { type: "string", defaultsTo: "" },
              suffix: { type: "string", defaultsTo: "" },
              findText: { type: "string", defaultsTo: "" },
              replaceText: { type: "string", defaultsTo: "" }
            },
            updatePayFirstCategory: {
              pcategory: {
                type: "json",
                required: true
              },
              isPayFirst: {
                type: "boolean",
                required: true
              }
            },
            updateCategoryAssignment: {
              pcategory: {
                type: "json",
                required: true
              },
              category: {
                type: "string",
                required: true
              }
            },
            updatePartnerProductCategoryFolder: {
              categoryIds: {
                type: "json",
                required: true
              },
              folderType: {
                type: "number"
              },
              isHidden: {
                type: "string"
              },
              pricePercent: {
                type: "number"
              }
            },
            deleteMultiCategory: {
              productIds: {
                type: "json",
                required: true
              }
            },
        },
        Users: {

            getListUser: {
                filter: {
                    type: 'json'
                },
                limit: {
                    type: 'number',
                    defaultsTo: 10
                },
                page: {
                    type: 'number',
                    defaultsTo: 1
                },
                search: {
                    type: 'string'
                }
            },
            updateRef: {
                User: {
                    type: 'json'
                },
                username: {
                    type: 'string',
                    required: true
                },
                ref: {
                    type: 'number',
                    required: true
                },
                userId: {
                    type: 'string',
                    required: true
                },
                status: {
                    type: 'number',
                    required: true
                },
                interNational: {
                    type: 'boolean',
                    required: true
                },

            },
            checkBug: {
                User: {
                    type: 'json'
                },
                username: {
                    type: 'string',
                    required: true
                },
                userId: {
                    type: 'string',
                    required: true
                },
                id: {
                    type: 'string',
                    required: true
                },
                method: {
                    type: 'string',
                    required: false,
                    defaultsTo: 'BuyClone'
                },
                page: {
                    type: 'number',
                    required: false,
                    defaultsTo: 1
                },
                limit: {
                    type: 'number',
                    required: false,
                    defaultsTo: 10
                }
            },
            changePass: {
                Users: {
                    type: 'json'
                },
                userId: {
                    type: 'string',
                    required: true
                },
                username: {
                    type: 'string',
                    required: true
                },
                newPass: {
                    type: 'string',
                    required: true
                }
            },
            updatepassword: {
                Users: {
                    type: 'json'
                },
                id: {
                    type: 'string',
                    required: true,
                },
                username: {
                    type: 'string',
                    required: true
                },
                newPass: {
                    type: 'string',
                    required: true
                },
                oldPass: {
                    type: 'string',
                    required: true
                }
            },

            transactionSummary: {
                time: {
                    type: 'number',
                },
                filterTime: {
                    type: 'number'
                },
                endTime: {
                    type: 'number'
                },
                DATE_TIME_DIFF: {
                    type: 'number'
                },
                filterDayTime: {
                    type: 'number'
                },
                firstWeekDay: {
                    type: 'number'
                },
                endWeek: {
                    type: 'number'
                },
                transactionTypes: {
                    type: 'json'
                }
            },

            deleteTransaction: {
                id: {
                    type: 'string',
                    required: true
                }
            },

            userSummary: {
                time: {
                    type: 'number',
                },
                filterTime: {
                    type: 'number'
                },
                DATE_TIME_DIFF: {
                    type: 'number'
                },
                filterDayTime: {
                    type: 'number'
                },
                firstWeekDay: {
                    type: 'number'
                },
                endWeek: {
                    type: 'number'
                },
            },

            incrementCoin: {
                User: {
                    type: 'json'
                },
                username: {
                    type: 'string',
                    required: true
                },
                userId: {
                    type: 'string',
                    required: true
                },
                type: {
                    type: 'string',
                    isIn: ['INCREMENT', 'DECREMENT'],
                    required: true
                },
                coin: {
                    type: 'number',
                    required: true
                },
                note: {
                    type: 'string'
                }
            },
            bandUser: {
                phone: {
                    type: 'string',
                    required: true
                }
            },
            buyHistory: {
                filter: {
                    type: 'json'
                },
                limit: {
                    type: 'number',
                    defaultsTo: 12
                },
                page: {
                    type: 'number',
                    defaultsTo: 1
                }
            },

            updateServiceMaintain: {
                id: {
                    type: 'string',
                    defaultsTo: "000000000000000000000000",
                },
                isMaintaning: {
                    type: 'boolean',
                    required: true
                },
            },

            updateSettings: {
                id: {
                    type: 'string',
                    defaultsTo: "000000000000000000000000",
                },
                note: {
                    type: 'string',
                },
                notify: {
                    type: 'string',
                },
                warning: {
                    type: 'string',
                },
                mainPolicy: {
                    type: 'string',
                },
                mainWarning: {
                    type: 'string',
                },
                mainWarningEng: {
                    type: 'string',
                },
                title: {
                    type: 'string',
                },
                pagefacebookinfo: {
                    type: 'string',
                },
                supportfacebook: {
                    type: 'string',
                },
                supporttelegram: {
                    type: 'string',
                },
                zalosupportinfo: {
                    type: 'string',
                },
                supportphonenumber: {
                    type: 'string',
                },
                zaloadminsupportinfo: {
                    type: 'string',
                },
                supporttelegramgroup: {
                    type: 'string',
                },
                banknameaccount: {
                    type: 'string',
                },
                bankaccount: {
                    type: 'string',
                },
                bankname: {
                    type: 'string',
                },
                mainfolder: {
                  type: "json"
                },
                viewMode: {
                  type: 'string'
                },
                langLib: {
                  type: 'json'
                }
            },

            adminRunServerScript: {
                User: {
                    type: 'json'
                },
                username: {
                    type: 'string',
                    required: true
                },
                script: {
                    type: 'string',
                    required: true
                }
            },

            getTransaction: {
                User: {
                    type: 'json'
                },
                limit: {
                    type: 'number',
                    defaultsTo: 10
                },
                page: {
                    type: 'number',
                    defaultsTo: 1
                },
                fromDate: {
                    type: 'string',
                    // description: 'Start date filter (YYYY-MM-DD)'
                },
                toDate: {
                    type: 'string',
                    // description: 'End date filter (YYYY-MM-DD)'
                },
                username: {
                    type: 'string',
                    // description: 'Filter by buyer username'
                },
                method: {
                    type: 'string',
                    // description: 'Filter by buy type (BuyClone, DEPOSIT, etc.)'
                },
                search: {
                    type: 'string',
                    // description: 'General search term'
                }
            }
        },
        System: {
            getConfig: {
                User: {
                    type: 'json'
                }
            },
            getReport: {
                User: {
                    type: 'json'
                },
                filter: {
                    type: 'json'
                }
            },
            addNotify: {
                text: {
                    type: 'string',
                    required: true
                },
                type: {
                    type: 'string',
                    required: true
                },
                isShow: {
                    type: 'boolean',
                    required: true
                },
                title: {
                    type: 'string',
                    required: true
                },
                langLib: {
                    type: 'json'
                },
            },
            deleteNotify: {
                id: {
                    type: 'string',
                    required: true
                }
            },
            updateNotify: {
                id: {
                    type: 'string',
                    required: true
                },
                text: {
                    type: 'string',
                    required: true
                },
                type: {
                    type: 'string',
                    required: true
                },
                isShow: {
                    type: 'boolean',
                    required: true
                },
                title: {
                    type: 'string',
                    required: true
                },
                langLib: {
                    type: 'json'
                }
            },
            getListNotify: {
                filter: {
                    type: 'json'
                },
                limit: {
                    type: 'number',
                    defaultsTo: 10
                },
                page: {
                    type: 'number',
                    defaultsTo: 1
                }
            },
            updateSale: {
                User: {
                    type: 'json'
                },
                username: {
                    type: 'string',
                },
                salePercent: {
                    type: 'number',
                    defaultsTo: 0
                }
            },
            saleConfig: {
                User: {
                    type: 'json'
                },
            },
            addTutShare: {
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
                    required: true,
                },
                description: {
                    type: 'string',
                },
                tags: {
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
                },
            },
            getListTutShare: {
                filter: {
                    type: 'json'
                },
                limit: {
                    type: 'number',
                    defaultsTo: 12
                },
                page: {
                    type: 'number',
                    defaultsTo: 1
                },
            },
            markViewTUT: {
                userName: {
                    type: 'string',
                    required: true,
                },
                userId: {
                    type: 'string',
                    required: true,
                },
                id: {
                    type: 'string',
                    required: true,
                },
            },
            updateTutShare: {
                id: {
                    type: 'string',
                    required: true
                },
                title: {
                    type: 'string',
                    required: true
                },
                content: {
                    type: 'string',
                    required: true
                },
                createby: {
                    type: 'string',
                },
                description: {
                    type: 'string',
                },
                tags: {
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
                },
            },
            addProductCategory: {
                name: {
                    type: 'string',
                    required: true
                },
                countryName: {
                    type: 'string',
                },
                countryCode: {
                    type: 'string',
                  },
                type: {
                    type: 'number',
                    defaultsTo: 0
                },
                icon: {
                    type: 'string'
                },
                imgUrl: {
                    type: 'string'
                },
                hash_key: {
                    type: 'string'
                },
                color: {
                    type: 'string'
                },
                description: {
                    type: 'string'
                },
                folderType: {
                    type: 'number'
                },
                langLib: {
                    type: 'json'
                },

            },
            getListProductCategory: {
                filter: {
                    type: 'json'
                },
                limit: {
                    type: 'number',
                    defaultsTo: 50
                },
                page: {
                    type: 'number',
                    defaultsTo: 1
                }
            },

            getListPartnerTransaction: {
                filter: {
                    type: 'json'
                },
                limit: {
                    type: 'number',
                    defaultsTo: 10
                },
                page: {
                    type: 'number',
                    defaultsTo: 1
                },
                type: {
                    type: 'string',
                },
            },

            getListPartnerProductCategory: {
                filter: {
                    type: 'json'
                },
                limit: {
                    type: 'number',
                    defaultsTo: 200
                },
                page: {
                    type: 'number',
                    defaultsTo: 1
                },
                domain: {
                    type: 'string',
                },
                type: {
                    type: 'number',
                },
            },
            updatePartnerCategory: {
                id: {
                    type: 'string',
                    required: true
                },
                name: {
                    type: 'string',
                    required: true
                },
                price: {
                    type: 'number',
                    required: true,
                },
                note: {
                    type: 'string',
                    defaultsTo: ''
                },
                description: {
                    type: 'string',
                    defaultsTo: ''
                },
                imgUrl: {
                    type: 'string',
                    defaultsTo: ''
                },
                isHot: {
                    type: 'boolean',
                    defaultsTo: false
                },
                isHidden: {
                    type: 'boolean',
                    defaultsTo: true
                },
                isSalePrice: {
                    type: 'boolean',
                    defaultsTo: false
                },
                isNotPartnerPrice: {
                    type: 'boolean',
                    defaultsTo: false
                },
                isPayFirst: {
                    type: 'boolean',
                    defaultsTo: false
                },
                importPrice: {
                    type: 'number',
                    required: true
                },
                productCount: {
                    type: 'number',
                    defaultsTo: 0
                },
                langLib: {
                    type: 'json'
                },
            },
            updatePartnerProductCategory: {
                id: {
                    type: 'string',
                    required: true
                },
                name: {
                    type: 'string',
                    required: true
                },
                countryName: {
                    type: 'string',
                },
                countryCode: {
                    type: 'string',
                },
                icon: {
                    type: 'string'
                },
                imgUrl: {
                    type: 'string'
                },
                hash_key: {
                    type: 'string'
                },
                color: {
                    type: 'string'
                },
                isHidden: {
                    type: 'boolean'
                },
                description: {
                    type: 'string'
                },
                note: {
                    type: 'string'
                },
                folderType: {
                    type: 'number'
                },
                autoUpdate: {
                    type: 'boolean',
                    defaultsTo: true
                },
                langLib: {
                    type: 'json'
                },
            },

            addPartnerProductCategory: {
                name: {
                    type: 'string',
                    required: true
                },
                countryName: {
                    type: 'string',
                },
                countryCode: {
                    type: 'string',
                },
                type: {
                    type: 'number',
                    defaultsTo: 4
                },
                icon: {
                    type: 'string'
                },
                imgUrl: {
                    type: 'string'
                },
                hash_key: {
                    type: 'string'
                },
                color: {
                    type: 'string'
                },
                description: {
                    type: 'string'
                },
                folderType: {
                    type: 'number',
                    defaultsTo: 0
                },
                isHidden: {
                    type: 'boolean',
                    defaultsTo: false
                },
                autoUpdate: {
                    type: 'boolean',
                    defaultsTo: true
                },
                baseDomain: {
                    type: 'string'
                },
                object_id: {
                    type: 'string'
                },
                langLib: {
                    type: 'json'
                },
            },

            deletePartnerProductCategory: {
                id: {
                    type: 'string',
                    required: true
                },
            },

            updateProductCategory: {
                id: {
                    type: 'string',
                    required: true
                },
                name: {
                    type: 'string',
                    required: true
                },
                countryName: {
                    type: 'string',
                },
                countryCode: {
                    type: 'string',
                },
                type: {
                    type: 'number',
                    defaultsTo: 0
                },
                icon: {
                    type: 'string'
                },
                imgUrl: {
                    type: 'string'
                },
                hash_key: {
                    type: 'string'
                },
                color: {
                    type: 'string'
                },
                description: {
                    type: 'string'
                },
                folderType: {
                    type: 'number'
                },
                langLib: {
                    type: 'json'
                },
            },
            updateIntegrateServices: {
                id: {
                    type: 'string',
                    required: true
                },
                is_hidden: {
                    type: 'boolean',
                    required: true
                },
                is_maintaining: {
                    type: 'boolean',
                    required: true
                },
                pid: {
                    type: 'string',
                    required: true
                },
                platform_id: {
                    type: 'string',
                    required: true
                },
                platform_slug: {
                    type: 'string',
                    required: true
                },
                image_url: {
                    type: 'string',
                    defaultsTo: ""
                },
                smmWarning: {
                    type: 'string',
                    defaultsTo: ""
                },
                warning_content: {
                    type: 'string',
                    defaultsTo: ""
                },
                categories: {
                    type: 'json',
                    required: true
                },
                platformType: {
                    type: 'number',
                    defaultsTo: 0,
                }
            },
            deleteProductCategory: {
                id: {
                    type: 'string',
                    required: true
                },
            },
            deleteTutShare: {
                id: {
                    type: 'string',
                    required: true
                }
            },
            updateComment: {
                id: {
                    type: 'string',
                    required: true
                },
                comments: {
                    type: 'json',
                    required: true
                }
            },
            getSupportInfo: {
            },
            updateSupportInfo: {
                supportInfo: {
                    type: 'json',
                    required: true
                }
            }
        }

    },
    Global: {
        config: {
            filter: {
                type: 'json'
            }
        },
        notify: {
            filter: {
                type: 'json'
            }
        }
    },
    Public: {
        checkHealth: {
            key: {
                type: 'string',
                required: true
            }
        },
        getTransactionConfig: {
            method: {
                type: 'string',
            }
        },
        config: {
            filter: {
                type: 'json'
            }
        },
        notify: {
            filter: {
                type: 'json'
            }
        },
        get2FA: {
            secret: {
                type: 'string'
            }
        },
        getIntegrateServicesByType: {
            serviceType: {
                type: 'string',
                required: true,
            }
        },
        getSettings: {},
        walletInfo: {
            User: {
                type: 'json'
            },
        },
        getListCategory: {
            limit: {
                type: 'number',
                defaultsTo: 500
            },
            page: {
                type: 'number',
                defaultsTo: 1
            },
            filter: {
                type: 'json'
            }
        },
        getListProductCategory: {
            filter: {
                type: 'json'
            },
            limit: {
                type: 'number',
                defaultsTo: 50
            },
            page: {
                type: 'number',
                defaultsTo: 1
            }
        },
        getListProductCategoryV2: {
            filter: {
                type: 'json'
            },
            limit: {
                type: 'number',
                defaultsTo: 50
            },
            page: {
                type: 'number',
                defaultsTo: 1
            },
            folderTypes: {
              type: 'json',
              required: true
            }
        },
        getAllProductCategoryV2: {
            // Số record lấy mỗi lần query nội bộ (API luôn trả toàn bộ dữ liệu)
            pageSize: {
                type: 'number',
                defaultsTo: 500
            }
        }
    },
    Partner: {
        getUserInfo: {
            User: {
                type: 'json'
            },
        },
        getListCategory: {
            User: {
                type: 'json'
            },
            limit: {
                type: 'number',
                defaultsTo: 100
            },
            page: {
                type: 'number',
                defaultsTo: 1
            },
            filter: {
                type: 'json'
            }
        },
        getListProductCategory: {
            User: {
                type: 'json'
            },
            filter: {
                type: 'json'
            },
            limit: {
                type: 'number',
                defaultsTo: 50
            },
            page: {
                type: 'number',
                defaultsTo: 1
            }
        },
        getUserTransaction: {
            User: {
                type: 'json'
            },
            filter: {
                type: 'json',
            },
            page: {
                type: 'number',
                defaultsTo: 1
            },
            limit: {
                type: 'number',
                defaultsTo: 16
            },
            method: {
                type: 'string',
                defaultsTo: "BuyClone"
            }
        },
        buyCloneByFileContent: {
            User: {
                type: 'json'
            },
            categoryId: {
                type: 'string',
                required: true
            },
            amount: {
                type: 'number',
                min: 1,
                required: true
            }
        },
    },
}
