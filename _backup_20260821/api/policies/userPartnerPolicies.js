module.exports = async function (req, res, proceed) {
	try {
		const apiKeyHeader = req.headers['api-key'] || req.headers['x-api-key'] || req.headers['Authorization']

		// If no API key is provided, just continue so other policies (e.g., JWT) can handle auth
		if (!apiKeyHeader) return res.status(401).json({ message: 'invalidApiKey' });

		// Find user by API_KEY
		const user = await Users.findOne({ API_KEY: apiKeyHeader })

		if (!user) {
			return res.status(401).json({ message: 'invalidApiKey.' })
		}

	// Sanitize and attach to req.body as User
		if (!req.body) req.body = {}
		const { password, ...safeUser } = user
		req.body.User = safeUser
	  req.fromApiKeyAuth = true

		return proceed()
	} catch (err) {
		return res.status(401).json({ message: 'invalidApiKey...' })
	}
};

