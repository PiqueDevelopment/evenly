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

// Adds a new bill entry to the sheet
function addBillToSheet(data) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
    if (sheet.getLastRow() === 0) {
      // Add headers if the sheet is empty
      sheet.appendRow(['Unique ID', 'Description', 'Date', 'Total Amount', 'Who Paid', 'Contribution Split', 'Balance Split', 'Folder Link']);
      
      // Format the header row (bold, color, center alignment)
      var headerRange = sheet.getRange(1, 1, 1, 8);
      headerRange.setFontWeight('bold').setBackground('#e5e5fa').setFontColor('#333333').setHorizontalAlignment('left');
      
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

// Updates the total amount in the sheet and resizes columns
function updateTotalAmount() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Get all total amounts from column D (excluding the header)
    const totalAmountColumn = sheet.getRange('D2:D' + sheet.getLastRow()).getValues();
    
    // Calculate total sum
    const totalSum = totalAmountColumn.reduce((sum, row) => sum + (parseFloat(row[0]) || 0), 0);
    
    // Prepare the text for the cell
    const labelText = 'Total Amount: ';
    const amountText = '$' + totalSum.toFixed(2);
    
    // Create a RichText object
    const richText = SpreadsheetApp.newRichTextValue()
        .setText(labelText + amountText)
        .setTextStyle(labelText.length, labelText.length + amountText.length, 
            SpreadsheetApp.newTextStyle().setForegroundColor('red').setBold(true).build())  // Style the amount part
        .build();
    
    // Set the rich text value to cell D1
    sheet.getRange('D1').setRichTextValue(richText);
    
    // Auto-resize columns D and F based on content
    autoResizeColumnsD_F_G(sheet);
}

  
