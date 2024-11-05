// Saved as JavaScript .js file for IDE syntax highlighting
// Should be Google Script .gs file in Google Apps Script

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
        'Receipt Link'
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
    const { description, date, amount, payer, splitType, receiptLink, members } = data;
    
    // Format Contribution and Balance Split columns
    const contributionSplit = members.map(member => {
      const splitValue = splitType === 'percentage' ? `${member.split}%` : `$${member.split}`;
      return `${member.name}: ${splitValue}`;
    }).join('\n');
    
    const balanceSplit = members.map(member => {
      const balance = calculateBalanceSplit(member.split, amount, splitType, member.name === payer);
      return `${member.name}: ${balance}`;
    }).join('\n');
    
    // Append data to the sheet
    sheet.appendRow([
      uniqueId,
      description,
      date,
      amount,
      payer,
      contributionSplit,
      balanceSplit,
      receiptLink || '' // Optional receipt link
    ]);
  }
  
  function calculateBalanceSplit(split, totalAmount, splitType, isPayer) {
    const amount = splitType === 'percentage' ? (split / 100) * totalAmount : parseFloat(split);
    return isPayer ? `+$${(totalAmount - amount).toFixed(2)}` : `-$${amount.toFixed(2)}`;
  }
  