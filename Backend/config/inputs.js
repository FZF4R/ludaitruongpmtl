module.exports.inputs = {
    "Users": {
        "login": {
            "username": {
                "type": "string",
                "required": true
            },
            "password": {
                "type": "string",
                "required": true
            },
            "recaptchaToken": {
                "type": "string",
                "defaultsTo": ""
            }
        },
        "loginSocial": {
            "accessToken": {
                "type": "string",
                "required": true
            }
        },
        "register": {
            "username": {
                "type": "string",
                "required": true
            },
            "password": {
                "type": "string",
                "required": true
            },
            "email": {
                "type": "string",
                "required": true
            },
            "facebook": {
                "type": "string"
            },
            "recaptchaToken": {
                "type": "string",
                "defaultsTo": ""
            }
        },
        "verify2FA": {
            "id": {
                "type": "string",
                "require": true
            },
            "authCode": {
                "type": "string",
                "require": true
            }
        },
        "update2FA": {
            "is2FAEnabled": {
                "type": "boolean"
            },
            "User": {
                "type": "json"
            }
        },
        "generateQRCode": {
            "User": {
                "type": "json"
            }
        },
        "getUserInfo": {
            "User": {
                "type": "json"
            }
        },
        "updateinfo": {
            "id": {
                "type": "string",
                "required": true
            },
            "phonenumber": {
                "type": "string"
            },
            "email": {
                "type": "string",
                "required": true
            },
            "fullName": {
                "type": "string"
            },
            "address": {
                "type": "string"
            },
            "gender": {
                "type": "string"
            }
        },
        "uploadAvatar": {
            "User": {
                "type": "json"
            },
            "avatar": {
                "type": "string",
                "required": true
            }
        },
        "getProfile": {
            "User": {
                "type": "json"
            }
        },
        "saveProfile": {
            "User": {
                "type": "json"
            },
            "fullName": {
                "type": "string",
                "required": true
            },
            "dharmaName": {
                "type": "string",
                "defaultsTo": ""
            },
            "nickname": {
                "type": "string",
                "defaultsTo": ""
            },
            "hometown": {
                "type": "json",
                "defaultsTo": {}
            },
            "survey": {
                "type": "json",
                "defaultsTo": {}
            }
        }
    },
    "Admin": {
        "Users": {
            "getListUser": {
                "filter": {
                    "type": "json"
                },
                "limit": {
                    "type": "number",
                    "defaultsTo": 10
                },
                "page": {
                    "type": "number",
                    "defaultsTo": 1
                },
                "search": {
                    "type": "string"
                }
            },
            "changePass": {
                "Users": {
                    "type": "json"
                },
                "userId": {
                    "type": "string",
                    "required": true
                },
                "username": {
                    "type": "string",
                    "required": true
                },
                "newPass": {
                    "type": "string",
                    "required": true
                }
            },
            "updatepassword": {
                "Users": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                },
                "username": {
                    "type": "string",
                    "required": true
                },
                "newPass": {
                    "type": "string",
                    "required": true
                },
                "oldPass": {
                    "type": "string",
                    "required": true
                }
            },
            "updateSettings": {
                "id": {
                    "type": "string",
                    "defaultsTo": "000000000000000000000000"
                },
                "note": {
                    "type": "string"
                },
                "notify": {
                    "type": "json"
                },
                "warning": {
                    "type": "string"
                },
                "mainPolicy": {
                    "type": "string"
                },
                "mainWarning": {
                    "type": "string"
                },
                "mainWarningEng": {
                    "type": "string"
                },
                "title": {
                    "type": "string"
                },
                "pagefacebookinfo": {
                    "type": "string"
                },
                "supportfacebook": {
                    "type": "string"
                },
                "supporttelegram": {
                    "type": "string"
                },
                "zalosupportinfo": {
                    "type": "string"
                },
                "supportphonenumber": {
                    "type": "string"
                },
                "zaloadminsupportinfo": {
                    "type": "string"
                },
                "supporttelegramgroup": {
                    "type": "string"
                },
                "banknameaccount": {
                    "type": "string"
                },
                "bankaccount": {
                    "type": "string"
                },
                "bankname": {
                    "type": "string"
                },
                "mainfolder": {
                    "type": "json"
                },
                "viewMode": {
                    "type": "string"
                },
                "theme": {
                    "type": "json"
                },
                "themeDark": {
                    "type": "json"
                },
                "langLib": {
                    "type": "json"
                }
            },
            "updateServiceMaintain": {
                "id": {
                    "type": "string",
                    "defaultsTo": "000000000000000000000000"
                },
                "isMaintaning": {
                    "type": "boolean",
                    "required": true
                }
            },
            "getUserDetail": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                }
            },
            "updateUser": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                },
                "email": {
                    "type": "string"
                },
                "fullName": {
                    "type": "string"
                },
                "role": {
                    "type": "string"
                },
                "reason": {
                    "type": "string",
                    "defaultsTo": ""
                }
            }
        },
        "SiteText": {
            "updateText": {
                "User": {
                    "type": "json"
                },
                "lang": {
                    "type": "string",
                    "required": true
                },
                "key": {
                    "type": "string",
                    "required": true
                },
                "value": {
                    "type": "string",
                    "defaultsTo": "",
                    "description": "Chuoi rong = xoa ban ghi de, quay ve chu mac dinh cua FrontEnd"
                }
            }
        },
        "Roles": {
            "getPermissions": {
                "User": {
                    "type": "json"
                }
            },
            "updatePermissions": {
                "User": {
                    "type": "json"
                },
                "role": {
                    "type": "string",
                    "required": true
                },
                "permissions": {
                    "type": "json",
                    "required": true
                },
                "reason": {
                    "type": "string",
                    "defaultsTo": ""
                }
            },
            "resetPermissions": {
                "User": {
                    "type": "json"
                },
                "role": {
                    "type": "string",
                    "required": true
                },
                "reason": {
                    "type": "string",
                    "defaultsTo": ""
                }
            }
        },
        "System": {
            "addNotify": {
                "text": {
                    "type": "string",
                    "required": true
                },
                "type": {
                    "type": "string",
                    "required": true
                },
                "isShow": {
                    "type": "boolean",
                    "required": true
                },
                "title": {
                    "type": "string",
                    "required": true
                },
                "langLib": {
                    "type": "json"
                }
            },
            "getListNotify": {
                "filter": {
                    "type": "json"
                },
                "limit": {
                    "type": "number",
                    "defaultsTo": 10
                },
                "page": {
                    "type": "number",
                    "defaultsTo": 1
                }
            },
            "updateNotify": {
                "id": {
                    "type": "string",
                    "required": true
                },
                "text": {
                    "type": "string",
                    "required": true
                },
                "type": {
                    "type": "string",
                    "required": true
                },
                "isShow": {
                    "type": "boolean",
                    "required": true
                },
                "title": {
                    "type": "string",
                    "required": true
                },
                "langLib": {
                    "type": "json"
                }
            },
            "deleteNotify": {
                "id": {
                    "type": "string",
                    "required": true
                }
            },
            "getSupportInfo": {},
            "updateSupportInfo": {
                "supportInfo": {
                    "type": "json",
                    "required": true
                }
            },
            "getSettings": {
                "User": {
                    "type": "json"
                }
            },
            "addSettingNotify": {
                "User": {
                    "type": "json"
                },
                "text": {
                    "type": "string",
                    "required": true
                }
            },
            "updateSettingNotify": {
                "User": {
                    "type": "json"
                },
                "index": {
                    "type": "number",
                    "required": true
                },
                "text": {
                    "type": "string",
                    "required": true
                }
            },
            "deleteSettingNotify": {
                "User": {
                    "type": "json"
                },
                "index": {
                    "type": "number",
                    "required": true
                }
            }
        },
        "Content": {
            "listContent": {
                "User": {
                    "type": "json"
                },
                "type": {
                    "type": "string"
                },
                "status": {
                    "type": "string"
                },
                "category": {
                    "type": "string"
                },
                "authorId": {
                    "type": "string"
                },
                "q": {
                    "type": "string"
                },
                "page": {
                    "type": "number",
                    "defaultsTo": 1
                },
                "limit": {
                    "type": "number",
                    "defaultsTo": 20
                }
            },
            "getContent": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                }
            },
            "createContent": {
                "User": {
                    "type": "json"
                },
                "type": {
                    "type": "string",
                    "required": true
                },
                "slug": {
                    "type": "string"
                },
                "title": {
                    "type": "string",
                    "required": true
                },
                "summary": {
                    "type": "string"
                },
                "coverUrl": {
                    "type": "string"
                },
                "bodyHtml": {
                    "type": "string"
                },
                "chapters": {
                    "type": "json"
                },
                "media": {
                    "type": "json"
                },
                "author": {
                    "type": "json"
                },
                "source": {
                    "type": "json"
                },
                "categories": {
                    "type": "json"
                },
                "tags": {
                    "type": "json"
                },
                "publishedAt": {
                    "type": "string"
                },
                "readingMinutes": {
                    "type": "number"
                },
                "seo": {
                    "type": "json"
                }
            },
            "updateContent": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                },
                "type": {
                    "type": "string"
                },
                "slug": {
                    "type": "string"
                },
                "title": {
                    "type": "string"
                },
                "summary": {
                    "type": "string"
                },
                "coverUrl": {
                    "type": "string"
                },
                "bodyHtml": {
                    "type": "string"
                },
                "chapters": {
                    "type": "json"
                },
                "media": {
                    "type": "json"
                },
                "author": {
                    "type": "json"
                },
                "source": {
                    "type": "json"
                },
                "categories": {
                    "type": "json"
                },
                "tags": {
                    "type": "json"
                },
                "publishedAt": {
                    "type": "string"
                },
                "readingMinutes": {
                    "type": "number"
                },
                "seo": {
                    "type": "json"
                }
            },
            "setStatus": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                },
                "status": {
                    "type": "string",
                    "required": true
                }
            },
            "deleteContent": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                }
            },
            "listCategories": {
                "User": {
                    "type": "json"
                }
            }
        }
    },
    "Public": {
        "checkHealth": {
            "key": {
                "type": "string",
                "required": true
            }
        },
        "notify": {
            "filter": {
                "type": "json"
            }
        },
        "get2FA": {
            "secret": {
                "type": "string"
            }
        },
        "getSettings": {},
        "SiteText": {
            "getTexts": {
                "lang": {
                    "type": "string",
                    "defaultsTo": "vi"
                }
            }
        },
        "Content": {
            "listContent": {
                "type": {
                    "type": "string",
                    "defaultsTo": "",
                    "description": "Mot hoac nhieu loai, ngan cach bang dau phay: article,blog"
                },
                "category": {
                    "type": "string",
                    "defaultsTo": ""
                },
                "q": {
                    "type": "string",
                    "defaultsTo": ""
                },
                "page": {
                    "type": "number",
                    "defaultsTo": 1,
                    "min": 1
                },
                "limit": {
                    "type": "number",
                    "defaultsTo": 12,
                    "min": 1,
                    "max": 50
                }
            },
            "search": {
                "q": {
                    "type": "string",
                    "defaultsTo": ""
                },
                "page": {
                    "type": "number",
                    "defaultsTo": 1,
                    "min": 1
                },
                "limit": {
                    "type": "number",
                    "defaultsTo": 12,
                    "min": 1,
                    "max": 50
                }
            },
            "getContentBySlug": {
                "slug": {
                    "type": "string",
                    "required": true
                }
            },
            "categoryTree": {},
            "calendar": {
                "month": {
                    "type": "number",
                    "defaultsTo": 0,
                    "min": 0,
                    "max": 12
                }
            },
            "slugs": {}
        }
    }
};
