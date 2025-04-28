(function() {
  var myConnector = tableau.makeConnector();
  var sheetUrl = "https://lbayu.github.io/csv-hosting/Prediksi Kontrak XYZ - Sheet1 (1).csv";

  myConnector.getSchema = function(schemaCallback) {
    fetch(sheetUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error("HTTP error " + response.status);
        }
        return response.text();
      })
      .then(text => {
        if (!text || text.startsWith("<!DOCTYPE html>") || text.includes("<html")) {
          throw new Error("Bukan file CSV yang valid.");
        }

        const delimiter = detectDelimiter(text);
        const rows = text.trim().split("\n").map(row => row.split(delimiter));
        const headers = rows[0].map(h => cleanHeader(h));

        const cols = headers.map(header => ({
          id: header,
          alias: header.replace(/_/g, " "),
          dataType: tableau.dataTypeEnum.string
        }));

        const tableSchema = {
          id: "googleSheetData",
          alias: "Google Sheet Data",
          columns: cols
        };

        schemaCallback([tableSchema]);
      })
      .catch(error => {
        console.error("Error saat mengambil schema:", error);
        tableau.abortWithError("Gagal mengambil schema. Cek kembali URL dan akses file.");
      });
  };

  myConnector.getData = function(table, doneCallback) {
    fetch(sheetUrl)
      .then(response => response.text())
      .then(text => {
        const delimiter = detectDelimiter(text);
        const rows = text.trim().split("\n").map(row => row.split(delimiter));
        const headers = rows[0].map(h => cleanHeader(h));
        const data = [];

        for (let i = 1; i < rows.length; i++) {
          const row = {};
          for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = rows[i][j] ? rows[i][j].trim().replace(/^"|"$/g, "") : null;
          }
          data.push(row);
        }

        table.appendRows(data);
        doneCallback();
      })
      .catch(error => {
        console.error("Error saat mengambil data:", error);
        tableau.abortWithError("Gagal mengambil data. Cek kembali URL dan akses file.");
      });
  };

  tableau.registerConnector(myConnector);

  $(document).ready(function() {
    $("#fetchButton").click(function() {
      sheetUrl = $("#sheetUrl").val().trim();

      if (sheetUrl.includes("/edit")) {
        sheetUrl = sheetUrl.replace("/edit", "/export?format=csv");
      }
      tableau.connectionName = "Google Sheets WDC Dynamic";
      tableau.submit();
    });
  });

  function detectDelimiter(csvText) {
    if (csvText.includes(",")) return ",";
    if (csvText.includes(";")) return ";";
    if (csvText.includes("\t")) return "\t";
    return ",";
  }

  function cleanHeader(header) {
    return header.trim()
      .replace(/^"|"$/g, "") // Remove quotes
      .replace(/[^\w]/g, "_") // Non-word chars jadi underscore
      .replace(/_+/g, "_")    // Multiple underscores jadi satu
      .replace(/^_|_$/g, "")  // Remove leading/trailing underscore
      .toLowerCase();         // Optional: lowercase semua
  }
})();
