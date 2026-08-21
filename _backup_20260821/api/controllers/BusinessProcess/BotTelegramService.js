var sessionTimeOut = -1;
var activeSessions = {}; // Quản lý session theo user ID: { userId: { timeout: minutes, startTime: timestamp, interval: timerInterval } }
var TIMEOUT_SES = 15;
var DEFAULT_TIMEOUT_SES = 15;
module.exports = class BotTelegramService {

    /**
     * Get random icon from randomIcons list
     * @returns {string} Random emoji icon
     */
    getRandomIcon() {
        const randomIcons = ['🙂','🙃','😉','😅','😁','😄','😘','😍','🥰','😌','😛','😜','🤪','🧐','😎','☹️','😔','😩','😢'];
        var randomIndex = Math.floor(Math.random() * randomIcons.length);
        return randomIcons[randomIndex];
    }

    async sendRequest(txtRequest, msg, secretaryBot) {
        var randIcon = this.getRandomIcon();
        if (!txtRequest) return 'Xin yêu cầu sếp ơi... ' + randIcon;
        var taskInfo = txtRequest.split(' ');
        var taskRequest = taskInfo[0];
        var taskInput = taskInfo.length > 1 ? taskInfo[1] : "";
        switch (taskRequest) {
          case "/start":
            return await this.startSession(taskInput, msg, secretaryBot);
            break;
          case "/cf":
            return await this.confirmSession(taskInput, msg, secretaryBot);
            break;
          case "/end":
            return await this.endSession(taskInput, msg, secretaryBot);
            break;
          case "/info":
            return await this.getInfo(taskInput, msg, secretaryBot);
            break;
          case "/info2":
            return await this.getInfoV2(taskInput, msg, secretaryBot);
            break;
          case "/deposit":
            return await this.deposit(taskInput, msg, secretaryBot);
            break;
          case "/deposit2":
            return await this.depositV2(taskInput, msg, secretaryBot);
            break;
          case "/dp":
            return await this.rnDeposit(taskInput, msg, secretaryBot);
            break;
          case "/help":
            return `🔥🔥🔥HDSD🔥🔥🔥

👉 Lấy thông tin tài khoản: /info XAKQA2364

👉 Lấy thông tin tài khoản: /info2 hungvu21

👉 Nạp tiền cho tài khoản: /deposit XKAJ12A|500000

👉 Nạp tiền cho tài khoản: /deposit2 hungvu|5000

✅ /help ...`
            break;
          default:
            return "Yêu cầu này chưa được lên quy trình " + randIcon;
            break;
        }
    }

    /**
     * Format user information to readable text with emoji
     * @param {array} users - Array of user objects
     * @returns {string} Formatted text with emoji for each user
     */
    formatUsersToText(users, msg, secretaryBot) {
        if (!users || users.length === 0) return '';

        return users.map((user, index) => {
            // Skip if more than 10 results
            if (index > 9) return '';

            // Format timestamp: convert milliseconds to DD/MM/YYYY HH:MM:SS
            const createdDate = new Date(parseInt(user.createdAt));
            const day = String(createdDate.getDate()).padStart(2, '0');
            const month = String(createdDate.getMonth() + 1).padStart(2, '0');
            const year = createdDate.getFullYear();
            const hours = String(createdDate.getHours()).padStart(2, '0');
            const minutes = String(createdDate.getMinutes()).padStart(2, '0');
            const seconds = String(createdDate.getSeconds()).padStart(2, '0');
            const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

            // Format coin with thousand separator (e.g., 1000000 -> 1,000,000)
            const formattedCoin = user.coin.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

            setTimeout(() => {
              secretaryBot.sendMessage(msg.chat.id,`✅  Tài khoản: ${user.username}
🌟  Email: ${user.email}
💰  Mã nạp tiền: ${user.depositHash}
💵  Số dư: ${formattedCoin} đ
📱  Phone: ${user.phone}
📅  Ngày tạo: ${formattedDate}`);
            }, index * 500);
            return ``;
        }).join('');
    }

    /**
     * Get user account information by DepositHashCode
     * @param {string} depositHash - The deposit hash code (e.g., XAKQA2364)
     * @returns {Promise} User information if found, rejection error if not found
     */
    async getInfo(depositHash, msg, secretaryBot) {
        try {
            if (!depositHash) return'Mã xác nhận không được để trống \nEx: /info XAKQA2364'

            // Find all users by DepositHashCode
            let filter = {
                condition: {
                    depositHash: { '$regex': depositHash }
                },
                limit: 9999,
                page: 1
            };

            let users = await sails.dataProcess.getListDataNative(Users, filter);

            if (!users || !users.data || users.data.length === 0) {
                return 'Không tìm thấy tài khoản với mã xác nhận này';
            } else {
              let formattedUsers = users.data.map(user => ({
                  username: user.username,
                  email: user.email,
                  coin: user.coin || 0,
                  phone: user.phone,
                  depositHash: user.depositHash,
                  createdAt: user.createdAt
              }));

              return this.formatUsersToText(formattedUsers, msg, secretaryBot);
            }
        } catch (err) {
          return 'Lỗi khi tìm tài khoản';
        }
    }

    /**
     * Get user account information by Username
     * @param {string} username - The username to search (e.g., hungvu21)
     * @returns {Promise} User information if found, error message if not found
     */
    async getInfoV2(username, msg, secretaryBot) {
        try {
            if (!username) return 'Tên đăng nhập không được để trống \nEx: /info2 hungvu21';

            // Find users by username (case-insensitive regex search)
            let filter = {
                condition: {
                    username: { '$regex': username, '$options': 'i' }
                },
                limit: 9999,
                page: 1
            };

            let users = await sails.dataProcess.getListDataNative(Users, filter);

            if (!users || !users.data || users.data.length === 0) {
                return `Không tìm thấy tài khoản với tên đăng nhập: ${username}`;
            } else {
                let formattedUsers = users.data.map(user => ({
                    username: user.username,
                    email: user.email,
                    coin: user.coin || 0,
                    phone: user.phone,
                    depositHash: user.depositHash,
                    createdAt: user.createdAt
                }));

                return this.formatUsersToText(formattedUsers, msg, secretaryBot);
            }
        } catch (err) {
            return 'Lỗi khi tìm tài khoản';
        }
    }

    /**
     * Start session with timeout counter
     * @param {string} taskInput - Timeout in minutes (default: 5)
     * @param {object} msg - Telegram message object
     * @param {object} secretaryBot - Telegram bot instance
     * @returns {Promise} Session started message
     */
    async startSession(taskInput, msg, secretaryBot) {
        try {
            const userId = `Tid_${msg.from.id}`;
            TIMEOUT_SES = DEFAULT_TIMEOUT_SES;
            let timeoutMinutes = DEFAULT_TIMEOUT_SES; // Default 5 minutes

            // Parse timeout from taskInput if provided
            if (taskInput) {
                const parsed = parseInt(taskInput.trim());
                if (!isNaN(parsed) && parsed > 0) {
                    timeoutMinutes = parsed;
                    TIMEOUT_SES = parsed;
                }
            }

            // Clear existing session if any
            if (activeSessions[userId] && activeSessions[userId].interval) {
                clearInterval(activeSessions[userId].interval);
            }

            // Create new session
            activeSessions[userId] = {
                timeout: timeoutMinutes,
                startTime: Date.now(),
                remaining: timeoutMinutes * 60, // Convert to seconds
                interval: null
            };

            const messageText = `⏱️ Phiên bắt đầu!\n⏳ Thời gian: ${timeoutMinutes} phút\n📊 Trạng thái: Đang chờ xác nhận...`;
            secretaryBot.sendMessage(msg.chat.id, messageText);

            return '';
        } catch (err) {
            console.error('StartSession error:', err);
            return 'Lỗi khi bắt đầu phiên';
        }
    }

    /**
     * Confirm session with 2FA code
     * @param {string} taskInput - Format: username|2FAcode (e.g., HungVu21|123456)
     * @param {object} msg - Telegram message object
     * @param {object} secretaryBot - Telegram bot instance
     * @returns {Promise} Session confirmation result
     */
    async confirmSession(taskInput, msg, secretaryBot) {
        try {
            const userId = `Tid_${msg.from.id}`;

            if (!taskInput) {
                return 'Vui lòng nhập tên tài khoản và mã 2FA\nEx: /cf HungVu21|123456';
            }

            // Parse input: username|2FAcode
            const parts = taskInput.split('|');
            if (parts.length !== 2) {
                return 'Định dạng sai\nEx: /cf HungVu21|123456';
            }

            const username = parts[0].trim();
            const authCode = parts[1].trim();

            if (!username || !authCode) {
                return 'Tên tài khoản và mã 2FA không được để trống\nEx: /cf HungVu21|123456';
            }

            // Check if session was started
            if (!activeSessions[userId]) {
                return '❌ Phiên chưa được bắt đầu!\nVui lòng gõ /start để bắt đầu phiên';
            }

            // Check if session timeout = 0 (session expired)
            if (activeSessions[userId].remaining <= 0) {
                if (activeSessions[userId].interval) {
                    clearInterval(activeSessions[userId].interval);
                }
                activeSessions[userId] = null;
                return '⏰ Phiên đã hết hạn!\nVui lòng gõ /start để bắt đầu phiên mới';
            }

            // Find admin account by username
            let filterAdmin = {
                condition: {
                    username: username,
                    role: 'Admin'
                },
                limit: 1,
                page: 1
            };

            let adminUser = await sails.dataProcess.findOne(Users, filterAdmin);

            // Find 2FA secret for admin
            let filter2FA = {
                condition: { userID: adminUser.id }
            };

            let user2FA = await sails.dataProcess.findOne(Users2FA, filter2FA);

            if (!user2FA || !user2FA.secretKey2FA) {
                return 'Lỗi: Admin chưa cấu hình 2FA';
            }

            // Verify 2FA code using speakeasy
            const isValid = sails.config.TwoFA.verifyOTPToken(authCode, user2FA.secretKey2FA);

            if (!isValid) {
                return '❌ Mã xác nhận không chính xác!';
            }

            // Clear existing session and start new 5-minute session
            if (activeSessions[userId] && activeSessions[userId].interval) {
                clearInterval(activeSessions[userId].interval);
            }

            const sessionDuration = TIMEOUT_SES * 60; // 5 minutes in seconds
            let remainingSeconds = sessionDuration;

            const timerInterval = setInterval(() => {
                remainingSeconds--;
                if (remainingSeconds <= 0) {
                    clearInterval(timerInterval);
                    activeSessions[userId] = null;
                    secretaryBot.sendMessage(msg.chat.id, '⏰ Phiên đã hết hạn!');
                }
            }, 1000);

            activeSessions[userId] = {
                timeout: TIMEOUT_SES,
                startTime: Date.now(),
                remaining: sessionDuration,
                interval: timerInterval,
                verified: true,
                adminUsername: username
            };

            const messageText = `✅ Xác nhận thành công!\n🔓 Phiên đã kích hoạt (${TIMEOUT_SES} phút)\n👤 Admin: ${username}\n🎯 Trạng thái: Sẵn sàng`;
            secretaryBot.sendMessage(msg.chat.id, messageText);

            return '';
        } catch (err) {
            console.error('ConfirmSession error:', err);
            return 'Lỗi khi xác nhận phiên';
        }
    }

    /**
     * End session
     * @param {string} taskInput - Not used
     * @param {object} msg - Telegram message object
     * @param {object} secretaryBot - Telegram bot instance
     * @returns {Promise} Session ended message
     */
    async endSession(taskInput, msg, secretaryBot) {
        try {
            const userId = `Tid_${msg.from.id}`;

            // Clear session
            if (activeSessions[userId]) {
                if (activeSessions[userId].interval) {
                    clearInterval(activeSessions[userId].interval);
                }
                activeSessions[userId] = null;
            }

            const messageText = `🔒 Phiên đã kết thúc!\n⏳ Thời gian: Reset\n📊 Trạng thái: Chưa xác nhận`;
            secretaryBot.sendMessage(msg.chat.id, messageText);

            return '';
        } catch (err) {
            console.error('EndSession error:', err);
            return 'Lỗi khi kết thúc phiên';
        }
    }

    /**
     * Deposit/Withdraw money from account by DepositHashCode
     * @param {string} taskInput - Format: depositHash|amount (e.g., XKAJ12A|500000 for deposit, XKAJ12A|-100 for withdraw)
     * @param {object} msg - Telegram message object
     * @param {object} secretaryBot - Telegram bot instance
     * @returns {Promise} Confirmation message with updated account info
     */
    async deposit(taskInput, msg, secretaryBot) {
        try {
            const userId = `Tid_${msg.from.id}`;

            // Check if session exists and is still valid
            if (!activeSessions[userId]) {
                return '❌ Phiên chưa được bắt đầu!\nVui lòng gõ /start để bắt đầu phiên';
            }

            // Check if session is verified
            if (!activeSessions[userId].verified) {
                return '❌ Phiên chưa được xác nhận!\nVui lòng gõ /confirm <mã 2FA> để xác nhận phiên';
            }

            // Check if session timeout (remaining <= 0)
            if (activeSessions[userId].remaining <= 0) {
                if (activeSessions[userId].interval) {
                    clearInterval(activeSessions[userId].interval);
                }
                activeSessions[userId] = null;
                return '⏰ Phiên đã hết hạn!\nVui lòng gõ /start để bắt đầu phiên mới';
            }

            if (!taskInput) return 'Định dạng sai \nEx: /deposit XKAJ12A|500000 hoặc /deposit XKAJ12A|-100';

            // Parse input: depositHash|amount
            const parts = taskInput.split('|');
            if (parts.length !== 2) return 'Định dạng sai \nEx: /deposit XKAJ12A|500000 hoặc /deposit XKAJ12A|-100';

            const depositHash = parts[0].trim();
            const amount = parseInt(parts[1].trim());

            if (!depositHash || isNaN(amount) || amount === 0) {
                return 'Mã xác nhận và số tiền phải hợp lệ';
            }

            const isWithdraw = amount < 0;
            const absoluteAmount = Math.abs(amount);

            // Find user by depositHash (exact match)
            let filter = {
                condition: {
                    depositHash: depositHash
                },
                limit: 1,
                page: 1
            };

            let result = await sails.dataProcess.getListDataNative(Users, filter);

            if (!result || !result.data || result.data.length === 0) {
                return `Không tìm thấy tài khoản với mã: ${depositHash}`;
            }

            if (result.data.length > 1) return `Có ${result.data.length} tài khoản có mã nạp tiền tương tự ${depositHash}`

            let user = result.data[0];
            const oldCoin = user.coin || 0;
            const newCoin = oldCoin + amount;

            // Check if user has enough balance for withdrawal
            if (isWithdraw && oldCoin < absoluteAmount) {
                return `Lỗi: Số dư không đủ. Số dư hiện tại: ${oldCoin.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} đ`;
            }

            const condition = { depositHash: user.depositHash, username: user.username };

            // Update user coin
            let updateResponse = await sails.dataProcess.updateDocument(Users, {
                condition: condition,
                updateObject: { coin: newCoin }
            });

            // Check if update was successful
            if (!updateResponse) {
                return 'Lỗi: Không thể cập nhật số tiền cho tài khoản';
            }

            // Get updated user info to verify
            let updatedUser = await sails.dataProcess.findOne(Users, { condition: condition });

            if (!updatedUser || updatedUser.coin !== newCoin) {
                return 'Lỗi: Cập nhật không hoàn tất, số tiền không chính xác';
            }

            // Create transaction record (only after successful update)
            await sails.dataProcess.createDocument(Transaction, {
                method: isWithdraw ? 'DECREMENT' : 'INCREMENT',
                username: updatedUser.username,
                message: isWithdraw ? 'Admin trừ tiền' : 'Admin cộng tiền',
                userId: `Tid_${msg.from.id}`,
                amount: absoluteAmount,
                totalPay: absoluteAmount,
                status: 1,

            });

            // Format and send response
            let formattedUser = [{
                username: updatedUser.username,
                email: updatedUser.email,
                coin: updatedUser.coin,
                phone: updatedUser.phone,
                depositHash: updatedUser.depositHash,
                createdAt: updatedUser.createdAt
            }];

            const messageText = `${isWithdraw ? '❌ Trừ tiền thành công!' : '✅ Nạp tiền thành công!'}
💸 Số tiền ${isWithdraw ? 'trừ' : 'nạp'}: ${absoluteAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} đ
📊 Số dư cũ: ${oldCoin.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} đ
📊 Số dư mới: ${newCoin.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} đ\n\n`;

            secretaryBot.sendMessage(msg.chat.id, messageText);

            // Send user info after deposit
            return this.formatUsersToText(formattedUser, msg, secretaryBot);

        } catch (err) {
            console.error('Deposit error:', err);
            return 'Lỗi khi thực hiện giao dịch';
        }
    }

    /**
     * Deposit/Withdraw money from account by Username
     * @param {string} taskInput - Format: username|amount (e.g., hungvu|5000 for deposit, hungvu|-100 for withdraw)
     * @param {object} msg - Telegram message object
     * @param {object} secretaryBot - Telegram bot instance
     * @returns {Promise} Confirmation message with updated account info
     */
    async depositV2(taskInput, msg, secretaryBot) {
        try {
            const userId = `Tid_${msg.from.id}`;

            // Check if session exists and is still valid
            if (!activeSessions[userId]) {
                return '❌ Phiên chưa được bắt đầu!\nVui lòng gõ /start để bắt đầu phiên';
            }

            // Check if session is verified
            if (!activeSessions[userId].verified) {
                return '❌ Phiên chưa được xác nhận!\nVui lòng gõ /confirm <mã 2FA> để xác nhận phiên';
            }

            // Check if session timeout (remaining <= 0)
            if (activeSessions[userId].remaining <= 0) {
                if (activeSessions[userId].interval) {
                    clearInterval(activeSessions[userId].interval);
                }
                activeSessions[userId] = null;
                return '⏰ Phiên đã hết hạn!\nVui lòng gõ /start để bắt đầu phiên mới';
            }

            if (!taskInput) return 'Định dạng sai \nEx: /deposit2 hungvu|5000 hoặc /deposit2 hungvu|-100';

            // Parse input: username|amount
            const parts = taskInput.split('|');
            if (parts.length !== 2) return 'Định dạng sai \nEx: /deposit2 hungvu|5000 hoặc /deposit2 hungvu|-100';

            const username = parts[0].trim();
            const amount = parseInt(parts[1].trim());

            if (!username || isNaN(amount) || amount === 0) {
                return 'Tên đăng nhập và số tiền phải hợp lệ';
            }

            const isWithdraw = amount < 0;
            const absoluteAmount = Math.abs(amount);

            // Find user by username (exact match)
            let filter = {
                condition: {
                    username: username
                },
                limit: 1,
                page: 1
            };

            let result = await sails.dataProcess.getListDataNative(Users, filter);

            if (!result || !result.data || result.data.length === 0) {
                return `Không tìm thấy tài khoản: ${username}`;
            }

            if (result.data.length > 1) return `Có ${result.data.length} tài khoản có tên tương tự ${username}`

            let user = result.data[0];
            const oldCoin = user.coin || 0;
            const newCoin = oldCoin + amount;

            // Check if user has enough balance for withdrawal
            if (isWithdraw && oldCoin < absoluteAmount) {
                return `Lỗi: Số dư không đủ. Số dư hiện tại: ${oldCoin.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} đ`;
            }

            const condition = { username: user.username, depositHash: user.depositHash };

            // Update user coin
            let updateResponse = await sails.dataProcess.updateDocument(Users, {
                condition: condition,
                updateObject: { coin: newCoin }
            });

            // Check if update was successful
            if (!updateResponse) {
                return 'Lỗi: Không thể cập nhật số tiền cho tài khoản';
            }

            // Get updated user info to verify
            let updatedUser = await sails.dataProcess.findOne(Users, { condition: condition });

            if (!updatedUser || updatedUser.coin !== newCoin) {
                return 'Lỗi: Cập nhật không hoàn tất, số tiền không chính xác';
            }

            // Create transaction record (only after successful update)
            await sails.dataProcess.createDocument(Transaction, {
                method: isWithdraw ? 'DECREMENT' : 'INCREMENT',
                username: updatedUser.username,
                message: isWithdraw ? 'Admin trừ tiền' : 'Admin cộng tiền',
                userId: `Tid_${msg.from.id}`,
                amount: absoluteAmount,
                totalPay: absoluteAmount,
                status: 1,

            });

            // Format and send response
            let formattedUser = [{
                username: updatedUser.username,
                email: updatedUser.email,
                coin: updatedUser.coin,
                phone: updatedUser.phone,
                depositHash: updatedUser.depositHash,
                createdAt: updatedUser.createdAt
            }];

            const messageText = `${isWithdraw ? '❌ Trừ tiền thành công!' : '✅ Nạp tiền thành công!'}
💸 Số tiền ${isWithdraw ? 'trừ' : 'nạp'}: ${absoluteAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} đ
📊 Số dư cũ: ${oldCoin.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} đ
📊 Số dư mới: ${newCoin.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} đ\n\n`;

            secretaryBot.sendMessage(msg.chat.id, messageText);

            // Send user info after deposit
            return this.formatUsersToText(formattedUser, msg, secretaryBot);

        } catch (err) {
            console.error('Deposit error:', err);
            return 'Lỗi khi nạp tiền';
        }
    }

        /**
     * Deposit/Withdraw money from account by Username
     * @param {string} taskInput - Format: username|amount (e.g., hungvu|5000 for deposit, hungvu|-100 for withdraw)
     * @param {object} msg - Telegram message object
     * @param {object} secretaryBot - Telegram bot instance
     * @returns {Promise} Confirmation message with updated account info
     */
    async rnDeposit(taskInput, msg, secretaryBot) {
        try {
            const userId = `Tid_${msg.from.id}`;

            if (!taskInput) return 'Định dạng sai \nEx: /dp hungvu|5000 hoặc /dp hungvu|-100';

            // Parse input: username|amount
            const parts = taskInput.split('|');
            if (parts.length !== 2) return 'Định dạng sai \nEx: /dp hungvu|5000 hoặc /dp hungvu|-100';

            const username = parts[0].trim();
            const amount = parseInt(parts[1].trim());

            if (!username || isNaN(amount) || amount === 0) {
                return 'Tên đăng nhập và số tiền phải hợp lệ';
            }

            const isWithdraw = amount < 0;
            const absoluteAmount = Math.abs(amount);

            // Find user by username (exact match)
            let filter = {
                condition: {
                    username: username
                },
                limit: 1,
                page: 1
            };

            let result = await sails.dataProcess.getListDataNative(Users, filter);

            if (!result || !result.data || result.data.length === 0) {
                return `Không tìm thấy tài khoản: ${username}`;
            }

            if (result.data.length > 1) return `Có ${result.data.length} tài khoản có tên tương tự ${username}`

            let user = result.data[0];
            const oldCoin = user.coin || 0;
            const newCoin = oldCoin + amount;

            // Check if user has enough balance for withdrawal
            if (isWithdraw && oldCoin < absoluteAmount) {
                return `Lỗi: Số dư không đủ. Số dư hiện tại: ${oldCoin.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} đ`;
            }

            const condition = { username: user.username, depositHash: user.depositHash };

            // Update user coin
            let updateResponse = await sails.dataProcess.updateDocument(Users, {
                condition: condition,
                updateObject: { coin: newCoin }
            });

            // Check if update was successful
            if (!updateResponse) {
                return 'Lỗi: Không thể cập nhật số tiền cho tài khoản';
            }

            // Get updated user info to verify
            let updatedUser = await sails.dataProcess.findOne(Users, { condition: condition });

            if (!updatedUser || updatedUser.coin !== newCoin) {
                return 'Lỗi: Cập nhật không hoàn tất, số tiền không chính xác';
            }

            // Create transaction record (only after successful update)
            await sails.dataProcess.createDocument(Transaction, {
                method: isWithdraw ? 'DECREMENT' : 'INCREMENT',
                username: updatedUser.username,
                message: isWithdraw ? 'Admin trừ tiền' : 'Admin cộng tiền',
                userId: `Tid_${msg.from.id}`,
                amount: absoluteAmount,
                totalPay: absoluteAmount,
                status: 1,

            });

            // Format and send response
            let formattedUser = [{
                username: updatedUser.username,
                email: updatedUser.email,
                coin: updatedUser.coin,
                phone: updatedUser.phone,
                depositHash: updatedUser.depositHash,
                createdAt: updatedUser.createdAt
            }];

            const messageText = `${isWithdraw ? '❌ Trừ tiền thành công!' : '✅ Nạp tiền thành công!'}
💸 Số tiền ${isWithdraw ? 'trừ' : 'nạp'}: ${absoluteAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} đ
📊 Số dư cũ: ${oldCoin.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} đ
📊 Số dư mới: ${newCoin.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} đ\n\n`;

            secretaryBot.sendMessage(msg.chat.id, messageText);

            // Send user info after deposit
            return this.formatUsersToText(formattedUser, msg, secretaryBot);

        } catch (err) {
            console.error('Deposit error:', err);
            return 'Lỗi khi nạp tiền';
        }
    }

    Auth(inputUser) {
        return new Promise((resolve, reject) => {
            let userDetail;
            let { username, password } = inputUser
            sails.dataProcess.findOne(Users, { condition: { username } }).then((objectUser) => {
                if (!objectUser) {
                    return Promise.reject({
                        message: 'loginInvalid',
                        messageNode: 'Users',
                    })
                }
                userDetail = objectUser
                if (objectUser.status !== 1) {
                    return Promise.reject({
                        message: 'userBanned',
                        messageNode: 'Users',
                    })
                }
                return sails.helpers.passwords.checkPassword(password, userDetail.password);
            }).then((result) => {
                resolve(userDetail)
            }).catch((err) => {
                if (err && err.code && err.code == 'incorrect') {
                    reject({
                        messageNode: 'Users',
                        message: 'loginInvalid'
                    })
                    return
                }
                reject(err)
            });
        });
    }
}
