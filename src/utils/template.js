const fs = require('fs').promises;
const path = require('path');

// replace variable inside html template to a certain value, return html string
function replaceTemplateVariable(htmlString, variable, value) {
  return htmlString.replace(new RegExp(`{{${variable}}}`, 'g'), value);
}

// @params templateFileName is template file name in /src/templates folder, example: 'zendesk-ticket.html'
// @params params is an object contains pair of variable and value want to pass into template
//         example: params = { orderNumber: 12345 }
async function renderTemplate(templateFileName, params) {
  try {
    const data = await fs.readFile(
      path.resolve(__dirname, `../templates/${templateFileName}`),
      'utf8'
    );
    let htmlString = Buffer.from(data).toString();
    for (let [variable, value] of Object.entries(params)) {
      htmlString = replaceTemplateVariable(htmlString, variable, value);
    }
    return htmlString;
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  renderTemplate,
};
