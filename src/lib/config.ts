/**
 * Quiz platform configuration.
 *
 * Fill these in before deploying:
 *  - SHEETS_API_KEY: Google Cloud API key with Sheets API enabled (read-only).
 *  - QUIZ_INDEX_SHEET_ID: ID of the spreadsheet that holds BOTH the quiz index
 *    tab AND one tab per quiz for leaderboard rows (tab name = quiz id).
 *  - QUIZ_INDEX_RANGE: A1 range for the index tab (skip header row).
 *  - LEADERBOARD_APPS_SCRIPT_URL: deployed Google Apps Script Web App URL.
 *    The Apps Script writes leaderboard rows into a tab named after the quiz
 *    id in the SAME spreadsheet referenced by QUIZ_INDEX_SHEET_ID.
 */
export const SHEETS_API_KEY = "REPLACE_ME_SHEETS_API_KEY";
export const QUIZ_INDEX_SHEET_ID = "REPLACE_ME_QUIZ_INDEX_SHEET_ID";
export const QUIZ_INDEX_RANGE = "Quizzes!A2:F";
export const LEADERBOARD_APPS_SCRIPT_URL = "REPLACE_ME_APPS_SCRIPT_URL";
