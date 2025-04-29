(function() {
  var myConnector = tableau.makeConnector();
  var sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRf7iQivW3eFpE1V083ddaaMSYN3TfSv2CwX6hQokHWEtsyIgZrRejc1YQvl_gUjaZssXhOkGDO4AlM/pub?output=csv";

  myConnector.getSchema = function(schemaCallback) {
    fetch(sheetUrl)
      .then(response => response.text())
      .then(csv => {
        const rows = csv.trim().split("\n");
        const headers = rows[0].split(",");

        const cols = headers.map(h => ({
          id: h.trim().toLowerCase().replace(/[^\w]/g, "_"),
          alias: h.trim(),
          dataType: tableau.dataTypeEnum.string
        }));

        schemaCallback([{
          id: "google_sheet_data",
          alias: "Data from Google Sheets CSV",
          columns: cols
        }]);
      })
      .catch(error => {
        console.error("Schema Error:", error);
        tableau.abortWithError("Failed to fetch schema. Check your link.");
      });
  };

  myConnector.getData = function(table, doneCallback) {
    fetch(sheetUrl)
      .then(response => response.text())
      .then(csv => {
        const rows = csv.trim().split("\n");
        const headers = rows[0].split(",").map(h => h.trim().toLowerCase().replace(/[^\w]/g, "_"));
        const data = [];

        for (let i = 1; i < rows.length; i++) {
          const values = rows[i].split(",");
          const row = {};
          for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = values[j] ? values[j].trim() : "";
          }
          data.push(row);
        }

        table.appendRows(data);
        doneCallback();
      })
      .catch(error => {
        document.getElementById("status").innerText = "Error fetching data: " + error;
        tableau.abortWithError("Gagal ambil data dari Google Sheets.");
      });
  };

  tableau.registerConnector(myConnector);

  $(document).ready(function() {
    $("#fetchButton").click(function() {
      const rawUrl = $("#url").val().trim();
      if (!rawUrl.includes("docs.google.com")) {
        alert("Masukkan link Google Sheets yang valid (format CSV).");
        return;
      }

      sheetUrl = rawUrl; // langsung pakai karena sudah output=csv
      tableau.connectionName = "Google Sheets CSV";
      tableau.submit();
    });
  });
})();
