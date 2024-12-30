# **Evenly** - Bill Splitting App 💸

**Evenly** is a user-friendly and efficient web application designed to simplify the process of splitting bills among multiple users. Whether it's for a group dinner, shared event, or any communal expense, Evenly ensures that everyone pays their fair share. This app allows users to input bill details, automatically calculate individual contributions, and track balances for seamless settlement.

---

## **Features** 🚀

- **Intuitive Interface**: Clean, form-based UI to easily input and manage bills.
- **Bill Entry**: Quickly capture key details such as bill description, total amount, date, and participants.
- **Automatic Splitting**: Seamlessly switch between different split types, with automatic conversion based on the selected method.
- **Balance Tracking**: View real-time calculations of what each individual owes or is owed, making it easy to settle the bill.
- **Dynamic Member Management**: Effortlessly add or remove participants, with instant updates to bill splits.
- **Unique Bill ID**: Each bill entry is assigned a unique identifier for easy tracking and reference.
- **Folder Integration**: Automatically generates a Google Drive folder for each bill entry, storing relevant documents and links.
- **Responsive Design**: Fully responsive layout, ensuring a seamless experience across desktop and mobile devices.

---

## **Technologies Used** 🛠️

- **HTML**: For structuring the app’s interface.
- **CSS**: For styling the layout and design.
- **JavaScript**: Handles the app’s logic, calculations, and dynamic content updates.
- **Google Apps Script**: Powers backend functionality, generating unique IDs and integrating with Google Sheets for bill management.
- **Google Drive API**: Manages folder creation and document storage linked to each bill entry.

---

## **User Workflow** 👥

To add and manage bills in Evenly, follow these steps:

### 1. **Access the Bill Splitting Script**:
   - Open your Google Sheets document linked with the app.
   - In the top navigation bar, click on **Bill Splitting** to access the app's script.

### 2. **Add or Edit an Entry**:
   - Select **Add Entry** to create a new bill entry, or choose **Edit Entry** to modify an existing entry.

### 3. **Fill Out the Form**:
   - A form will appear where you can input the following details:
     - **Description**: A brief title or description of the bill (e.g., "Dinner at XYZ restaurant").
     - **Date**: The date the bill was incurred.
     - **Total Amount**: The full total amount of the bill.
     - **Contribution Type**: Choose whether the bill should be split by **Percentage** or **Dollar Amount**.
     - **Participants**: List the people sharing the bill.
     - **Payments**: Indicate which participants have already paid for the bill.

### 4. **Submit the Entry**:
   - After entering the necessary information, press the **Submit** button. This will:
     - Save the bill entry to the associated Google Sheet.
     - Generate a unique ID for the entry.
     - Create a folder in Google Drive to store any related documents for the bill.

---

## **Inputs** 📝

To add a bill, users will need to provide the following details:

- **Description**: A brief description of the bill (e.g., "Dinner at restaurant").
- **Date**: The date when the bill was incurred.
- **Total Amount**: The total amount of the bill.
- **Split Type**: Choose either **Percentage** or **Dollar Amount**.
- **People Involved**: A list of individuals who are sharing the bill and those who have already paid.

---

## **Outputs** 📊

Each bill entry will generate the following outputs:

- **Unique Bill ID**: A unique identifier for the bill.
- **Description**: The description provided by the user.
- **Date**: The date the bill was recorded.
- **Total Amount**: The total amount of the bill.
- **Who Paid**: A breakdown of the individuals who have made payments and the amounts they contributed.
- **Contribution Split**: A detailed list showing each person's share of the bill, calculated based on either percentage or fixed amount.
- **Balance Split**: The amount each individual owes or is owed after factoring in payments already made.
- **Folder Link**: A link to the Google Drive folder containing related documents for the bill.

---

## **Contribution** 🤝

We welcome contributions to enhance and improve the Evenly app! If you're interested in contributing, please fork the repository, make your changes, and submit a pull request.

For any questions or feedback, feel free to reach out to the development team:
- [Brendon Tran](mailto:brendontran21@gmail.com)
- [Dylan Liu](mailto:dliuninja@gmail.com)
