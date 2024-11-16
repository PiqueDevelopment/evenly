function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Bill Splitting')
    .addItem('Enter Bill Details', 'enterBillDetails')
    .addToUi();
}

function enterBillDetails() {
  const html = HtmlService.createHtmlOutputFromFile('BillAddEntries_form')
    .setWidth(400)
    .setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, 'Enter Bill Details');
}

function addBillToSheet(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid or undefined data passed to the function.');
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const sheetName = sheet.getName(); // Get the active sheet's name

  // Check if the sheet is empty and add headers if needed
  if (sheet.getLastRow() === 0) {
    const headers = [
      'Unique ID',
      'Description',
      'Date',
      'Total Amount',
      'Who Paid',
      'Contribution Split',
      'Balance Split',
      'Documents Folder Link'
    ];

    sheet.appendRow(headers);

    // Style headers: bold text and pastel background
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#E5E5FA'); // Light pastel lavender color
  }

  // Get the row number for the new entry and set it as a unique ID
  const lastRow = sheet.getLastRow() + 1;
  const uniqueId = lastRow;

  // Extract data from the input object
  const { description, date, amount, payers, splitType, members, uploadedFiles } = data;

  // Create a root folder for the entire Google Sheet (if it doesn't exist)
  const rootFolder = getOrCreateRootFolder();

  // Create a subfolder for this sheet
  const sheetFolder = getOrCreateSheetFolder(rootFolder, sheetName);

  // Create a subfolder for this specific bill entry
  const entryFolder = sheetFolder.createFolder(`Entry_${uniqueId}`);
  const entryFolderLink = entryFolder.getUrl(); // Get the URL of the folder

  // Upload documents to the subfolder
  if (uploadedFiles && uploadedFiles.length > 0) {
    uploadedFiles.forEach(file => {
      const decodedFile = Utilities.base64Decode(file.data);
      const blob = Utilities.newBlob(decodedFile, file.mimeType, file.name);
      entryFolder.createFile(blob);
    });
  }

  // Prepare the row data to insert
  const row = [
    uniqueId, 
    description, 
    date, 
    amount, 
    payers.join(', '), 
    members.map(member => `${member.name}: ${member.split}`).join(', '), 
    "",  // For balance split, calculate dynamically or leave it blank for now
    entryFolderLink  // Link to the entry's folder in Google Drive
  ];

  // Append the row to the sheet
  sheet.appendRow(row);
}

function getOrCreateRootFolder() {
  const rootFolder = DriveApp.getFoldersByName('Bill Entries').hasNext()
    ? DriveApp.getFoldersByName('Bill Entries').next()
    : DriveApp.createFolder('Bill Entries');
  return rootFolder;
}

function getOrCreateSheetFolder(rootFolder, sheetName) {
  const sheetFolder = rootFolder.getFoldersByName(sheetName).hasNext()
    ? rootFolder.getFoldersByName(sheetName).next()
    : rootFolder.createFolder(sheetName);
  return sheetFolder;
}
