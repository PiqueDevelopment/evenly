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
  
  // If the 'People' sheet doesn't exist, show an alert message and return an empty array
  if (!sheet) {
    SpreadsheetApp.getUi().alert('No "People" sheet found. Please add names and emails to the "People" sheet.');
    return [];  // Return an empty array if sheet is not found
  }
  
  const data = sheet.getDataRange().getValues();  // Get all data from the sheet
  
  // Check if there is any data other than the header row
  if (data.length <= 1 || data[1][0] === "" || data[1][1] === "") {  // If no people data
    SpreadsheetApp.getUi().alert('No people found. Please add names and emails to the "People" sheet.');
    return [];  // Return an empty array if no people data is found
  }

  // Return the list of people (skipping the header row)
  return data.slice(1).map(row => ({ name: row[0], email: row[1] }));
}

// Opens the Bill Details form as a modal dialog
function enterBillDetails() {
  const people = getPeople();  // Get people list

  // If the people array is empty (no valid people data found), show an alert and don't open the form
  if (people.length === 0) {
    return;  // Exit the function early to prevent the form from opening
  }

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

  // If the people array is empty (no valid people data found), show an alert and don't open the form
  if (people.length === 0) {
    return;  // Exit the function early to prevent the form from opening
  }

  const html = HtmlService.createTemplateFromFile('BillForm');  // Create HTML form template
  html.people = JSON.stringify(people);  // Pass the people data to the template as JSON
  SpreadsheetApp.getUi().showModalDialog(
    html.evaluate().setWidth(400).setHeight(600),  // Show modal dialog with set dimensions
    'Add Entry'  // Set title of the dialog
  );
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