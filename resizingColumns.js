// Resizes columns D,F, and G with added padding
function autoResizeColumnsD_F_G(sheet) {
    sheet.autoResizeColumn(4);  // Resize column D (Total Amount)
    sheet.autoResizeColumn(6);  // Resize column F (Contribution Split)
    sheet.autoResizeColumn(7);  // Resize column G (Balance Split)
    sheet.autoResizeColumn(8);  // Resize column G (Balance Split)
    
    // Add extra space to columns D and F
    sheet.setColumnWidth(4, sheet.getColumnWidth(4) + 30);
    sheet.setColumnWidth(6, sheet.getColumnWidth(6) + 30);
    sheet.setColumnWidth(7, sheet.getColumnWidth(7) + 40);
    sheet.setColumnWidth(8, sheet.getColumnWidth(8) + 20);
  }
  