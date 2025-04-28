(function() {
  var sheetUrl = "";

  var myConnector = tableau.makeConnector();

  myConnector.getSchema = function(schemaCallback) {
    fetch(sheetUrl)
      .then(response => response.text())
      .then(text => {
        if (!text || text.startsWith("<!DOCTYPE html>") || text.includes("<html")) {
          throw new Error("Bukan file CSV yang valid. Pastikan URL menggunakan export?format=csv dan file public.");
        }

        const delimiter = detectDelimiter(text);
        const rows = text.trim().split("\n").map(row => row.split(delimiter));
        const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ""));

        const cols = headers.map(header => ({
          id: header.replace(/\s+/g, "_"),
          alias: header,
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
        const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ""));

        const data = rows.slice(1).map(row => {
          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header.replace(/\s+/g, "_")] = row[index] ? row[index].trim().replace(/^"|"$/g, "") : "";
          });
          return rowData;
        });

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
      var url = $("#sheetUrl").val().trim();

      if (!url.includes("/export?format=csv")) {
        alert("Link harus berbentuk EXPORT CSV.\nContoh: https://docs.google.com/spreadsheets/d/FILE_ID/export?format=csv");
        return;
      }

      sheetUrl = url;
      tableau.connectionName = "Google Sheet Dynamic Data";
      tableau.submit();
    });
  });

  function detectDelimiter(text) {
    const commaCount = (text.match(/,/g) || []).length;
    const semicolonCount = (text.match(/;/g) || []).length;
    return commaCount >= semicolonCount ? "," : ";";
  }

})();