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
        "Content": {
            "listMine": {
                "User": {
                    "type": "json"
                },
                "status": {
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
                    "defaultsTo": 20,
                    "min": 1,
                    "max": 50
                }
            },
            "getMine": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                }
            },
            "saveMine": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string"
                },
                "type": {
                    "type": "string",
                    "defaultsTo": "article"
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
                "tags": {
                    "type": "json"
                },
                "category": {
                    "type": "string"
                },
                "libraryKind": {
                    "type": "string"
                },
                "gallery": {
                    "type": "json"
                },
                "media": {
                    "type": "json"
                },
                "submit": {
                    "type": "boolean",
                    "defaultsTo": false
                }
            },
            "deleteMine": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                }
            },
            "acceptProposal": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                }
            },
            "rejectProposal": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                },
                "reason": {
                    "type": "string",
                    "defaultsTo": ""
                }
            }
        },
        "Media": {
            "upload": {
                "User": {
                    "type": "json"
                },
                "file": {
                    "type": "string",
                    "required": true
                },
                "name": {
                    "type": "string",
                    "defaultsTo": ""
                }
            }
        },
        "Merit": {
            "checkin": {
                "User": {
                    "type": "json"
                }
            },
            "getStats": {
                "User": {
                    "type": "json"
                }
            },
            "getDays": {
                "User": {
                    "type": "json"
                },
                "from": {
                    "type": "string",
                    "defaultsTo": ""
                },
                "to": {
                    "type": "string",
                    "defaultsTo": ""
                }
            }
        },
        "Practice": {
            "startSession": {
                "User": {
                    "type": "json"
                },
                "type": {
                    "type": "string",
                    "required": true
                }
            },
            "listPresets": {
                "User": {
                    "type": "json"
                }
            },
            "savePreset": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string"
                },
                "name": {
                    "type": "string"
                },
                "config": {
                    "type": "json"
                },
                "used": {
                    "type": "boolean",
                    "defaultsTo": false
                }
            },
            "deletePreset": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                }
            },
            "addLog": {
                "User": {
                    "type": "json"
                },
                "sessionId": {
                    "type": "string",
                    "defaultsTo": "",
                    "description": "Phien do may chu mo (bat buoc voi thien, go-mo, chuoi-hat)"
                },
                "type": {
                    "type": "string",
                    "required": true
                },
                "amount": {
                    "type": "number",
                    "required": true
                },
                "note": {
                    "type": "string",
                    "defaultsTo": ""
                }
            },
            "getStats": {
                "User": {
                    "type": "json"
                }
            }
        },
        "Prayer": {
            "listMine": {
                "User": {
                    "type": "json"
                },
                "page": {
                    "type": "number",
                    "defaultsTo": 1,
                    "min": 1
                },
                "limit": {
                    "type": "number",
                    "defaultsTo": 10,
                    "min": 1,
                    "max": 50
                },
                "kind": {
                    "type": "string",
                    "defaultsTo": ""
                }
            },
            "addPrayer": {
                "User": {
                    "type": "json"
                },
                "kind": {
                    "type": "string",
                    "required": true
                },
                "forName": {
                    "type": "string",
                    "defaultsTo": ""
                },
                "body": {
                    "type": "string",
                    "required": true
                },
                "anonymous": {
                    "type": "boolean",
                    "defaultsTo": false
                }
            },
            "deletePrayer": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                }
            }
        },
        "Notification": {
            "listNotifications": {
                "User": {
                    "type": "json"
                },
                "limit": {
                    "type": "number",
                    "defaultsTo": 20,
                    "min": 1,
                    "max": 50
                },
                "onlyCount": {
                    "type": "boolean",
                    "defaultsTo": false
                }
            },
            "markRead": {
                "User": {
                    "type": "json"
                },
                "ids": {
                    "type": "json",
                    "defaultsTo": []
                }
            }
        },
        "Comment": {
            "addComment": {
                "User": {
                    "type": "json"
                },
                "slug": {
                    "type": "string",
                    "required": true
                },
                "body": {
                    "type": "string",
                    "required": true
                },
                "parentId": {
                    "type": "string",
                    "defaultsTo": "",
                    "description": "Tra loi binh luan nao (mot cap)"
                }
            },
            "deleteComment": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                }
            },
            "getDeleted": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                }
            },
            "reportComment": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                },
                "reason": {
                    "type": "string",
                    "defaultsTo": ""
                }
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
                "supportemail": {
                    "type": "string",
                    "maxLength": 120
                },
                "supporttiktok": {
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
                "articleLayout": {
                    "type": "string",
                    "isIn": ["card", "list"]
                },
                "practiceImages": {
                    "type": "json"
                },
                "libraryImages": {
                    "type": "json"
                },
                "libraryOrder": {
                    "type": "json"
                },
                "aboutHtml": {
                    "type": "json"
                },
                "bannedWords": {
                    "type": "json"
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
        "Approval": {
            "listReports": {
                "User": {
                    "type": "json"
                },
                "page": {
                    "type": "number",
                    "defaultsTo": 1,
                    "min": 1
                }
            },
            "handleReport": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                },
                "action": {
                    "type": "string",
                    "required": true
                }
            },
            "listPending": {
                "User": {
                    "type": "json"
                },
                "type": {
                    "type": "string",
                    "defaultsTo": "comment"
                },
                "page": {
                    "type": "number",
                    "defaultsTo": 1,
                    "min": 1
                }
            },
            "approve": {
                "User": {
                    "type": "json"
                },
                "type": {
                    "type": "string",
                    "required": true
                },
                "id": {
                    "type": "string",
                    "required": true
                }
            },
            "reject": {
                "User": {
                    "type": "json"
                },
                "type": {
                    "type": "string",
                    "required": true
                },
                "id": {
                    "type": "string",
                    "required": true
                }
            }
        },
        "Broadcast": {
            "send": {
                "User": {
                    "type": "json"
                },
                "title": {
                    "type": "string",
                    "required": true
                },
                "body": {
                    "type": "string",
                    "defaultsTo": ""
                },
                "link": {
                    "type": "string",
                    "defaultsTo": ""
                }
            },
            "list": {
                "User": {
                    "type": "json"
                }
            }
        },
        "DayEvent": {
            "saveEvent": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string"
                },
                "date": {
                    "type": "string",
                    "required": true
                },
                "title": {
                    "type": "string",
                    "required": true
                },
                "imageUrl": {
                    "type": "string",
                    "defaultsTo": ""
                },
                "body": {
                    "type": "string",
                    "defaultsTo": ""
                }
            },
            "deleteEvent": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                }
            }
        },
        "Badge": {
            "getBadges": {
                "User": {
                    "type": "json"
                }
            }
        },
        "UserActivity": {
            "getActivity": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                },
                "commentPage": {
                    "type": "number",
                    "defaultsTo": 1
                }
            }
        },
        "BannedWords": {
            "getDefault": {
                "User": {
                    "type": "json"
                }
            },
            "saveDefault": {
                "User": {
                    "type": "json"
                },
                "content": {
                    "type": "string",
                    "required": true
                }
            }
        },
        "Merit": {
            "getMerit": {
                "User": {
                    "type": "json"
                }
            },
            "saveRules": {
                "User": {
                    "type": "json"
                },
                "rules": {
                    "type": "json",
                    "required": true
                }
            },
            "saveGreetings": {
                "User": {
                    "type": "json"
                },
                "greetings": {
                    "type": "json",
                    "required": true
                }
            },
            "saveDonate": {
                "User": {
                    "type": "json"
                },
                "title": {
                    "type": "string"
                },
                "description": {
                    "type": "string"
                },
                "accountName": {
                    "type": "string"
                },
                "accountNumber": {
                    "type": "string"
                },
                "bank": {
                    "type": "string"
                },
                "link": {
                    "type": "string"
                },
                "qr": {
                    "type": "string",
                    "defaultsTo": ""
                }
            }
        },
        "Sound": {
            "listAll": {
                "User": {
                    "type": "json"
                }
            },
            "addSound": {
                "User": {
                    "type": "json"
                },
                "category": {
                    "type": "string",
                    "required": true
                },
                "kind": {
                    "type": "string",
                    "required": true
                },
                "title": {
                    "type": "string",
                    "required": true
                },
                "file": {
                    "type": "string",
                    "defaultsTo": "",
                    "description": "data:audio/...;base64,... (tai tep len)"
                },
                "url": {
                    "type": "string",
                    "defaultsTo": "",
                    "description": "Link ngoai (neu khong tai tep)"
                },
                "loop": {
                    "type": "boolean",
                    "defaultsTo": false
                }
            },
            "updateSound": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                },
                "category": {
                    "type": "string"
                },
                "kind": {
                    "type": "string"
                },
                "title": {
                    "type": "string"
                },
                "url": {
                    "type": "string"
                },
                "active": {
                    "type": "boolean"
                },
                "loop": {
                    "type": "boolean"
                }
            },
            "deleteSound": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                }
            },
            "reorderSounds": {
                "User": {
                    "type": "json"
                },
                "ids": {
                    "type": "json",
                    "required": true
                }
            }
        },
        "Prayer": {
            "setFeatured": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                },
                "featured": {
                    "type": "boolean",
                    "required": true
                }
            }
        },
        "Feedback": {
            "listFeedback": {
                "User": {
                    "type": "json"
                },
                "status": {
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
                    "defaultsTo": 10,
                    "min": 1,
                    "max": 50
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
            }
        },
        "Moderation": {
            "listFlagged": {
                "User": {
                    "type": "json"
                },
                "slug": {
                    "type": "string",
                    "required": true
                }
            },
            "deleteComment": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                }
            },
            "userInfo": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                }
            },
            "warnUser": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                },
                "reason": {
                    "type": "string",
                    "defaultsTo": ""
                }
            },
            "unwarnUser": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                },
                "reason": {
                    "type": "string",
                    "defaultsTo": ""
                }
            },
            "banUser": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                },
                "reason": {
                    "type": "string",
                    "defaultsTo": ""
                }
            },
            "unbanUser": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                },
                "reason": {
                    "type": "string",
                    "defaultsTo": ""
                }
            }
        },
        "HeroImage": {
            "addImage": {
                "User": {
                    "type": "json"
                },
                "group": {
                    "type": "string",
                    "defaultsTo": "hero",
                    "description": "hero = anh bia trang chu, prayer = anh the loi nguyen"
                },
                "image": {
                    "type": "string",
                    "required": true,
                    "description": "data:image/jpeg|png|webp;base64,..."
                },
                "width": {
                    "type": "number",
                    "defaultsTo": 0
                },
                "height": {
                    "type": "number",
                    "defaultsTo": 0
                },
                "alt": {
                    "type": "string",
                    "defaultsTo": ""
                }
            },
            "deleteImage": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                }
            },
            "reorderImages": {
                "User": {
                    "type": "json"
                },
                "ids": {
                    "type": "json",
                    "required": true
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
                    "description": "Xoa mot cau (giu cho tuong thich)"
                },
                "indexes": {
                    "type": "json",
                    "description": "Xoa nhieu cau mot lan: mang chi so"
                }
            }
        },
        "Content": {
            "listContent": {
                "User": {
                    "type": "json"
                },
                "sort": {
                    "type": "string",
                    "defaultsTo": "updated",
                    "description": "updated | newest | oldest | views | title"
                },
                "pendingEdit": {
                    "type": "boolean",
                    "defaultsTo": false,
                    "description": "Chi bai dang co de xuat sua cho tac gia"
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
                "translator": {
                    "type": "json",
                    "description": "Dich gia kinh sach: { userId } hoac { name, dharmaName }"
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
                },
                "libraryKind": {
                    "type": "string"
                },
                "gallery": {
                    "type": "json"
                }
            },
            "updateContent": {
                "User": {
                    "type": "json"
                },
                "editNote": {
                    "type": "string",
                    "description": "Loi nhan kem de xuat sua bai cua nguoi dung"
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
                "translator": {
                    "type": "json",
                    "description": "Dich gia kinh sach: { userId } hoac { name, dharmaName }"
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
                },
                "libraryKind": {
                    "type": "string"
                },
                "gallery": {
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
                },
                "note": {
                    "type": "string",
                    "defaultsTo": "",
                    "description": "Ly do khi tra bai ve nhap (gui cho tac gia)"
                }
            },
            "getHistory": {
                "User": {
                    "type": "json"
                },
                "id": {
                    "type": "string",
                    "required": true
                }
            },
            "searchPeople": {
                "User": {
                    "type": "json"
                },
                "q": {
                    "type": "string",
                    "defaultsTo": ""
                }
            },
            "getRevision": {
                "User": {
                    "type": "json"
                },
                "logId": {
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
        "getAbout": {
            "lang": {
                "type": "string",
                "defaultsTo": "vi"
            }
        },
        "DayEvent": {
            "listEvents": {
                "from": {
                    "type": "string",
                    "defaultsTo": ""
                },
                "to": {
                    "type": "string",
                    "defaultsTo": ""
                }
            }
        },
        "Sound": {
            "listSounds": {
                "category": {
                    "type": "string",
                    "defaultsTo": ""
                }
            }
        },
        "Feedback": {
            "sendFeedback": {
                "kind": {
                    "type": "string",
                    "defaultsTo": "gop-y"
                },
                "name": {
                    "type": "string",
                    "defaultsTo": ""
                },
                "contact": {
                    "type": "string",
                    "defaultsTo": ""
                },
                "body": {
                    "type": "string",
                    "required": true
                },
                "website": {
                    "type": "string",
                    "defaultsTo": "",
                    "description": "O bay chong bot - nguoi that de trong"
                },
                "anonymous": {
                    "type": "boolean",
                    "defaultsTo": false,
                    "description": "Hien an danh, van luu thong tin nguoi gui cho quan tri"
                }
            }
        },
        "Prayer": {
            "listPrayers": {
                "page": {
                    "type": "number",
                    "defaultsTo": 1,
                    "min": 1
                },
                "limit": {
                    "type": "number",
                    "defaultsTo": 10,
                    "min": 1,
                    "max": 50
                },
                "kind": {
                    "type": "string",
                    "defaultsTo": ""
                }
            }
        },
        "Comment": {
            "listComments": {
                "slug": {
                    "type": "string",
                    "required": true
                },
                "page": {
                    "type": "number",
                    "defaultsTo": 1,
                    "min": 1
                },
                "limit": {
                    "type": "number",
                    "defaultsTo": 20,
                    "min": 1,
                    "max": 50
                }
            }
        },
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
                "libraryKind": {
                    "type": "string",
                    "defaultsTo": "",
                    "description": "Loc danh muc thu vien: anh | review | bo-tat | nhac-thien | audio-kinh"
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
                },
                "sort": {
                    "type": "string",
                    "isIn": ["newest", "popular"],
                    "defaultsTo": "newest"
                }
            },
            "relatedContent": {
                "slug": {
                    "type": "string",
                    "required": true
                },
                "limit": {
                    "type": "number",
                    "defaultsTo": 3,
                    "min": 1,
                    "max": 12
                }
            },
            "addView": {
                "slug": {
                    "type": "string",
                    "required": true
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
