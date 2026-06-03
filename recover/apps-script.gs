/****************************************************************************
 * Spotify Widget - Google Apps Script (Analytics + Encrypted Link Recovery)
 *
 * ZERO-KNOWLEDGE: This script only ever stores ENCRYPTED link blobs. It never
 * receives the plaintext link, the Spotify credentials, or the user's
 * passphrase. Without the passphrase (which never leaves the user's browser),
 * the stored data is unreadable - even to you, the sheet owner.
 *
 * HOW TO USE
 * 1. Open your Google Sheet -> Extensions -> Apps Script.
 * 2. Paste this whole file (replacing any existing code).
 * 3. Deploy -> Manage deployments -> edit your deployment -> New version
 *    (so the existing /exec URL keeps working), or create a new Web app:
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 4. Make sure the /exec URL matches APPS_SCRIPT_URL in:
 *      - /script.js              (analytics beacon)
 *      - /configure/script.js    (encrypts + saves links)
 *      - /recover/script.js      (fetches encrypted blob to decrypt locally)
 *
 * Encrypted links are stored in a sheet tab named "Links" with columns:
 *   Timestamp | Lookup | Salt | IV | Ciphertext
 * All of Salt/IV/Ciphertext are base64 and meaningless without the passphrase.
 ****************************************************************************/

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // ---- Encrypted link record (upsert by Lookup) ----
    if (data.type === "savelink") {
      if (!data.lookup || !data.salt || !data.iv || !data.ciphertext) {
        return jsonOutput({ error: "Missing fields" });
      }
      var linkSheet = ss.getSheetByName("Links");
      if (!linkSheet) {
        linkSheet = ss.insertSheet("Links");
        linkSheet.appendRow([
          "Timestamp",
          "Lookup",
          "Salt",
          "IV",
          "Ciphertext",
        ]);
      }

      var values = linkSheet.getDataRange().getValues();
      var rowIndex = -1;
      for (var i = 1; i < values.length; i++) {
        if (values[i][1] === data.lookup) {
          rowIndex = i + 1;
          break;
        }
      }

      var row = [new Date(), data.lookup, data.salt, data.iv, data.ciphertext];
      if (rowIndex > 0) {
        linkSheet.getRange(rowIndex, 1, 1, 5).setValues([row]); // update existing
      } else {
        linkSheet.appendRow(row); // insert new
      }
      return jsonOutput({ success: true });
    }

    // ---- Analytics beacon (default, unchanged behavior) ----
    var sheet = ss.getSheets()[0];
    sheet.appendRow([new Date(), data.userHash || "unknown"]);
    return jsonOutput({ success: true });
  } catch (err) {
    return jsonOutput({ error: err.message });
  }
}

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};

    // ---- Recover an encrypted link by lookup hash ----
    if (params.view === "recover") {
      if (!params.lookup) {
        return jsonOutput({ error: "Missing lookup" });
      }
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var linkSheet = ss.getSheetByName("Links");
      if (!linkSheet) {
        return jsonOutput({ found: false });
      }
      var values = linkSheet.getDataRange().getValues();
      for (var i = 1; i < values.length; i++) {
        if (values[i][1] === params.lookup) {
          return jsonOutput({
            found: true,
            salt: values[i][2],
            iv: values[i][3],
            ciphertext: values[i][4],
          });
        }
      }
      return jsonOutput({ found: false });
    }

    // ---- Analytics stats (default, unchanged behavior) ----
    var statsSs = SpreadsheetApp.getActiveSpreadsheet();
    var statsSheet = statsSs.getSheets()[0];
    var dataRange = statsSheet.getDataRange().getValues();
    var rows = dataRange.slice(1); // skip header

    var now = new Date();
    var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    var uniqueUsers = {};
    var loadsToday = 0;
    var loadsThisWeek = 0;

    rows.forEach(function (row) {
      var timestamp = new Date(row[0]);
      uniqueUsers[row[1]] = true;
      if (timestamp >= todayStart) loadsToday++;
      if (timestamp >= weekStart) loadsThisWeek++;
    });

    var last20 = rows
      .slice(-20)
      .reverse()
      .map(function (row) {
        return {
          timestamp: row[0],
          userHash: String(row[1]).substring(0, 12) + "...",
        };
      });

    return jsonOutput({
      totalLoads: rows.length,
      uniqueUsers: Object.keys(uniqueUsers).length,
      loadsToday: loadsToday,
      loadsThisWeek: loadsThisWeek,
      recentActivity: last20,
    });
  } catch (err) {
    return jsonOutput({ error: err.message });
  }
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
