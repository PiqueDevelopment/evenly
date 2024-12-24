// Creates folder structure for the bill entry
function createFolderStructure(parentFolder, uniqueId) {
  // Test if parentFolder is defined and has a name
  if (!parentFolder) {
    Logger.log('Error: parentFolder is undefined or null.');
    return 'Error: parentFolder is undefined or null.';
  }
  if (!parentFolder.getName()) {
    Logger.log('Error: parentFolder does not have a name.');
    return 'Error: parentFolder does not have a name.';
  }

  Logger.log('Parent Folder Name: ' + parentFolder.getName());

  const folderName = parentFolder.getName();
  let mainFolder = getOrCreateMainFolder(folderName);

  const sheetName = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getName();
  Logger.log('Sheet Name: ' + sheetName);

  let sheetFolder = getOrCreateSheetFolder(mainFolder, sheetName);

  Logger.log('Creating entry folder with unique ID: ' + uniqueId);
  let entryFolder = getOrCreateEntryFolder(sheetFolder, uniqueId.toString());
  Logger.log('Created Entry Folder URL: ' + entryFolder.getUrl());

  return entryFolder.getUrl();  // Return the folder URL
}

// Retrieves or creates the main folder by name
function getOrCreateMainFolder(folderName) {
Logger.log('Checking if main folder exists: ' + folderName);  
const folders = DriveApp.getFoldersByName(folderName);
if (folders.hasNext()) {
  Logger.log('Main folder found: ' + folderName); 
  return folders.next();
} else {
  Logger.log('Main folder not found, creating new one: ' + folderName); 
  return DriveApp.createFolder(folderName);
}
}

// Retrieves or creates a folder for the specific sheet inside the main folder
function getOrCreateSheetFolder(mainFolder, sheetName) {
Logger.log('Checking if sheet folder exists: ' + sheetName);
const folders = mainFolder.getFoldersByName(sheetName);
if (folders.hasNext()) {
  Logger.log('Sheet folder found: ' + sheetName);
  return folders.next();
} else {
  Logger.log('Sheet folder not found, creating new one: ' + sheetName); 
  return mainFolder.createFolder(sheetName);
}
}

// Retrieves or creates a folder for the unique bill entry inside the sheet folder
function getOrCreateEntryFolder(sheetFolder, uniqueId) {
Logger.log('Checking if entry folder exists with unique ID: ' + uniqueId); 
const folders = sheetFolder.getFoldersByName(uniqueId);
if (folders.hasNext()) {
  Logger.log('Entry folder found with unique ID: ' + uniqueId); 
  return folders.next();
} else {
  Logger.log('Entry folder not found, creating new one with unique ID: ' + uniqueId); 
  return sheetFolder.createFolder(uniqueId);
}
}