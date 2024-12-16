function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Bill Splitting')
    .addItem('Enter Bill Details', 'enterBillDetails')
    .addToUi();
}

function getPeople() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('People');
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  return data.slice(1).map(row => ({ name: row[0], email: row[1] }));
}

function enterBillDetails() {
  const people = getPeople(); // Returns an array of objects: [{ name: "John Doe", email: "john@example.com" }, ...]
  const html = HtmlService.createTemplateFromFile('BillForm');
  html.people = JSON.stringify(people); // Properly encode as JSON string
  SpreadsheetApp.getUi().showModalDialog(
    html.evaluate().setWidth(400).setHeight(600),
    'Enter Bill Details'
  );
}

function updateTotalAmount() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Get the values from column D (Total Amount), excluding the header row
  const totalAmountColumn = sheet.getRange('D2:D' + sheet.getLastRow()).getValues();
  
  // Calculate the sum of all values in column D
  const totalSum = totalAmountColumn.reduce((sum, row) => sum + (parseFloat(row[0]) || 0), 0);
  
  // Set the total sum to cell A1 (top left box)
  sheet.getRange('D1').setValue('Total Amount: $' + totalSum.toFixed(2));
  
  // Auto-resize columns D and F based on row 1 content
  autoResizeColumnsDAndF(sheet);
}

function addBillToSheet(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (sheet.getLastRow() === 0) {
    // Add headers if the sheet is empty
    sheet.appendRow(['Unique ID', 'Description', 'Date', 'Total Amount', 'Who Paid', 'Contribution Split', 'Balance Split', 'Folder Link']);
    
    // Get the range of the header row
    var headerRange = sheet.getRange(1, 1, 1, 8); // 1 row, 8 columns
    
    // Set the font weight to bold
    headerRange.setFontWeight('bold');
    
    // Set the background color
    headerRange.setBackground('#f0f0f0');
    
    // Set the font color
    headerRange.setFontColor('#333333');
    
    // Set the horizontal alignment to center
    headerRange.setHorizontalAlignment('center');
    
    // Freeze the header row
    sheet.setFrozenRows(1);
  }

  const lastRow = sheet.getLastRow();
  const uniqueId = lastRow === 0 ? 1 : lastRow;

  const { description, date, totalAmount, splitType, members, payers } = data;

  // Format the contribution split
  const contributionSplit = members
    .map(member => {
      if (splitType === 'percentage') {
        return `${member.name}: ${member.split}%`;
      } else {
        return `${member.name}: $${member.split}`;
      }
    })
    .join('\n');

  // Calculate the balance split
  const balanceMap = new Map();

  // Initialize balance map with members' contributions
  members.forEach(member => {
    let contribution = member.split;
    if (splitType === 'percentage') {
      contribution = (totalAmount * member.split) / 100;
    }
    balanceMap.set(member.name, -contribution);
  });

  // Adjust balance map with payers' payments
  payers.forEach(payer => {
    const currentBalance = balanceMap.get(payer.name) || 0;
    balanceMap.set(payer.name, currentBalance + payer.payerAmount);
  });

  // Format the balance split
  const balanceSplit = Array.from(balanceMap.entries())
    .map(([name, balance]) => {
      const formattedBalance = balance >= 0 ? `+$${balance.toFixed(2)}` : `-$${Math.abs(balance).toFixed(2)}`;
      return `${name}: ${formattedBalance}`;
    })
    .join('\n');

  const folderUrl = createFolderStructure(sheet.getParent(), uniqueId);

  sheet.appendRow([
    uniqueId,
    description,
    date,
    totalAmount,
    payers.map(p => `${p.name}: $${p.payerAmount}`).join('\n'),
    contributionSplit,
    balanceSplit,
    folderUrl,
  ]);

  updateTotalAmount();

  // Auto-resize columns D and F based on row 1 content
  autoResizeColumnsDAndF(sheet);
}

function autoResizeColumnsDAndF(sheet) {
  // Resize column D (Total Amount) and column F (Contribution Split) with added padding
  sheet.autoResizeColumn(4); // Column D (Total Amount)
  sheet.autoResizeColumn(6); // Column F (Contribution Split)
  
  // Add extra space to the left and right of column D and F
  sheet.setColumnWidth(4, sheet.getColumnWidth(4) + 30); // Add 30px extra space to column D
  sheet.setColumnWidth(6, sheet.getColumnWidth(6) + 30); // Add 30px extra space to column F
}


function updateSplit() {
  const splitType = document.querySelector('[name="splitType"]').value;
  const totalAmount = parseFloat(document.querySelector('[name="amount"]').value);
  
  if (!totalAmount) return;  // Exit if total amount is not set

  const members = document.querySelectorAll('.member');
  const payers = document.querySelectorAll('.payer');

  if (splitType === 'percentage') {
    let totalPercentagePaid = 0;

    // Sum up the percentages of the payers
    payers.forEach(payer => {
      totalPercentagePaid += parseFloat(payer.querySelector('input').value) || 0;
    });

    // Distribute the remaining percentage among members
    members.forEach(member => {
      const currentSplit = parseFloat(member.querySelector('input').value) || 0;
      if (!currentSplit) {
        member.querySelector('input').value = ((100 - totalPercentagePaid) / members.length).toFixed(2);
      }
    });
  } else if (splitType === 'amount') {
    let totalAmountPaid = 0;

    // Sum up the amounts paid by the payers
    payers.forEach(payer => {
      totalAmountPaid += parseFloat(payer.querySelector('input').value) || 0;
    });

    // Distribute the remaining amount among members
    members.forEach(member => {
      const currentSplit = parseFloat(member.querySelector('input').value) || 0;
      if (!currentSplit) {
        member.querySelector('input').value = ((totalAmount - totalAmountPaid) / members.length).toFixed(2);
      }
    });
  }
}


function addMember() {
  const membersDiv = document.getElementById('members');
  const memberDiv = document.createElement('div');
  memberDiv.className = 'member';
  memberDiv.appendChild(createDropdown(people, 'member-dropdown'));
  memberDiv.innerHTML += `<input type="number" step="0.01" placeholder="Split" oninput="updateSplit()">`;

  // Automatically fill the "Split" field based on split type and total amount
  const splitType = document.querySelector('[name="splitType"]').value;
  const totalAmount = parseFloat(document.querySelector('[name="amount"]').value);

  if (splitType && totalAmount) {
    if (splitType === 'percentage') {
      const members = document.querySelectorAll('.member');
      const totalPercentage = Array.from(members).reduce((total, member) => {
        const splitValue = parseFloat(member.querySelector('input').value) || 0;
        return total + splitValue;
      }, 0);
      
      // Default to an equal split for each new member if there's space
      const remainingPercentage = 100 - totalPercentage;
      const remainingMembers = members.length;
      const equalSplit = (remainingPercentage / remainingMembers).toFixed(2);
      memberDiv.querySelector('input').value = equalSplit;
    } else if (splitType === 'amount') {
      const totalAmountPaid = Array.from(document.querySelectorAll('.payer input'))
        .reduce((total, input) => total + parseFloat(input.value) || 0, 0);
      
      const remainingAmount = totalAmount - totalAmountPaid;
      const remainingMembers = document.querySelectorAll('.member').length;
      const equalAmount = (remainingAmount / remainingMembers).toFixed(2);
      memberDiv.querySelector('input').value = equalAmount;
    }
  }

  membersDiv.appendChild(memberDiv);
  updateSplit();  // Recalculate the splits after adding a member
}

function addMember() {
  const membersDiv = document.getElementById('members');
  const memberDiv = document.createElement('div');
  memberDiv.className = 'member';
  memberDiv.appendChild(createDropdown(people, 'member-dropdown'));
  memberDiv.innerHTML += `<input type="number" step="0.01" placeholder="Split" oninput="updateSplit()">`;
  membersDiv.appendChild(memberDiv);

  // Automatically calculate the split when a new member is added
  updateSplit();  // Call this after adding a member to ensure the splits are updated
}


function submitForm() {
  // Ensure split calculations are up-to-date before submission
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
  
  // Call Google Apps Script function to process the form
  google.script.run.addBillToSheet(formData);
  
  // Close the dialog after submission
  google.script.host.close();
}


function createFolderStructure(parentFolder, uniqueId) {
  const folderName = parentFolder.getName();
  let mainFolder = getOrCreateFolder(folderName);

  const sheetName = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getName();
  let sheetFolder = getOrCreateFolderInFolder(mainFolder, sheetName);

  let entryFolder = getOrCreateFolderInFolder(sheetFolder, uniqueId.toString());
  return entryFolder.getUrl();
}

function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
}

function getOrCreateFolderInFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : parentFolder.createFolder(folderName);
}
