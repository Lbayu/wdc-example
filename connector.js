myConnector.getSchema = function(schemaCallback) {
  fetch(sheetUrl)
  .then(response => response.text())
  .then(text => {
    if (!text || text.startsWith("<!DOCTYPE html>") || text.includes("<html")) {
      throw new Error("Bukan file CSV yang valid. Pastikan URL sudah Publish to Web dan output=csv.");
    }
    
    // --- lanjutkan normal parsing seperti biasa ---
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
    tableau.abortWithError("Gagal mengambil schema. Pastikan URL benar dan file tidak mengembalikan HTML.");
  });
};
