// Shared relay - all users use this same deployment
const CONFIG = {
  API_BASE: 'https://ai-get-interface.vercel.app',
  API_KEY: '8460f3f599c95d9b55701266ec827da6b6d7f414a07912aff8d93ee0b688c470' // Or use PropertiesService
};
// HEY GUYS LOOK AT ME I COMMITTED AN API KEY AND HAD TO REVOKE IT YESTERDAY HAHA
// My justification: this is a google app script that I pasted directly from my project online
// and I didn't immediately perceive a place to put sensitive env stuff. So the key lived in the script.
// We are not even using this script anymore anyway. (but it did work for the record)
// FYI I realized that we could just auth using stack auth if we really wanted a relay.
function doGet(e) {
  const list = e?.parameter?.list;
  const item = e?.parameter?.item;
  
  if (!list || !item) {
    return error('Missing required parameters: list, item');
  }
  
  // Get authenticated user's email
  const user = Session.getActiveUser();
  const email = user.getEmail();
  
  if (!email) {
    return error('Could not identify user. Make sure you are signed into Google.');
  }
  
  try {
    const response = UrlFetchApp.fetch(`${CONFIG.API_BASE}/api/relay`, {
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'X-Relay-Key': CONFIG.API_KEY
      },
      payload: JSON.stringify({
        email: email,
        list: list,
        item: item
      }),
      muteHttpExceptions: true
    });
    
    const statusCode = response.getResponseCode();
    const body = JSON.parse(response.getContentText());
    
    if (statusCode >= 200 && statusCode < 300) {
      return success(body);
    } else {
      return error(body.error || `API error: ${statusCode}`);
    }
  } catch (err) {
    return error(`Request failed: ${err.message}`);
  }
}

function success(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function error(message) {
  return ContentService.createTextOutput(JSON.stringify({ error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}