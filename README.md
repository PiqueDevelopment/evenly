# Evenly - Bill Splitting App :money_with_wings:

**Evenly** is a streamlined and efficient web application designed for easily splitting bills among multiple users. Whether for group dinners, shared events, or any communal expense, this app ensures that everyone pays their fair share. Developed for **Asha Hope Amanaki**, Evenly allows users to input details about shared expenses, automatically calculate individual contributions, and track balances for seamless settlement.

## Features 🚀

- **User-Friendly Interface**: Clean, intuitive form-based interface to input and manage bills.
- **Bill Entry**: Capture essential details of the bill including description, total amount, date, and participants.
- **Automatic Splitting**: Calculate contributions either by percentage or fixed amount. You can split the bill based on predefined shares or let the app automatically calculate the distribution.
- **Balance Calculation**: Easily track how much each person owes or is owed. The app provides a clear breakdown of who has paid and how the balance should be settled.
- **Dynamic Member Management**: Add or remove people involved in the bill, with real-time calculation adjustments.
- **Unique Bill ID**: Each bill entry is tagged with a unique identifier for easier tracking and reference.
- **Folder Integration**: Automatically generates a unique folder structure for each bill, storing related documents and links for easy access.
- **Responsive Design**: Fully responsive, providing a great experience on both desktop and mobile devices.

## Technologies Used 🛠️

- **HTML**: For structuring the app's user interface.
- **CSS**: For styling and layout of the app.
- **JavaScript**: To handle the app’s logic, calculations, and dynamic content updates.
- **Google Apps Script**: Used for backend functionality, including the generation of unique IDs and integration with Google Sheets to store and manage bill data.
- **Google Drive API**: To create and manage folder structures for each bill, facilitating document organization and sharing.

## User Workflow 👥

1. **Enter Bill Details**: Users input the bill description, date, total amount, and add participants (members).
2. **Define Payment Split**: Select whether the split should be based on percentages or fixed amounts. The app automatically calculates how much each person owes.
3. **Track Payments**: Specify who has paid and the amount paid. The app adjusts the balance and calculates how much each person needs to pay or receive to settle the bill.
4. **Submit**: Upon submission, the app saves the bill entry to Google Sheets and generates a unique folder for document management.

## Inputs 📝

Users will provide the following information to record a bill:

- **Description**: A brief description of the bill (e.g., "Dinner at restaurant").
- **Date**: The date when the bill was incurred.
- **Total Amount**: The total amount for the bill.
- **Contribution Type**: Either by percentage or dollar amount.
- **People Involved**: List of individuals sharing the bill and individuals who have paid.

## Outputs 📊

For each bill, the app generates the following outputs:

- **Unique ID**: A unique identifier for the bill entry.
- **Description**: The description provided by the user.
- **Date**: The date the bill was recorded.
- **Total Amount**: The total amount of the bill.
- **Who Paid**: Details of the individuals who paid, including the amount they contributed.
- **Contribution Split**: A breakdown of each person’s contribution, either as a percentage or fixed amount.
- **Balance Split**: The amount each individual owes or is owed after factoring in payments made.
- **Folder Link**: A Google folder where you can upload documents/files for that specific entry.

## Contribution 🤝

We welcome contributions to improve the Evenly app! If you would like to contribute, please fork the repository, make your changes, and submit a pull request.

For any questions or feedback, please reach out to:
- [Brendon Tran](mailto:brendontran21@gmail.com)
- [Dylan Liu](mailto:dliuninja@gmail.com)
