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

  // Update total amount and auto-resize columns
  updateTotalAmount();
  autoResizeColumnsD_F_G(sheet);
}

// Resizes columns D,F, and G with added padding
function autoResizeColumnsD_F_G(sheet) {
  sheet.autoResizeColumn(4);  // Resize column D (Total Amount)
  sheet.autoResizeColumn(6);  // Resize column F (Contribution Split)
  sheet.autoResizeColumn(7);  // Resize column G (Balance Split)
  
  // Add extra space to columns D and F
  sheet.setColumnWidth(4, sheet.getColumnWidth(4) + 30);
  sheet.setColumnWidth(6, sheet.getColumnWidth(6) + 30);
  sheet.setColumnWidth(6, sheet.getColumnWidth(6) + 40);
}

// Updates the contribution splits when a change is made
function updateSplit() {
  const splitType = document.querySelector('[name="splitType"]').value;
  const totalAmount = parseFloat(document.querySelector('[name="amount"]').value);
  
  if (!totalAmount) return;  // Exit if total amount is not set

  const members = document.querySelectorAll('.member');
  const payers = document.querySelectorAll('.payer');

  if (splitType === 'percentage') {
    let totalPercentagePaid = 0;

    // Sum up percentages of payers
    payers.forEach(payer => {
      totalPercentagePaid += parseFloat(payer.querySelector('input').value) || 0;
    });

    // Distribute remaining percentage among members
    members.forEach(member => {
      const currentSplit = parseFloat(member.querySelector('input').value) || 0;
      if (!currentSplit) {
        member.querySelector('input').value = ((100 - totalPercentagePaid) / members.length).toFixed(2);
      }
    });
  } else if (splitType === 'amount') {
    let totalAmountPaid = 0;

    // Sum up amounts paid by payers
    payers.forEach(payer => {
      totalAmountPaid += parseFloat(payer.querySelector('input').value) || 0;
    });

    // Distribute remaining amount among members
    members.forEach(member => {
      const currentSplit = parseFloat(member.querySelector('input').value) || 0;
      if (!currentSplit) {
        member.querySelector('input').value = ((totalAmount - totalAmountPaid) / members.length).toFixed(2);
      }
    });
  }
}

// Adds a new member to the bill form and auto-calculates the split
function addMember() {
  const membersDiv = document.getElementById('members');
  const memberDiv = document.createElement('div');
  memberDiv.className = 'member';
  memberDiv.appendChild(createDropdown(people, 'member-dropdown'));
  memberDiv.innerHTML += `<input type="number" step="0.01" placeholder="Split" oninput="updateSplit()">`;

  membersDiv.appendChild(memberDiv);
  
  // Recalculate splits after adding a member
  updateSplit();
}

// Submits the form data to Google Apps Script
function submitForm() {
  // Ensure the splits are up-to-date before submission
  updateSplit();

  const formData = {
    description: document.querySelector('[name="description"]').value,
    date: document.querySelector('[name="date"]').value,
    amount: parseFloat(document.querySelector('[name="amount"]').value),
    splitType: document.querySelector('[name="splitType"]').value,
    payers: [...document.querySelectorAll('.payer')].map(payer => ({
      name: payer.querySelector('.payer-dropdown').value,
      amount: parseFloat(payer.querySelector('input').value),
    })),
    members: [...document.querySelectorAll('.member')].map(member => ({
      name: member.querySelector('.member-dropdown').value,
      split: parseFloat(member.querySelector('input').value),
    })),
  };
  
  // Call the Google Apps Script function to process the form data
  google.script.run.addBillToSheet(formData);
  
  // Close the dialog after submission
  google.script.host.close();
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
