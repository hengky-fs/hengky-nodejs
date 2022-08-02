const config = require('./config');
const { getCustomTimestamp } = require('../utils/day');
const { renderTemplate } = require('../utils/template');
const http = require('./http');

function disputedAt(orderTimeData) {
  let result = '-';
  if (orderTimeData.disputedAt) {
    const disputedAtUAETimestamp = getCustomTimestamp(orderTimeData.disputedAt, 'Asia/Dubai', 'MMM DD YYYY HH:mm:ss');
    result = `${disputedAtUAETimestamp} (UAE Time)`;
  }
  return result;
}

async function createZendeskTicket(userInfo, brokerInfo, requestedBy = undefined, order, orderTimeData, disputeReason, disputeDescription, podKey) {
  const absolutePodUrl = podKey ? `${config.s3.endpoint}/${config.s3.bucketName}/${podKey}` : '';

  let requester = { name: 'Auto Dispute' };
  if (requestedBy) {
    requester = +requestedBy === userInfo.id ? userInfo : brokerInfo;
  }

  const zendeskTicketHtmlString = await renderTemplate('zendesk-ticket.html', {
    orderNumber: order.orderNumber,
    orderTime: disputedAt(orderTimeData),
    userID: userInfo.id,
    userName: userInfo.name || '',
    userEmail: userInfo.email,
    userLegalName: userInfo.legalName,
    brokerID: brokerInfo.id,
    brokerName: brokerInfo.name || '',
    brokerEmail: brokerInfo.email,
    brokerLegalName: brokerInfo.legalName,
    disputedAmount: `${order.amount} ${order.coin}`,
    disputeReason: disputeReason || '-',
    disputeDescription: disputeDescription && disputeDescription !== 'undefined' ? disputeDescription : '-',
    uploadProof: absolutePodUrl ? `<a href="${absolutePodUrl}">${absolutePodUrl}</a>` : '-'
  });

  return http.postRequest(
    {
      ticket: {
        subject: `Dispute Request for order ${order.orderNumber}`,
        comment: {
          html_body: zendeskTicketHtmlString,
        },
        requester: { name: requester.name || requester.legalName },
      },
    },
    config.zendesk.apiUrl + '/v2/tickets',
    {
      Authorization: config.zendesk.basicToken,
    }
  );
}

module.exports = {
  createZendeskTicket
}