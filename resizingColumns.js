// Resizes columns D, F, G, and H with added padding and sets column B to wrapped style with adequate space
function autoResizeColumnsD_F_G(sheet) {
  sheet.autoResizeColumn(4);  // Resize column D (Total Amount)
  sheet.autoResizeColumn(6);  // Resize column F (Contribution Split)
  sheet.autoResizeColumn(7);  // Resize column G (Balance Split)
  sheet.autoResizeColumn(8);  // Resize column H (Folder Link)
  
  // Add extra space to columns D, F, G, and H
  sheet.setColumnWidth(4, sheet.getColumnWidth(4) + 30);
  sheet.setColumnWidth(6, sheet.getColumnWidth(6) + 30);
  sheet.setColumnWidth(7, sheet.getColumnWidth(7) + 40);
  sheet.setColumnWidth(8, sheet.getColumnWidth(8) + 20);

  // Set column B (Description) to wrapped style with adequate space
  sheet.setColumnWidth(2, 300); // Set column B width to 300
  sheet.getRange('B:B').setWrap(true); // Enable text wrapping for column B
}