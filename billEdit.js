// Function to show the Edit Entry form
function showEditEntryForm() {
  const people = getPeople();  // Get people list
  
  // Check if people data exists (not empty or undefined)
  if (!people || people.length === 0) {
    SpreadsheetApp.getUi().alert('No people data found. Cannot edit entry.');
    return;  // Exit the function if no people data is available
  }
  
  const html = HtmlService.createTemplateFromFile('EditEntryForm');  // Create HTML form template
  html.people = JSON.stringify(people);  // Pass the people data to the template as JSON
  SpreadsheetApp.getUi().showModalDialog(
    html.evaluate().setWidth(400).setHeight(600),  // Show modal dialog with set dimensions
    'Edit Entry'  // Set title of the dialog
  );
}

// Function to show the Edit Entry form based on Unique ID
function showEditEntryFormWithId() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt('Enter Unique ID to Edit:');
  var uniqueId = response.getResponseText();
  
  if (uniqueId) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;
    
    // Find the row with the given Unique ID
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] == uniqueId) {
        rowIndex = i;
        break;
      }
    }
    
    if (rowIndex != -1) {
      var rowData = data[rowIndex];
      var dateValue = rowData[2];
      
      // Check if dateValue is a date object and format it
      if (Object.prototype.toString.call(dateValue) === '[object Date]') {
        dateValue = Utilities.formatDate(dateValue, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else {
        // Convert date format from yyyy/mm/dd to yyyy-mm-dd
        dateValue = dateValue.replace(/\//g, '-');
      }
      
      var formData = {
        uniqueId: uniqueId,
        description: rowData[1],
        date: dateValue,
        totalAmount: rowData[3],
        whoPaid: rowData[4],
        contributionSplit: rowData[5],
        balanceSplit: rowData[6],
        folderLink: rowData[7]
      };
      
      // Determine split type
      var splitType = formData.contributionSplit.includes('$') ? 'amount' : 'percentage';
      
      // Create HTML form with populated data
      var html = HtmlService.createTemplateFromFile('EditEntryForm');
      html.formData = JSON.stringify(formData);
      html.splitType = splitType;
      html.people = JSON.stringify(people);  // Pass the people data to the template as JSON
      SpreadsheetApp.getUi().showModalDialog(
        html.evaluate().setWidth(400).setHeight(600),  // Show modal dialog with set dimensions
        'Edit Entry'  // Set title of the dialog
      );
    } else {
      ui.alert('Unique ID not found.');
    }
  }
}

// Function to save edited entry
function saveEditedEntry(formData) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;
  
  // Find the row with the given Unique ID
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == formData.uniqueId) {
      rowIndex = i;
      break;
    }
  }
  
  if (rowIndex != -1) {
    // Update the row with new data
    sheet.getRange(rowIndex + 1, 2, 1, 6).setValues([[
      formData.description,
      formData.date,
      formData.totalAmount,
      formData.whoPaid,
      formData.contributionSplit,
      formData.balanceSplit
    ]]);
    SpreadsheetApp.getUi().alert('Entry updated successfully.');
  } else {
    SpreadsheetApp.getUi().alert('Unique ID not found.');
  }
}
