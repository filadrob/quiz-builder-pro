// Flashcard Quiz Platform – Google Apps Script
// Deploy as Web App: Execute as Me, Access: Anyone (no sign-in required)
// After deploying, copy the Web App URL into VITE_GAS_ENDPOINT in your .env file
//
// SETUP INSTRUCTIONS
// 1. Create a new Google Sheet
// 2. Rename the first tab to "scores"
// 3. Add these headers in row 1:
//    A1: quizId
//    B1: name
//    C1: isAnonymous
//    D1: score
//    E1: totalTime
//    F1: timestamp
//    G1: privateGroupCode
// 4. Open Extensions > Apps Script
// 5. Paste this entire script, replacing any existing code
// 6. Click Deploy > New Deployment
//    - Type: Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 7. Copy the Web App URL
// 8. Paste it into VITE_GAS_ENDPOINT in your .env file

const SHEET_NAME = 'scores';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    sheet.appendRow([
      data.quizId || '',
      data.name || 'Anonymous',
      data.isAnonymous === true ? 'TRUE' : 'FALSE',
      data.score || 0,
      data.totalTime || 0,
      new Date().toISOString(),
      data.privateGroupCode || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const quizId = e.parameter.quizId;
    const groupCode = e.parameter.groupCode || null;

    if (!quizId) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'quizId is required' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const rows = sheet.getDataRange().getValues();

    // Row 0 is the header row -- skip it
    // Columns: 0=quizId, 1=name, 2=isAnonymous, 3=score, 4=totalTime, 5=timestamp, 6=privateGroupCode
    const entries = rows
      .slice(1)
      .filter(row => {
        if (row[0] !== quizId) return false;
        if (groupCode && row[6] !== groupCode) return false;
        return true;
      })
      .map(row => ({
        name: row[1],
        isAnonymous: row[2] === 'TRUE',
        score: Number(row[3]),
        totalTime: Number(row[4]),
        timestamp: row[5],
        privateGroupCode: row[6] || null,
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.totalTime - b.totalTime;
      });

    return ContentService
      .createTextOutput(JSON.stringify(entries))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
