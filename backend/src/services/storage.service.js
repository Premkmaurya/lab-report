const ImageKit = require("imagekit");
const _config = require("../config/config");
const logger = require("../utils/logger");

const client = new ImageKit({
  privateKey: _config.IMAGEKIT_PRIVATE_KEY,
  publicKey: _config.IMAGEKIT_PUBLIC_KEY,
  urlEndpoint: _config.IMAGEKIT_URL_ENDPOINT,
});

const uploadFile = async (file, fileName) => {
  try {
    const result = await client.upload({
      file: file,
      fileName: fileName,
      folder: "balaji_doctor_signatures", // Optional: Specify a folder in ImageKit
    });

    return result;
  } catch (error) {
    logger.error("Error uploading file:", error);
    throw error;
  }
};

const deleteFile = async (fileId) => {
  try {
    const result = await client.deleteFile(fileId);
    return result;
  } catch (error) {
    logger.error("Error deleting file:", error);
    throw error;
  }
};

module.exports = {
  uploadFile,
  deleteFile,
};
