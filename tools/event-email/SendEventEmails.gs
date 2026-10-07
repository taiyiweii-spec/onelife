/**
 * Event confirmation emails for a Google Form response sheet.
 *
 * Every run it scans the response sheet and emails each person who:
 *   - answered "Yes" to "Would u like to attend the event", and
 *   - does not have "Done" in the "Email sent" column.
 * After sending, it writes "Done" in "Email sent" so they are never emailed twice.
 *
 * Setup: Sheet > Extensions > Apps Script, paste this file, edit CONFIG,
 * then run setup() once and approve the permissions. After that, reload the
 * sheet: a menu "Event emails > Send to new people now" sends immediately.
 */

const CONFIG = {
  sheetName: 'Form Responses 1',
  emailHeader: 'Email',                              // address to send to
  fallbackEmailHeader: 'Email Address',              // used only if "Email" is blank
  nameHeader: 'Name',
  answerHeader: 'Would u like to attend the event',  // the Yes/No question
  yesValue: 'Yes',
  noValue: 'No',
  sentHeader: 'Email sent',                          // created automatically if missing
  sentValue: 'Done',
  senderName: 'Beyond Insights',                     // TODO: confirm
  replyTo: '',                                       // optional
  copyToSheet: 'A',                                  // tab that receives the Yes rows
  calendarSentHeader: 'Calendar invited',           // created automatically if missing
  eventTitle: 'Our Event',                           // TODO: edit
  eventStart: '2026-10-28T20:00:00+08:00',           // TODO: edit (date, time, timezone)
  eventEnd: '2026-10-28T21:00:00+08:00',             // TODO: edit
  eventDescription: 'Join link: [add Zoom link here]', // TODO: edit
  eventLocation: '',                                 // optional, e.g. the Zoom link
  runHour: 9,                                        // daily run time (script time zone)
  subject: 'You are confirmed for our event',        // TODO: edit
  noSubject: 'Can we ask why you cannot join?'       // TODO: edit
};

// TODO: edit the wording. Keep the quotes and the + signs.
function buildBody_(name) {
  var nl = String.fromCharCode(10);
  var body = 'Hi ' + name + ',' + nl + nl;
  body = body + 'Thank you for signing up! We are happy to confirm your spot.' + nl + nl;
  body = body + '[Event name / date / time / Zoom link here]' + nl + nl;
  body = body + 'See you there!' + nl;
  body = body + CONFIG.senderName;
  return body;
}

function buildNoBody_(name) {
  var nl = String.fromCharCode(10);
  var body = 'Hi ' + name + ',' + nl + nl;
  body = body + 'Thanks for letting us know you cannot attend.' + nl + nl;
  body = body + 'Could you reply to this email and tell us why? Your feedback helps us improve.' + nl + nl;
  body = body + 'Thank you!' + nl;
  body = body + CONFIG.senderName;
  return body;
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
    const isYes = answer === CONFIG.yesValue.toLowerCase();
    const isNo = answer === CONFIG.noValue.toLowerCase();
    if ((!isYes && !isNo) || alreadySent) return;

    let to = emailCol > -1 ? String(row[emailCol]).trim() : '';
    if (!to && fallbackCol > -1) to = String(row[fallbackCol]).trim();
    if (!to) return;

    const name = nameCol > -1 && row[nameCol] ? String(row[nameCol]).trim() : 'there';
    const options = { name: CONFIG.senderName };
    if (CONFIG.replyTo) options.replyTo = CONFIG.replyTo;

    try {
      const subject = isYes ? CONFIG.subject : CONFIG.noSubject;
      const body = isYes ? buildBody_(name) : buildNoBody_(name);
      GmailApp.sendEmail(to, subject, body, options);
      sheet.getRange(i + 2, sentCol + 1).setValue(CONFIG.sentValue);
      SpreadsheetApp.flush(); // save the mark immediately so a later failure can't cause a re-send
    } catch (err) {
      console.error('Row ' + (i + 2) + ' (' + to + '): ' + err);
    }
  });

  copyYesToTab();
  inviteYesToCalendar();
}

/** Copies every "Yes" row (without the Email sent column) into tab A. Skips rows already copied. */
function copyYesToTab() {
  const ss = SpreadsheetApp.getActive();
  const src = ss.getSheetByName(CONFIG.sheetName);
  const dest = ss.getSheetByName(CONFIG.copyToSheet) || ss.insertSheet(CONFIG.copyToSheet);
  if (!src || src.getLastRow() < 2) return;

  const lastCol = src.getLastColumn();
  const data = src.getRange(1, 1, src.getLastRow(), lastCol).getValues();
  const headers = data[0].map(h => String(h).trim());
  const answerCol = headers.indexOf(CONFIG.answerHeader);
  if (answerCol === -1) return;

  // keep every column except the "Email sent" tracking column(s)
  const keep = [];
  headers.forEach((h, c) => {
    if (h.toLowerCase() !== CONFIG.sentHeader.toLowerCase()) keep.push(c);
  });
  const pick = row => keep.map(c => row[c]);

  if (dest.getLastRow() === 0) dest.appendRow(pick(headers));

  // rows already copied, identified by their first column (Timestamp) + second column
  const existing = {};
  if (dest.getLastRow() > 1) {
    dest.getRange(2, 1, dest.getLastRow() - 1, Math.min(2, keep.length)).getValues()
      .forEach(r => { existing[r.join('|')] = true; });
  }

  const toAdd = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (String(row[answerCol]).trim().toLowerCase() !== CONFIG.yesValue.toLowerCase()) continue;
    const picked = pick(row);
    const key = picked.slice(0, Math.min(2, picked.length)).join('|');
    if (existing[key]) continue;
    existing[key] = true;
    toAdd.push(picked);
  }
  if (toAdd.length) {
    dest.getRange(dest.getLastRow() + 1, 1, toAdd.length, toAdd[0].length).setValues(toAdd);
  }
}

/** Run once: creates the daily trigger (replaces any existing one for this script). */
/** Adds every "Yes" person to ONE shared calendar event (created on first use) and marks them Done. */
function inviteYesToCalendar() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(CONFIG.sheetName);
  if (!sheet || sheet.getLastRow() < 2) return;

  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
  const col = h => headers.indexOf(h);

  let calCol = col(CONFIG.calendarSentHeader);
  if (calCol === -1) {
    calCol = lastCol;
    sheet.getRange(1, calCol + 1).setValue(CONFIG.calendarSentHeader);
  }
  const emailCol = col(CONFIG.emailHeader);
  const fallbackCol = col(CONFIG.fallbackEmailHeader);
  const answerCol = col(CONFIG.answerHeader);
  if (answerCol === -1 || (emailCol === -1 && fallbackCol === -1)) return;

  const width = Math.max(lastCol, calCol + 1);
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues();

  const pending = [];
  rows.forEach((row, i) => {
    if (String(row[answerCol]).trim().toLowerCase() !== CONFIG.yesValue.toLowerCase()) return;
    if (String(row[calCol] || '').trim().toLowerCase() === CONFIG.sentValue.toLowerCase()) return;
    let to = emailCol > -1 ? String(row[emailCol]).trim() : '';
    if (!to && fallbackCol > -1) to = String(row[fallbackCol]).trim();
    if (to) pending.push({ rowNumber: i + 2, email: to });
  });
  if (!pending.length) return;

  const cal = CalendarApp.getDefaultCalendar();
  pending.forEach(p => {
    try {
      const event = cal.createEvent(
        CONFIG.eventTitle,
        new Date(CONFIG.eventStart),
        new Date(CONFIG.eventEnd),
        {
          description: CONFIG.eventDescription,
          location: CONFIG.eventLocation,
          guests: p.email,
          sendInvites: true
        }
      );
      event.setGuestsCanSeeGuests(false);
      event.setGuestsCanInviteOthers(false);
      event.setGuestsCanModify(false);
      sheet.getRange(p.rowNumber, calCol + 1).setValue(CONFIG.sentValue);
      SpreadsheetApp.flush();
    } catch (err) {
      console.error('Calendar row ' + p.rowNumber + ' (' + p.email + '): ' + err);
    }
  });
}

function setup() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'sendEventEmails')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sendEventEmails').timeBased().everyDays(1).atHour(CONFIG.runHour).create();
  sendEventEmails(); // also run now so you can test immediately
}

/** Adds a button (menu) to the sheet for sending right away. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Event emails')
    .addItem('Send to new people now', 'sendNow')
    .addItem('Copy Yes rows to tab A', 'copyYesToTab')
    .addItem('Invite Yes people to calendar', 'inviteYesToCalendar')
    .addToUi();
}

function sendNow() {
  sendEventEmails();
  SpreadsheetApp.getActive().toast('Done. Check the "' + CONFIG.sentHeader + '" column.', 'Event emails', 5);
}
