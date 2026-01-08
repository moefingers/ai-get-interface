// Shared relay - all users use this same deployment
const CONFIG = {
  API_BASE: 'https://ai-get-interface.vercel.app',
  API_KEY: '8460f3f599c95d9b55701266ec827da6b6d7f414a07912aff8d93ee0b688c470' // Or use PropertiesService
};

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