/**
 * Event confirmation emails for a Google Form response sheet.
 *
 * Every run it scans the response sheet and emails each person who:
 *   - answered "Yes" to "Would u like to attend the event", and
 *   - does not have "Done" in the "Email sent" column.
 * After sending, it writes "Done" in "Email sent" so they are never emailed twice.
 *
 * Setup: Sheet > Extensions > Apps Script, paste this file, edit CONFIG,
 * then run setup() once and approve the permissions.
 */

const CONFIG = {
  sheetName: 'Form Responses 1',
  emailHeader: 'Email',                              // address to send to
  fallbackEmailHeader: 'Email Address',              // used only if "Email" is blank
  nameHeader: 'Name',
  answerHeader: 'Would u like to attend the event',  // the Yes/No question
  yesValue: 'Yes',
  sentHeader: 'Email sent',                          // created automatically if missing
  sentValue: 'Done',
  senderName: 'Beyond Insights',                     // TODO: confirm
  replyTo: '',                                       // optional
  runHour: 9,                                        // daily run time (script time zone)
  subject: 'You are confirmed for our event',        // TODO: edit
};

// TODO: edit the wording. {{name}} is replaced with the person's name.
function buildBody_(name) {
  return [
    'Hi ' + name + ',',
    '',
    'Thank you for signing up! We are happy to confirm your spot.',
    '',
    '[Event name / date / time / Zoom link here]',
    '',
    'See you there!',
    CONFIG.senderName,
  ].join('\n');
}

function sendEventEmails() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(CONFIG.sheetName);
  if (!sheet || sheet.getLastRow() < 2) return;

  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
  const col = h => headers.indexOf(h);

  let sentCol = col(CONFIG.sentHeader);
  if (sentCol === -1) {
    sentCol = lastCol;
    sheet.getRange(1, sentCol + 1).setValue(CONFIG.sentHeader);
  }
  const emailCol = col(CONFIG.emailHeader);
  const fallbackCol = col(CONFIG.fallbackEmailHeader);
  const nameCol = col(CONFIG.nameHeader);
  const answerCol = col(CONFIG.answerHeader);
  if (answerCol === -1 || (emailCol === -1 && fallbackCol === -1)) {
    throw new Error('Could not find the expected column headers. Check CONFIG.');
  }

  const width = Math.max(lastCol, sentCol + 1);
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues();

  rows.forEach((row, i) => {
    const answer = String(row[answerCol]).trim().toLowerCase();
    const alreadySent = String(row[sentCol] || '').trim().toLowerCase() === CONFIG.sentValue.toLowerCase();
    if (answer !== CONFIG.yesValue.toLowerCase() || alreadySent) return;

    let to = emailCol > -1 ? String(row[emailCol]).trim() : '';
    if (!to && fallbackCol > -1) to = String(row[fallbackCol]).trim();
    if (!to) return;

    const name = nameCol > -1 && row[nameCol] ? String(row[nameCol]).trim() : 'there';
    const options = { name: CONFIG.senderName };
    if (CONFIG.replyTo) options.replyTo = CONFIG.replyTo;

    try {
      GmailApp.sendEmail(to, CONFIG.subject, buildBody_(name), options);
      sheet.getRange(i + 2, sentCol + 1).setValue(CONFIG.sentValue);
      SpreadsheetApp.flush(); // save the mark immediately so a later failure can't cause a re-send
    } catch (err) {
      console.error('Row ' + (i + 2) + ' (' + to + '): ' + err);
    }
  });
}

/** Run once: creates the daily trigger (replaces any existing one for this script). */
function setup() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'sendEventEmails')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sendEventEmails').timeBased().everyDays(1).atHour(CONFIG.runHour).create();
  sendEventEmails(); // also run now so you can test immediately
}
