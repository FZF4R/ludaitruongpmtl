/**
 * notification.ru.js
 *
 * Bản dịch thông báo trả về cho client, cùng cấu trúc với config/notification.js.
 * responseToClient.js đọc file này theo ngôn ngữ của request (header x-language).
 */

module.exports.notificationRu = {
    FacebookServices: {
        loginError: {
            message: "Ошибка входа"
        },
        serviceNotFound: {
            message: "Не удалось загрузить сервисы"
        },
        userNotValid: {
            message: "Недопустимый пользователь"
        },
        ServiceNotValid: {
            message: "Выбранная услуга недействительна"
        },
        ServiceTokenNotValid: {
            message: "Недействительный токен… Обратитесь к администратору для обновления"
        }
    },
    GlobalNotifications: {
        success: {
            message: "Успешно"
        },
        error: {
            message: "Произошла ошибка"
        },
        emptyMessage: {
            message: ""
        },
        successSignUp: {
            message: "Регистрация выполнена"
        },
        successRemove: {
            message: "Запись удалена"
        },
        invalidInputParam: {
            message: "Введены недопустимые данные"
        },
        errorWhileProcess: {
            message: "Произошла ошибка, попробуйте ещё раз!"
        },
        CryptKeyInvalid: {
            message: "Неверный ключ шифрования, войдите заново!"
        },
        invalidSig: {
            message: "Недействительная подпись!"
        },
        permisionDenined: {
            message: "Доступ запрещён"
        }
    },
    Users: {
        notHaveTransaction: {
            message: "Транзакций пока нет"
        },
        downloadBackup: {
            message: "Резервная копия загружена"
        },
        chargeSuccess: {
            message: "Баланс пополнен"
        },
        usernameAlreadyInUse: {
            message: "Этот аккаунт уже занят"
        },
        submitUrlSuccess: {
            message: "Ссылка Facebook подтверждена"
        },
        addRefFailed: {
            message: "Не удалось изменить эти данные"
        },
        addRefSuccess: {
            message: "Реферал добавлен"
        },
        cantDetectFacebook: {
            message: "Не удалось подтвердить ссылку Facebook"
        },
        needUpdateUid: {
            message: "Необходимо подтвердить ссылку Facebook"
        },
        userBanned: {
            message: "Пользователь заблокирован"
        },
        fbIdAlreadyInUse: {
            message: "Этот FB ID уже занят"
        },
        registerSucess: {
            message: "Регистрация выполнена"
        },
        registerInvalid: {
            message: "Недопустимые данные аккаунта"
        },
        loginInvalid: {
            message: "Недопустимые данные аккаунта"
        },
        registerInvalidCharacter: {
            message: "Имя аккаунта может содержать только буквы и цифры"
        },
        captchaRequired: {
            message: "Подтвердите, что вы не робот"
        },
        captchaInvalid: {
            message: "Проверка капчи не пройдена, попробуйте ещё раз"
        },
        oauthNotConfigured: {
            message: "Вход через соцсети недоступен"
        },
        oauthTokenInvalid: {
            message: "Не удалось войти через соцсеть, попробуйте ещё раз"
        },
        oauthUsernameConflict: {
            message: "Не удалось создать имя аккаунта, зарегистрируйтесь вручную"
        },
        wrongPassword: {
            message: "Неверный пароль"
        },
        userNotExits: {
            message: "Аккаунт не зарегистрирован"
        },
        userNotExitsFilter: {
            message: "Пользователь не найден"
        },
        loginSucess: {
            message: "Вход выполнен"
        },
        verifySucess: {
            message: "2FA подтверждена"
        },
        chargingProcessing: {
            message: "Запрос на пополнение получен и обрабатывается"
        },
        chargingError: {
            message: "Не удалось пополнить баланс"
        },
        UserNotValid: {
            message: "Недопустимый получатель"
        },
        NotEnoughMoneyToTransfer: {
            message: "Недостаточно средств"
        },
        NotValidAmount: {
            message: "Недопустимая сумма перевода"
        },
        AuthPassChangeNotValid: {
            message: "Недопустимый пароль"
        },
        NotValidPermission: {
            message: "Нет прав на выполнение запроса"
        }
    },
    Category: {
        createSuccess: {
            message: "Категория создана"
        },
        deleteSuccess: {
            message: "Категория удалена"
        },
        updateSuccess: {
            message: "Категория обновлена"
        },
        exitsCategory: {
            message: "Такая категория уже существует"
        },
        noDeleteCategory: {
            message: "Эту категорию нельзя удалить"
        },
        notFoundCategory: {
            message: "Категория не найдена"
        }
    },
    Group: {
        createSuccess: {
            message: "Группа создана"
        },
        tranferSuccess: {
            message: "Перенос в группу выполнен"
        },
        limitedUser: {
            message: "Группа заполнена, присоединиться нельзя"
        },
        updateSuccess: {
            message: "Обновлено"
        },
        cantJoinDuplicate: {
            message: "Вы не можете присоединиться к этой группе"
        },
        groupJoined: {
            message: "Вы уже в этой группе"
        },
        groupUnjoined: {
            message: "Вы не состоите в этой группе"
        },
        userUnjoined: {
            message: "Пользователь не состоит в группе"
        },
        groupNotExits: {
            message: "Группа не существует или у вас нет доступа"
        },
        notEnoughCoin: {
            message: "Недостаточно средств, пополните баланс"
        },
        invalidCategory: {
            message: "Недопустимый товар"
        },
        renewSuccess: {
            message: "Продление выполнено"
        },
        notRoll: {
            message: "Вы ещё не отметились"
        },
        Rolled: {
            message: "Вы уже отметились"
        },
        rollSuccess: {
            message: "Отметка выполнена"
        },
        unRollSuccess: {
            message: "Отметка отменена"
        },
        removeSuccess: {
            message: "Группа удалена"
        },
        addLinkSuccess: {
            message: "Ссылка добавлена"
        },
        uidDie: {
            message: "UID недоступен"
        },
        removeLinkSuccess: {
            message: "Ссылка удалена"
        },
        resetRollSuccess: {
            message: "Отметки сброшены"
        },
        deleteGroup: {
            message: "Группа удалена"
        }
    },
    Posts: {
        createSuccess: {
            message: "Публикация создана"
        },
        notFoundPost: {
            message: "Публикация не найдена"
        },
        updateSuccess: {
            message: "Обновлено"
        }
    },
    Comments: {
        createCommentSuccess: {
            message: "Комментарий добавлен"
        }
    },
    News: {
        createSuccess: {
            message: "Новость добавлена"
        }
    },
    Clone: {
        maitainingSystem: {
            message: "Сервер обновляется. Повторите попытку позже…"
        },
        notPermissionAccess: {
            message: "Нет прав на доступ к этим данным"
        },
        notValidTimeout: {
            message: "Подождите 5 минут перед проверкой"
        },
        errorAddress: {
            message: "Не удалось загрузить адрес кошелька… Обратитесь к администратору для пополнения"
        },
        soldOutClone: {
            message: "Недостаточно Clone в наличии"
        },
        soldCloneSuccess: {
            message: "Покупка выполнена"
        },
        delCloneSuccess: {
            message: "Файл удалён"
        },
        uploadSuccess: {
            message: "Аккаунт добавлен"
        }
    },
    Product: {
        existedProduct: {
            message: "Товар с таким UID уже существует"
        },
        AdditionSuccess: {
            message: "Товар добавлен"
        }
    }
}
