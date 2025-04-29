(function() {
  var myConnector = tableau.makeConnector();

  myConnector.getSchema = function(schemaCallback) {
    var cols = [
      { id: "name", dataType: tableau.dataTypeEnum.string },
      { id: "age", dataType: tableau.dataTypeEnum.int },
      { id: "city", dataType: tableau.dataTypeEnum.string }
    ];

    var tableSchema = {
      id: "dataTable",
      alias: "Sample data from Google Sheets",
      columns: cols
    };

    schemaCallback([tableSchema]);
  };

  myConnector.getData = function(table, doneCallback) {
    var url = document.getElementById("https://docs.google.com/spreadsheets/d/e/2PACX-1vRf7iQivW3eFpE1V083ddaaMSYN3TfSv2CwX6hQokHWEtsyIgZrRejc1YQvl_gUjaZssXhOkGDO4AlM/pub?output=csv").value;
    fetch(url)
      .then(response => response.json())
      .then(data => {
        var tableData = [];
        data.forEach(item => {
          tableData.push({
            "name": item.name,
            "age": item.age,
            "city": item.city
          });
        });

        table.appendRows(tableData);
        doneCallback();
      })
      .catch(error => {
        document.getElementById("status").innerText = "Error fetching data: " + error;
        doneCallback();
      });
  };

  tableau.registerConnector(myConnector);

  document.getElementById("fetchButton").addEventListener("click", function() {
    tableau.connectionName = "Google Sheets Data";
    tableau.submit();
  });
})();