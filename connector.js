(function() {
  var myConnector = tableau.makeConnector();
  var sheetUrl = "";

  // --- getSchema ---
  myConnector.getSchema = function(schemaCallback) {
    fetch(sheetUrl)
      .then(response => response.text())
      .then(text => {
        if (!text) throw new Error("File kosong atau tidak bisa di-load.");

        // Hapus BOM (Byte Order Mark)
        text = text.replace(/^\uFEFF/, '');

        // Detect delimiter otomatis
        function detectDelimiter(sampleText) {
          const delimiters = [",", ";", "\t"];
          let maxCount = 0;
          let selected = ",";
          
          delimiters.forEach(d => {
            const count = (sampleText.split("\n")[0].match(new RegExp(`\\${d}`, 'g')) || []).length;
            if (count > maxCount) {
              maxCount = count;
              selected = d;
            }
          });
          return selected;
        }

        const delimiter = detectDelimiter(text);
        const rows = text.trim().split("\n").map(row => row.split(delimiter));
        const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ""));

        const cols = headers.map(header => ({
          id: header.replace(/\s+/g, "_"), // Ganti spasi jadi underscore
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
        tableau.abortWithError("Gagal mengambil schema. Pastikan URL benar dan file tidak kosong.");
      });
  };

  // --- getData ---
  myConnector.getData = function(table, doneCallback) {
    fetch(sheetUrl)
      .then(response => response.text())
      .then(text => {
        if (!text) throw new Error("File kosong atau tidak bisa di-load.");

        // Hapus BOM (Byte Order Mark)
        text = text.replace(/^\uFEFF/, '');

        function detectDelimiter(sampleText) {
          const delimiters = [",", ";", "\t"];
          let maxCount = 0;
          let selected = ",";
          
          delimiters.forEach(d => {
            const count = (sampleText.split("\n")[0].match(new RegExp(`\\${d}`, 'g')) || []).length;
            if (count > maxCount) {
              maxCount = count;
              selected = d;
            }
          });
          return selected;
        }

        const delimiter = detectDelimiter(text);
        const rows = text.trim().split("\n").map(row => row.split(delimiter));
        const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ""));

        const data = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length !== headers.length) {
            if (row.every(cell => !cell.trim())) {
              continue; // Skip baris kosong total
            }
            console.warn(`Skipping row ${i + 1}: jumlah kolom tidak cocok.`);
            continue; 
          }
          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header.replace(/\s+/g, "_")] = row[index] ? row[index].trim().replace(/^"|"$/g, "") : null;
          });
          data.push(rowData);
        }

        table.appendRows(data);
        doneCallback();
      })
      .catch(error => {
        console.error("Error saat mengambil data:", error);
        tableau.abortWithError("Gagal mengambil data. Pastikan URL benar dan file tidak kosong.");
      });
  };

  tableau.registerConnector(myConnector);

  // --- UI logic ---
  $(document).ready(function() {
    $("#fetchButton").click(function() {
      var urlInput = $("#sheetUrl").val().trim();
      if (urlInput) {
        sheetUrl = urlInput;
        tableau.connectionName = "Dynamic Google Sheets WDC"; 
        tableau.submit();
      } else {
        alert("Masukkan URL Google Sheets terlebih dahulu.");
      }
    });
  });
})();
