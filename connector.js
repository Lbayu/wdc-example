myConnector.getSchema = function (schemaCallback) {
    const url = document.getElementById("sheetUrl").value;
  
    fetch(url)
      .then(response => response.text())
      .then(text => {
        if (!text) {
          throw new Error("File kosong atau tidak bisa di-load.");
        }
  
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
        const rows = text.split("\n").map(row => row.split(delimiter));
        const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, "")); // Hilangkan spasi & tanda kutip
  
        const cols = headers.map(header => ({
          id: header,
          alias: header,
          dataType: tableau.dataTypeEnum.string
        }));
  
        const tableSchema = {
          id: "GoogleSheetData",
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