const {
  EmailSender,
  http,
  config,
  utils,
} = require('../common');
const {
  NOTIFICATION_TEMPLATES,
  ORDER_STATUS,
  DISPUTE_ORDERS,
  ENUM,
} = require('../constant');
const {
  notificationTemplatesDal,
  notificationsDal,
} = require('../dal');
const { RedisCache } = require('../utils');

class NotificationEngine {
  static async getUser(userId) {
    const url = `${config.faeApiUrl}/p2p/brokers/simpleProfile/${userId}`;
    const { response } = await http.getRequest(url);
    utils.checkErrorExists(response);

    return response;
  }

  static async sendNotification(order, listing = {}, userInfo = undefined, brokerInfo = undefined) {
    const { orderNumber, userId, brokerId, status, userStatus, brokerStatus, disputeStatus } = order;
    const promises = [];

    let userRes = {};
    if (!userInfo) {
      userRes = await this.getUser(userId);
      userInfo = userRes.result;
    }
    if (!brokerInfo) {
      userRes = await this.getUser(brokerId);
      brokerInfo = userRes.result;
    }

    const userName = userInfo.name || userInfo.legalName;
    const brokerName = brokerInfo.name || brokerInfo.legalName;

    switch (status) {
      case ORDER_STATUS.STATUS.REQUESTED:
        promises.push(this.send({
          orderNumber,
          slug: NOTIFICATION_TEMPLATES.SLUG.CREATE_ORDER,
          fromName: userName,
          paymentWindow: 0,
          to: { id: userId, name: userName, email: userInfo.email }
        }));
        promises.push(this.send({
          orderNumber,
          slug: NOTIFICATION_TEMPLATES.SLUG.RECEIVED_ORDER,
          fromName: userName,
          paymentWindow: ENUM.ORDER_LIMIT_TIME.ACCEPT,
          to: { id: brokerId, name: brokerName, email: brokerInfo.email }
        }));
        break;
      case ORDER_STATUS.STATUS.ACCEPTED: {
        const data = {
          orderNumber,
          fromName: brokerName,
          paymentWindow: listing.paymentWindow || ENUM.ORDER_LIMIT_TIME.PAY,
          to: { id: userId, name: userName, email: userInfo.email }
        };
        if (order.type === 'BUY') {
          promises.push(this.send({
            ...data,
            slug: NOTIFICATION_TEMPLATES.SLUG.ACCEPTED_ORDER,
          }));
        } else {
          promises.push(this.send({
            ...data,
            slug: NOTIFICATION_TEMPLATES.SLUG.ACCEPTED_ORDER_SELL,
          }));
        }
        break;
      }
      case ORDER_STATUS.STATUS.PAID: {
        const data = {};
        if (order.type === 'BUY') {
          Object.assign(data, {
            fromName: userName,
            to: { id: brokerId, name: brokerName, email: brokerInfo.email }
          });
        } else {
          Object.assign(data, {
            fromName: brokerName,
            to: { id: userId, name: userName, email: userInfo.email }
          });
        }
        promises.push(this.send({
          orderNumber,
          slug: NOTIFICATION_TEMPLATES.SLUG.PAID_ORDER,
          paymentWindow: ENUM.ORDER_LIMIT_TIME.RELEASE,
          ...data,
        }));
        break;
      }
      case ORDER_STATUS.STATUS.COMPLETED: {
        const data = { received: {}, released: {} };
        if (order.type === 'BUY') {
          data.received =  {
            fromName: brokerName,
            to: { id: userId, name: userName, email: userInfo.email }
          };
          data.released = {
            fromName: userName,
            to: { id: brokerId, name: brokerName, email: brokerInfo.email }
          };
        } else {
          data.received =  {
            fromName: userName,
            to: { id: brokerId, name: brokerName, email: brokerInfo.email }
          };
          data.released = {
            fromName: brokerName,
            to: { id: userId, name: userName, email: userInfo.email }
          };
        }
        promises.push(this.send({
          orderNumber,
          paymentWindow: 0,
          slug: NOTIFICATION_TEMPLATES.SLUG.RECEIVED_ORDER_COIN,
          ...data.received,
        }));
        promises.push(this.send({
          orderNumber,
          slug: NOTIFICATION_TEMPLATES.SLUG.RELEASED_ORDER_COIN,
          paymentWindow: 0,
          ...data.released,
        }));
        break;
      }
      case ORDER_STATUS.STATUS.REJECTED:
        if (brokerStatus === ORDER_STATUS.STATUS.REJECTED) {
          promises.push(this.send({
            orderNumber,
            slug: NOTIFICATION_TEMPLATES.SLUG.REJECTED_ORDER,
            fromName: brokerName,
            paymentWindow: 0,
            to: { id: userId, name: userName, email: userInfo.email }
          }));
        }
        if (userStatus === ORDER_STATUS.STATUS.REJECTED) {
          promises.push(this.send({
            orderNumber,
            slug: NOTIFICATION_TEMPLATES.SLUG.REJECTED_ORDER,
            fromName: userName,
            paymentWindow: 0,
            to: { id: brokerId, name: brokerName, email: brokerInfo.email }
          }));
        }
        break;
      case ORDER_STATUS.STATUS.CANCELLED: {
        const data = {
          suspect: { slug: NOTIFICATION_TEMPLATES.SLUG.CANCELLED_ORDER_DOER, },
          victim: { slug: NOTIFICATION_TEMPLATES.SLUG.CANCELLED_ORDER, }
        };
        if (brokerStatus === ORDER_STATUS.STATUS.REJECTED) {
          data.suspect.to = { id: brokerId, name: brokerName, email: brokerInfo.email };
          data.suspect.fromName = userName;
          data.victim.to = { id: userId, name: userName, email: userInfo.email };
          data.victim.fromName = brokerName;
        } else {
          data.suspect.to = { id: userId, name: userName, email: userInfo.email };
          data.suspect.fromName = brokerName;
          data.victim.to = { id: brokerId, name: brokerName, email: brokerInfo.email };
          data.victim.fromName = userName;
        }
        Object.keys(data).forEach((val) => {
          promises.push(this.send({ orderNumber, ...data[val] }));
        });
        break;
      }
      case ORDER_STATUS.STATUS.EXPIRED:
        if (userStatus === ORDER_STATUS.STATUS.EXPIRED) {
          promises.push(
            this.send({
              orderNumber,
              slug: NOTIFICATION_TEMPLATES.SLUG.EXPIRED_ORDER_DOER,
              fromName: brokerName,
              paymentWindow: 0,
              to: { id: userId, name: userName, email: userInfo.email }
            }),
            this.send({
              orderNumber,
              slug: NOTIFICATION_TEMPLATES.SLUG.EXPIRED_ORDER,
              fromName: userName,
              paymentWindow: 0,
              to: { id: brokerId, name: brokerName, email: brokerInfo.email }
            })
          );
        }
        if (brokerStatus === ORDER_STATUS.STATUS.EXPIRED) {
          promises.push(
            this.send({
              orderNumber,
              slug: NOTIFICATION_TEMPLATES.SLUG.EXPIRED_ORDER,
              fromName: brokerName,
              paymentWindow: 0,
              to: { id: userId, name: userName, email: userInfo.email }
            }),
            this.send({
              orderNumber,
              slug: NOTIFICATION_TEMPLATES.SLUG.EXPIRED_ORDER_DOER,
              fromName: userName,
              paymentWindow: 0,
              to: { id: brokerId, name: brokerName, email: brokerInfo.email }
            })
          );
        }
        break;
      case ORDER_STATUS.STATUS.DISPUTED:
        if (brokerStatus && brokerStatus === ORDER_STATUS.STATUS.DISPUTED) {
          promises.push(this.send({
            orderNumber,
            slug: NOTIFICATION_TEMPLATES.SLUG.DISPUTED_ORDER,
            fromName: brokerName,
            paymentWindow: 0,
            to: { id: userId, name: userName, email: userInfo.email }
          }));
        }
        if (userStatus && userStatus === ORDER_STATUS.STATUS.DISPUTED) {
          promises.push(
            this.send({
              orderNumber,
              slug: NOTIFICATION_TEMPLATES.SLUG.DISPUTED_ORDER_AUTO_FOR_BROKER,
              fromName: userName,
              paymentWindow: 0,
              to: { id: brokerId, name: brokerName, email: brokerInfo.email }
            }),
            this.send({
              orderNumber,
              slug: NOTIFICATION_TEMPLATES.SLUG.DISPUTED_ORDER_AUTO,
              fromName: brokerName,
              paymentWindow: 0,
              to: { id: userId, name: userName, email: userInfo.email }
            }),
          );
        }
        if (disputeStatus && disputeStatus === DISPUTE_ORDERS.STATUS.IN_PROGRESS) {
          const params = {
            orderNumber,
            slug: NOTIFICATION_TEMPLATES.SLUG.ORDER_DISPUTED_IN_PROGRESS,
          }; 
          promises.push(
            this.send({
              ...params,
              to: { id: brokerId, name: brokerName, email: brokerInfo.email }
            }),
            this.send({
              ...params,
              to: { id: userId, name: userName, email: userInfo.email }
            }),
          );
        }
        if (disputeStatus && disputeStatus === DISPUTE_ORDERS.STATUS.REVOKED) {
          promises.push(
            this.send({
              orderNumber,
              slug: NOTIFICATION_TEMPLATES.SLUG.ORDER_DISPUTED_REVOKED_FOR_BROKER,
              to: { id: brokerId, name: brokerName, email: brokerInfo.email }
            }),
            this.send({
              orderNumber,
              slug: NOTIFICATION_TEMPLATES.SLUG.ORDER_DISPUTED_REVOKED_FOR_USER,
              to: { id: userId, name: userName, email: userInfo.email }
            }),
          );
        }
        if (disputeStatus && disputeStatus === DISPUTE_ORDERS.STATUS.RESOLVED) {
          promises.push(
            this.send({
              orderNumber,
              slug: NOTIFICATION_TEMPLATES.SLUG.ORDER_DISPUTED_RESOLVED_FOR_BROKER,
              to: { id: brokerId, name: brokerName, email: brokerInfo.email }
            }),
            this.send({
              orderNumber,
              slug: NOTIFICATION_TEMPLATES.SLUG.ORDER_DISPUTED_RESOLVED_FOR_USER,
              to: { id: userId, name: userName, email: userInfo.email }
            }),
          );
        }
        break;
      default:
        break;
    }

    await Promise.all(promises);
    return true;
  }

  static async send({orderNumber, slug, fromName, to, paymentWindow}) {
    const tableName = 'notificationTemplates';

    // emailTemplate
    const emailTemplateKey = `${NOTIFICATION_TEMPLATES.TYPE.EMAIL}:${slug}`;
    let emailTemplate = await RedisCache.hget(tableName, emailTemplateKey);
    if (!emailTemplate) {
      emailTemplate = await notificationTemplatesDal.findOne({ type: NOTIFICATION_TEMPLATES.TYPE.EMAIL, slug });
      await RedisCache.hmset(tableName, emailTemplateKey, emailTemplate, config.emailTemplateTtl);
    }

    // notifTemplate
    const notifTemplateKey = `${NOTIFICATION_TEMPLATES.TYPE.NOTIFICATION}:${slug}`;
    let notifTemplate = await RedisCache.hget(tableName, notifTemplateKey);
    if (!notifTemplate) {
      notifTemplate = await notificationTemplatesDal.findOne({ type: NOTIFICATION_TEMPLATES.TYPE.EMAIL, slug });
      await RedisCache.hmset(tableName, notifTemplateKey, notifTemplate, config.notifTemplateTtl);
    }

    // Manipulate content
    let { body, subject } = emailTemplate;
    subject = subject.replace(/##orderNumber##/g, orderNumber);
    body = body.replace(/##detailOrderUrl##/g, config.detailOrderUrl);
    body = body.replace(/##orderNumber##/g, orderNumber);
    body = body.replace(/##email##/g, to.email);
    body = body.replace(/##toName##/g, to.name);
    body = body.replace(/##fromName##/g, fromName);
    body = body.replace(/##paymentWindow##/g, paymentWindow);

    notifTemplate.subject = notifTemplate.subject.replace(/##orderNumber##/g, orderNumber);
    notifTemplate.body = notifTemplate.body.replace(/##fromName##/g, fromName);

    // Send notif to user
    await Promise.all([
      EmailSender.sendEmail(body, to.email, subject),
      notificationsDal.create({
        userId: to.id,
        title: notifTemplate.subject,
        webLink: NOTIFICATION_TEMPLATES.LINK.WEB,
        androidLink: NOTIFICATION_TEMPLATES.LINK.ANDROID,
        iosLink: NOTIFICATION_TEMPLATES.LINK.IOS,
      })
    ]);

    return true;
  }
}
module.exports = NotificationEngine;
