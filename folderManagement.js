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
    const folder = folders.next();
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT); // Set permissions
    return folder;
  } else {
    Logger.log('Main folder not found, creating new one: ' + folderName); 
    const newFolder = DriveApp.createFolder(folderName);
    newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT); // Set permissions
    return newFolder;
  }
}

// Retrieves or creates a folder for the specific sheet inside the main folder
function getOrCreateSheetFolder(mainFolder, sheetName) {
  Logger.log('Checking if sheet folder exists: ' + sheetName);
  
  const folders = mainFolder.getFoldersByName(sheetName);
  if (folders.hasNext()) {
    // Folder with the same name already exists, log and return the existing folder
    Logger.log('Sheet folder found: ' + sheetName);
    const folder = folders.next();
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT); // Set permissions
    return folder;
  } else {
    // Folder does not exist, so create a new one
    Logger.log('Sheet folder not found, creating new one: ' + sheetName);
    const newFolder = mainFolder.createFolder(sheetName);
    newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT); // Set permissions
    return newFolder;
  }
}

// Retrieves or creates a folder for the unique bill entry inside the sheet folder
function getOrCreateEntryFolder(sheetFolder, uniqueId) {
  Logger.log('Checking if entry folder exists with unique ID: ' + uniqueId); 
  const folders = sheetFolder.getFoldersByName(uniqueId);
  if (folders.hasNext()) {
    Logger.log('Entry folder found with unique ID: ' + uniqueId); 
    const folder = folders.next();
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT); // Set permissions
    return folder;
  } else {
    Logger.log('Entry folder not found, creating new one with unique ID: ' + uniqueId); 
    const newFolder = sheetFolder.createFolder(uniqueId);
    newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT); // Set permissions
    return newFolder;
  }
}
