const AWS = require('aws-sdk');
const sgMail = require('@sendgrid/mail');
const logger = require('./logger');
const config = require('./config');

AWS.config.update({
  accessKeyId: config.AWS_SES.accessKey,
  secretAccessKey: config.AWS_SES.secretKey,
  region: config.AWS_SES.region,
});

const ses = new AWS.SES({ apiVersion: config.AWS_SES.apiVersion });

if (config.sendGrid.enable) {
  sgMail.setApiKey(config.sendGrid.mailKey);
}
class EmailSender {
  static async sendEmail(
    emailBody,
    to,
    subject,
    from = config.emails.formSubmissionFromEmail,
  ) {
    if (['true', true].includes(config.AWS_SES.enable)) {
      const params = {
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: emailBody,
            },
          },
          Subject: {
            Charset: 'UTF-8',
            Data: subject,
          },
        },
        Source: from,
      };
      const sendEmailInfo = ses.sendEmail(params).promise();
      sendEmailInfo.then(
        (data) => {
          logger.info(
            `Email sent successfully to: ${to}, subject: ${subject}`,
          );
          return !!data;
        },
      ).catch(
        (err) => {
          logger.log(
            'error',
            `Error occurred while sending email to: ${to}, subject: ${subject}`,
            { meta: { error: err.message } },
          );
        },
      );
      return false;
    }

    if (['true', true].includes(config.sendGrid.enable === 'true')) {
      try {
        const sentInfo = await sgMail.send({
          to,
          from,
          subject,
          html: `<p>${emailBody}</p>`,
        });
        logger.info(
          `Email sent successfully to: ${to}, subject: ${subject}`,
        );
        return !!sentInfo;
      } catch (error) {
        logger.log(
          'error',
          `Error occurred while sending email to: ${to}, subject: ${subject}`,
          { meta: { emailBody, error: error.stack } },
        );
      }
      return false;
    }
    return false;
  }
}

module.exports = EmailSender;
