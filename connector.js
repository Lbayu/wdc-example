myConnector.getData = function (table, doneCallback) {
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
      const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ""));

      const data = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length !== headers.length) {
          continue; // Skip baris yang tidak sesuai jumlah kolom
        }
        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = row[index] ? row[index].trim().replace(/^"|"$/g, "") : null;
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
