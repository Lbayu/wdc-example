myConnector.getSchema = function (schemaCallback) {
  const url = document.getElementById("sheetUrl").value;
  fetch(url)
      .then(response => response.text())
      .then(text => {
          const rows = text.split("\n").map(row => row.split(","));
          const headers = rows[0];

          const cols = headers.map(header => ({
              id: header.trim(),
              alias: header.trim(),
              dataType: tableau.dataTypeEnum.string
          }));

          const tableSchema = {
              id: "GoogleSheetData",
              alias: "Google Sheet Data",
              columns: cols
          };

          schemaCallback([tableSchema]);
      });
};
