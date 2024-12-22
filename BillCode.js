// Adds a custom menu to the Google Sheets UI
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Bill Splitting')
    .addItem('Add Entry', 'showAddEntryForm')
    .addItem('Edit Entry', 'showEditEntryForm')
    .addToUi();
}

// Retrieves the list of people from the 'People' sheet
function getPeople() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('People');
  if (!sheet) return [];  // Return an empty array if sheet is not found
  
  const data = sheet.getDataRange().getValues();  // Get all data from the sheet
  return data.slice(1).map(row => ({ name: row[0], email: row[1] }));  // Return an array of objects with name and email
}

// Opens the Bill Details form as a modal dialog
function enterBillDetails() {
  const people = getPeople();  // Get people list
  const html = HtmlService.createTemplateFromFile('BillForm');  // Create HTML form template
  html.people = JSON.stringify(people);  // Pass the people data to the template as JSON
  SpreadsheetApp.getUi().showModalDialog(
    html.evaluate().setWidth(400).setHeight(600),  // Show modal dialog with set dimensions
    'Enter Bill Details'  // Set title of the dialog
  );
}

// Function to show the Add Entry form
function showAddEntryForm() {
  const people = getPeople();  // Get people list
  const html = HtmlService.createTemplateFromFile('BillForm');  // Create HTML form template
  html.people = JSON.stringify(people);  // Pass the people data to the template as JSON
  SpreadsheetApp.getUi().showModalDialog(
    html.evaluate().setWidth(400).setHeight(600),  // Show modal dialog with set dimensions
    'Add Entry'  // Set title of the dialog
  );
}

// Function to show the Edit Entry form
function showEditEntryForm() {
  const people = getPeople();  // Get people list
  const html = HtmlService.createTemplateFromFile('EditEntryForm');  // Create HTML form template
  html.people = JSON.stringify(people);  // Pass the people data to the template as JSON
  SpreadsheetApp.getUi().showModalDialog(
    html.evaluate().setWidth(400).setHeight(600),  // Show modal dialog with set dimensions
    'Edit Entry'  // Set title of the dialog
  );
}

// Updates the total amount in the sheet and resizes columns
function updateTotalAmount() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Get all total amounts from column D (excluding the header)
  const totalAmountColumn = sheet.getRange('D2:D' + sheet.getLastRow()).getValues();
  
  // Calculate total sum
  const totalSum = totalAmountColumn.reduce((sum, row) => sum + (parseFloat(row[0]) || 0), 0);
  
  // Display total amount in cell D1
  sheet.getRange('D1').setValue('Total Amount: $' + totalSum.toFixed(2));
  
  // Auto-resize columns D and F based on content
  autoResizeColumnsD_F_G(sheet);
}

// Adds a new bill entry to the sheet
function addBillToSheet(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (sheet.getLastRow() === 0) {
    // Add headers if the sheet is empty
    sheet.appendRow(['Unique ID', 'Description', 'Date', 'Total Amount', 'Who Paid', 'Contribution Split', 'Balance Split', 'Folder Link']);
    
    // Format the header row (bold, color, center alignment)
    var headerRange = sheet.getRange(1, 1, 1, 8);
    headerRange.setFontWeight('bold').setBackground('#f0f0f0').setFontColor('#333333').setHorizontalAlignment('center');
    
    // Freeze the header row
    sheet.setFrozenRows(1);
  }

  const lastRow = sheet.getLastRow();
  const uniqueId = lastRow === 0 ? 1 : lastRow;

  const { description, date, totalAmount, splitType, members, payers } = data;

  // Format the contribution split (percentage or amount)
  const contributionSplit = members.map(member => 
    splitType === 'percentage' ? `${member.name}: ${member.split}%` : `${member.name}: $${member.split}`
  ).join('\n');

  // Initialize and calculate balance split
  const balanceMap = new Map();
  members.forEach(member => {
    let contribution = member.split;
    if (splitType === 'percentage') {
      contribution = (totalAmount * member.split) / 100;
    }
    balanceMap.set(member.name, -contribution);
  });

  // Adjust balance for payers
  payers.forEach(payer => {
    const currentBalance = balanceMap.get(payer.name) || 0;
    balanceMap.set(payer.name, currentBalance + payer.payerAmount);
  });

  // Format the balance split
  const balanceSplit = Array.from(balanceMap.entries())
    .map(([name, balance]) => `${name}: ${balance >= 0 ? `+$${balance.toFixed(2)}` : `-$${Math.abs(balance).toFixed(2)}`}`)
    .join('\n');

  // Create folder structure for the entry
  const folderUrl = createFolderStructure(sheet.getParent(), uniqueId);

  // Add a new row for the bill data
  sheet.appendRow([uniqueId, description, date, totalAmount, payers.map(p => `${p.name}: $${p.payerAmount}`).join('\n'), contributionSplit, balanceSplit, folderUrl]);

  // Format the total amount cell (bold, red font color)
  const totalAmountCell = sheet.getRange(sheet.getLastRow(), 4); // Column D is the total amount
  totalAmountCell.setFontWeight('bold').setFontColor('red');

  // Update total amount and auto-resize columns
  updateTotalAmount();
  autoResizeColumnsD_F_G(sheet);
}

// Resizes columns D,F, and G with added padding
function autoResizeColumnsD_F_G(sheet) {
  sheet.autoResizeColumn(4);  // Resize column D (Total Amount)
  sheet.autoResizeColumn(6);  // Resize column F (Contribution Split)
  sheet.autoResizeColumn(7);  // Resize column G (Balance Split)
  sheet.autoResizeColumn(8);  // Resize column G (Balance Split)
  
  // Add extra space to columns D and F
  sheet.setColumnWidth(4, sheet.getColumnWidth(4) + 30);
  sheet.setColumnWidth(6, sheet.getColumnWidth(6) + 30);
  sheet.setColumnWidth(7, sheet.getColumnWidth(7) + 40);
  sheet.setColumnWidth(8, sheet.getColumnWidth(8) + 20);
}

// Adds a new member to the bill form and auto-calculates the split
function addMember() {
  const membersDiv = document.getElementById('members');
  const memberDiv = document.createElement('div');
  memberDiv.className = 'member';
  memberDiv.appendChild(createDropdown(people, 'member-dropdown'));
  membersDiv.appendChild(memberDiv);
}

// Submits the form data to Google Apps Script
function submitForm(event) {
  event.preventDefault(); // Prevent default form submission

  const submitButton = document.getElementById('submitButton');
  submitButton.disabled = true;
  submitButton.textContent = 'Processing...';
  submitButton.style.backgroundColor = '#ccc';

  const totalAmount = parseFloat(document.querySelector('[name="amount"]').value);
  let totalSplit = 0;
  let totalDollarAmount = 0;
  let isValid = true;

  // Collect member splits or amounts
  const members = [...document.querySelectorAll('.member')].map(member => {
    const splitValue = parseFloat(member.querySelector('input[type="number"]').value);
    const memberName = $(member).find('select').val();

    if (splitType === 'percentage') {
      totalSplit += splitValue; // Sum percentages
    } else if (splitType === 'amount') {
      totalDollarAmount += splitValue; // Sum dollar amounts
    }

    return {
      name: memberName,
      split: splitValue
    };
  });

  // Validate based on Split Type
  if (splitType === 'percentage' && totalSplit > 100) {
    alert('The total split percentage cannot exceed 100%.');
    isValid = false;
  } else if (splitType === 'amount' && totalDollarAmount > totalAmount) {
    alert('The total amount of splits cannot exceed the total amount.');
    isValid = false;
  }

  if (isValid) {
    const formData = {
      uniqueId: JSON.parse('<?= formData ?>').uniqueId,
      description: document.querySelector('[name="description"]').value,
      date: document.querySelector('[name="date"]').value,
      totalAmount: totalAmount,
      splitType: splitType,
      payers: [...document.querySelectorAll('.payer')].map(payer => ({
        name: $(payer).find('select').val(),
        payerAmount: parseFloat(payer.querySelector('input[type="number"]').value),
      })),
      members: members,
    };

    google.script.run
      .withSuccessHandler(() => {
        google.script.host.close();
      })
      .withFailureHandler(error => {
        alert('An error occurred: ' + error.message);
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
        submitButton.style.backgroundColor = '#1abc9c';
      })
      .updateBillInSheet(formData);
  } else {
    submitButton.disabled = false;
    submitButton.textContent = 'Submit';
    submitButton.style.backgroundColor = '#1abc9c';
  }
}

// Creates folder structure for the bill entry
function createFolderStructure(parentFolder, uniqueId) {
  const folderName = parentFolder.getName();
  let mainFolder = getOrCreateFolder(folderName);

  const sheetName = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getName();
  let sheetFolder = getOrCreateFolderInFolder(mainFolder, sheetName);

  let entryFolder = getOrCreateFolderInFolder(sheetFolder, uniqueId.toString());
  return entryFolder.getUrl();  // Return the folder URL
}

// Retrieves or creates a folder by name
function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
}

// Retrieves or creates a folder within a parent folder by name
function getOrCreateFolderInFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : parentFolder.createFolder(folderName);
}

function showEditEntryForm() {
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
      html.people = JSON.stringify(getPeople());  // Pass the people data to the template as JSON
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

function updateBillInSheet(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const { uniqueId, description, date, totalAmount, splitType, members, payers } = data;
  const dataRange = sheet.getDataRange().getValues();
  let rowIndex = -1;

  // Find the row with the given Unique ID
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] == uniqueId) {
      rowIndex = i + 1; // Adjust for 1-based index
      break;
    }
  }

  if (rowIndex === -1) {
    SpreadsheetApp.getUi().alert('Unique ID not found.');
    return;
  }

  // Format the contribution split (percentage or amount)
  const contributionSplit = members.map(member => 
    splitType === 'percentage' ? `${member.name}: ${member.split}%` : `${member.name}: $${member.split}`
  ).join('\n');

  // Initialize and calculate balance split
  const balanceMap = new Map();
  members.forEach(member => {
    let contribution = member.split;
    if (splitType === 'percentage') {
      contribution = (totalAmount * member.split) / 100;
    }
    balanceMap.set(member.name, -contribution);
  });

  // Adjust balance for payers
  payers.forEach(payer => {
    const currentBalance = balanceMap.get(payer.name) || 0;
    balanceMap.set(payer.name, currentBalance + payer.payerAmount);
  });

  // Format the balance split
  const balanceSplit = Array.from(balanceMap.entries())
    .map(([name, balance]) => `${name}: ${balance >= 0 ? `+$${balance.toFixed(2)}` : `-$${Math.abs(balance).toFixed(2)}`}`)
    .join('\n');

  // Update the row with new data
  sheet.getRange(rowIndex, 2, 1, 6).setValues([[
    description,
    date,
    totalAmount,
    payers.map(p => `${p.name}: $${p.payerAmount}`).join('\n'),
    contributionSplit,
    balanceSplit
  ]]);

  // Update total amount and auto-resize columns
  updateTotalAmount();
  autoResizeColumnsD_F_G(sheet);
}