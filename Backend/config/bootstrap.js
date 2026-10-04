/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * Gán các global tiện ích lên `sails.*` mà nhiều controller/model trong app
 * đang dùng trực tiếp (sails.dataProcess, sails.moment, sails.jwtProcess...).
 * Không có file này thì mọi request gọi tới các global đó sẽ crash với
 * "Cannot read properties of undefined".
 *
 * Không chứa secret nên commit được.
 */

module.exports.bootstrap = async function() {

  const moment = require('moment-timezone');
  const crypto = require('crypto');
  const jwtEcnrypter = require('jwt-token-encrypt');
  const { ObjectID } = require('mongodb');

  const UserRelate = require('../api/controllers/BusinessProcess/UserRelate');
  const JwtProcess = require('../api/controllers/BusinessProcess/jwtProcess');
  const DataProcess = require('../api/utils/dataProcess');
  const ErrorOutput = require('../api/utils/errorOutput');
  const Ultils = require('../api/utils/Ultils');

  sails.moment = moment;
  sails.crypto = crypto;
  sails.objectId = ObjectID;
  sails.jwtEcnrypter = jwtEcnrypter;

  sails.Ultils = new Ultils();
  sails.dataProcess = new DataProcess();
  sails.checkErrorOutput = new ErrorOutput().checkErrorOutput;
  sails.UserRelate = new UserRelate();
  sails.jwtProcess = new JwtProcess();

  // Id cố định của bản ghi SystemSettings duy nhất (xem config/site-settings.js,
  // PublicController.getSettings).
  sails.PUBLIC_ID = '000000000000000000000000';

};
