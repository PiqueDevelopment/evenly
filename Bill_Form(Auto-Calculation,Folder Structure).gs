function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Bill Splitting')
    .addItem('Enter Bill Details', 'enterBillDetails')
    .addToUi();
}

function enterBillDetails() {
  const html = HtmlService.createHtmlOutputFromFile('BillForm')
    .setWidth(400)
    .setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, 'Enter Bill Details');
}

function addBillToSheet(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Check if sheet is empty and add headers if needed
  if (sheet.getLastRow() === 0) {
    const headers = [
      'Unique ID', 
      'Description', 
      'Date', 
      'Total Amount', 
      'Who Paid', 
      'Contribution Split', 
      'Balance Split', 
      'Entry Folder Link'
    ];
    
    sheet.appendRow(headers);
    
    // Style headers: bold text and pastel background
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#E5E5FA'); // Light pastel lavender color
  }
  
  // Set the unique ID to 1 for the first entry, or continue with the next number
  const lastRow = sheet.getLastRow();
  const uniqueId = lastRow === 0 ? 1 : lastRow; // If no rows, set to 1; otherwise, just use the row number.

  // Extract data from the input object
  const { description, date, amount, payer, splitType, documents, members } = data;
  
  // Format Contribution and Balance Split columns
  const contributionSplit = members.map(member => {
    const splitValue = splitType === 'percentage' ? `${member.split}%` : `$${member.split}`;
    return `${member.name}: ${splitValue}`;
  }).join('\n');
  
  const balanceSplit = members.map(member => {
    const balance = calculateBalanceSplit(member.split, amount, splitType, member.name === payer);
    return `${member.name}: ${balance}`;
  }).join('\n');
  
  // Convert documents to a comma-separated list
  const documentsList = documents.join(', ') || '';
  
  // Append data to the sheet
  sheet.appendRow([uniqueId, description, date, amount, payer, contributionSplit, balanceSplit, documentsList]);
  
  // Create a folder structure and link the folder URL
  const folderUrl = createFolderStructure(sheet.getParent(), uniqueId, documents);
  
  // Update the 'Documents' column with the folder URL
  sheet.getRange(lastRow + 1, 8).setValue(folderUrl); // 8th column is 'Documents'
}

function calculateBalanceSplit(split, totalAmount, splitType, isPayer) {
  const amount = splitType === 'percentage' ? (split / 100) * totalAmount : parseFloat(split);
  return isPayer ? `+$${(totalAmount - amount).toFixed(2)}` : `-$${amount.toFixed(2)}`;
}

function createFolderStructure(parentFolder, uniqueId, documents) {
  // Create a root folder based on the spreadsheet's name
  const folderName = parentFolder.getName();
  let mainFolder = getOrCreateFolder(folderName);

  // Get the sheet name to create a subfolder for each sheet
  const sheetName = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getName();

  // Create a subfolder for the current sheet
  let sheetFolder = getOrCreateFolderInFolder(mainFolder, sheetName);

  // Create a subfolder for the unique ID entry
  let entryFolder = getOrCreateFolderInFolder(sheetFolder, uniqueId.toString());

  // Return the URL to the entry folder
  return entryFolder.getUrl();
}

function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(folderName);
  }
}

function getOrCreateFolderInFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return parentFolder.createFolder(folderName);
  }
}


