const crypto = require("crypto")

function parseCloudinaryConfig() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL

  if (cloudinaryUrl) {
    const parsed = new URL(cloudinaryUrl)

    return {
      cloudName: parsed.hostname,
      apiKey: decodeURIComponent(parsed.username),
      apiSecret: decodeURIComponent(parsed.password)
    }
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return null
  }

  return {
    cloudName,
    apiKey,
    apiSecret
  }
}

function buildSignature(params, apiSecret) {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&")

  return crypto
    .createHash("sha1")
    .update(`${payload}${apiSecret}`)
    .digest("hex")
}

async function uploadImage(source, options = {}) {
  if (!source) {
    return null
  }

  const config = parseCloudinaryConfig()

  if (!config) {
    return {
      secureUrl: imageUrl,
      publicId: null
    }
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = options.folder || "cruisesaga/ships/decks"
  const publicId = options.publicId
  const paramsToSign = {
    folder,
    public_id: publicId,
    timestamp
  }
  const signature = buildSignature(paramsToSign, config.apiSecret)
  const formData = new FormData()

  formData.set("file", source)
  formData.set("folder", folder)
  formData.set("timestamp", String(timestamp))
  formData.set("api_key", config.apiKey)
  formData.set("signature", signature)

  if (publicId) {
    formData.set("public_id", publicId)
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error?.message || "Cloudinary upload failed")
  }

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id
  }
}

async function uploadImageFromUrl(imageUrl, options = {}) {
  return uploadImage(imageUrl, options)
}

async function destroyImage(publicId) {
  if (!publicId) {
    return
  }

  const config = parseCloudinaryConfig()

  if (!config) {
    return
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const signature = buildSignature(
    {
      public_id: publicId,
      timestamp
    },
    config.apiSecret
  )
  const formData = new FormData()

  formData.set("public_id", publicId)
  formData.set("timestamp", String(timestamp))
  formData.set("api_key", config.apiKey)
  formData.set("signature", signature)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`,
    {
      method: "POST",
      body: formData
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error?.message || "Cloudinary image deletion failed")
  }
}

module.exports = {
  destroyImage,
  parseCloudinaryConfig,
  uploadImage,
  uploadImageFromUrl
}
