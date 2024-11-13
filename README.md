# Evenly - Bill Splitting App

A simple and efficient app designed for splitting bills among multiple people. Developed for **Asha Hope Amanaki**, this app allows users to input details about a shared expense, calculate individual contributions, and track balances, ensuring everyone pays their fair share.

## Technologies Used

- **HTML**: For structuring the app's user interface.
- **CSS**: For styling and layout of the app.
- **JavaScript**: To handle the logic for bill splitting, calculations, and dynamic updates.
- **Google Apps Script**: Used for backend logic, such as generating unique IDs and storing data in Google Sheets.

## Features

- **Bill Entry**: Allows users to input details of a bill, including the description, total amount, date, and list of people involved.
- **Automatic Splitting**: Calculates individual contributions either as percentages or fixed amounts.
- **Balance Calculation**: Provides a breakdown of how much each person owes or is owed.
- **Unique ID Generation**: Each entry is tagged with a unique identifier for easy tracking.
- **Wrap Text for Description**: Ensures that long descriptions of the bill are properly wrapped for better readability.

## Input

Users will provide the following information to record a bill:

1. **Description**: A brief description of the bill (e.g., "Dinner at restaurant").
2. **Date**: The date the bill was incurred.
3. **Total Amount**: The total cost of the bill.
4. **People**: A list of individuals sharing the bill.

## Output

The app generates the following outputs for each bill:

1. **Unique ID**: A unique identifier for the bill entry.
2. **Description**: The description provided, with text wrapping for clarity.
3. **Date**: The date the bill was recorded.
4. **Total Amount**: The total cost of the bill.
5. **Who Paid**: Information about who paid the bill.
6. **Contribution Split**: A breakdown of the contribution for each person, either as a percentage of the total amount or a fixed dollar amount.
7. **Balance Split**: The amount each person needs to pay or receive to settle the bill.
