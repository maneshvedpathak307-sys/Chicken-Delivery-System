🐔 FreshNest – Chicken Delivery System

A modern full-stack Chicken Delivery Web Application built with React, Java 21, Spring Boot, and MySQL. FreshNest allows customers to browse fresh chicken products, manage their shopping carts, place orders, track order details, and manage their profiles through a simple and user-friendly interface.

The application also provides an Admin Dashboard for product management, order processing, return requests, and report generation.

---

📌 Project Overview

FreshNest is designed to simplify online chicken ordering and delivery management through a centralized web application.

Customers can explore products, register or log in, add products to their cart, proceed to checkout, view their orders, manage their profiles, and submit return requests.

Administrators can manage products, review customer orders, handle return requests, and generate reports, including PDF reports.

The application follows a full-stack architecture with a React frontend, a Spring Boot REST API backend, and a MySQL database.

---

✨ Key Features

🔐 Authentication and Security

- User Registration and Login
- JWT-Based Authentication
- Role-Based Access Control
- Protected Frontend Routes
- Secure Password Hashing
- Forgot Password and Password Reset
- Authenticated API Requests

🛍️ Customer Module

- Browse Chicken Products
- View Product Information
- Add Products to Cart
- Update Cart Quantities
- Manage Shopping Cart
- Checkout and Submit Orders
- View Orders and Order Details
- Manage Delivery Addresses
- Manage Customer Profile
- Submit Product Reviews
- Create Return Requests
- View Return Request Status

👨‍💼 Admin Module

- Admin Dashboard
- Product Management
- Add, Edit, and Manage Products
- View and Manage Customer Orders
- Update Order Status
- Manage Return Requests
- View Reports and Summary Information
- Generate and Download PDF Reports

🎨 User Interface

- Modern FreshNest Branding
- Responsive React Interface
- Product Images
- User-Friendly Navigation
- Customer and Admin Interfaces
- Dedicated Checkout and Order Pages

---

🧰 Technology Stack

Frontend

- React.js
- JavaScript
- HTML5
- CSS3
- Axios
- React Router

Backend

- Java 21
- Spring Boot 3.5.4
- Spring Web
- Spring Data JPA
- Spring Security
- JWT Authentication
- Maven
- REST APIs

Database

- MySQL 8

Development Tools

- Visual Studio Code
- MySQL Workbench / MySQL Command Line
- Postman
- Git
- GitHub
- Node.js and npm

---

🏗️ Project Architecture

                 FreshNest
                     |
          React Frontend Application
                     |
                Axios / HTTP
                     |
          Spring Boot REST Backend
                     |
        Spring Security + JWT
                     |
             Spring Data JPA
                     |
                MySQL Database

The React frontend communicates with the Spring Boot backend through REST APIs. The backend handles business logic, authentication, authorization, and database operations.

---

🔄 Application Flow

                 FreshNest
                     |
                  Home Page
                     |
          Browse Products / Sign In
                     |
              User Authentication
                     |
             Customer Dashboard
                     |
        ┌────────────┼────────────┐
        |            |            |
      Products      Cart       Profile
        |            |
        |         Checkout
        |            |
        |       Place Order
        |            |
        └────── My Orders
                     |
              Order Details
                     |
             Return Request

Admin Flow

Admin Login
     |
Admin Dashboard
     |
 ┌───┼───────────────┬──────────────┐
 |   |               |              |
Products           Orders         Returns
 Management        Management     Management
                     |
                   Reports
                     |
                 PDF Export

---

👥 User Roles

ADMIN

The administrator manages the application's operational activities.

- Access the Admin Dashboard
- Manage Products
- Review and Update Orders
- Handle Return Requests
- View Reports
- Generate PDF Reports

CUSTOMER

Customers can use the application to purchase products online.

- Register and Log In
- Browse Products
- Manage Cart
- Place Orders
- Manage Delivery Addresses
- View Order History
- Manage Profile
- Submit Reviews
- Request Returns

---

📂 Project Structure

Chicken-Delivery-System/
│
├── backend/
│   ├── .mvn/
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/chickendelivery/
│       │   │   ├── config/
│       │   │   ├── controller/
│       │   │   ├── dto/
│       │   │   ├── entity/
│       │   │   ├── repository/
│       │   │   ├── security/
│       │   │   └── service/
│       │   └── resources/
│       │       └── application.properties
│       └── test/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── images/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   └── user/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── package-lock.json
│
├── screenshots/
│   ├── 01.Guest_Home.jpeg
│   ├── 02.Login_Page.jpeg
│   ├── 03.Create_Account.jpeg
│   ├── 04.Admin_Dashboard.jpeg
│   ├── 05.Admin_Products.jpeg
│   ├── 06.Admin_Orders.jpeg
│   ├── 07.Admin_Reports.jpeg
│   ├── 08.Report_pdf.jpeg
│   ├── 09.User_Home.jpeg
│   ├── 10.User_Products.jpeg
│   ├── 11.My_Cart.jpeg
│   ├── 12.Checkout.jpeg
│   ├── 13.Order_Details.jpeg
│   ├── 14.User_Orders.jpeg
│   └── 15.My_Profile.jpeg
│
├── .gitignore
└── README.md

---

🗄️ Database Overview

FreshNest uses MySQL to persist application data.

The database includes entities and repositories for application features such as:

- Users
- Products
- Addresses
- Shopping Carts
- Cart Items
- Orders
- Order Items
- Payments
- Return Requests
- Reviews

The exact database schema and relationships are defined by the backend entity classes and application configuration.

---

🔐 Authentication Flow

FreshNest uses JWT-based authentication to secure protected application features.

User Enters Credentials
          |
          v
Frontend Sends Login Request
          |
          v
Backend Validates Credentials
          |
          v
JWT Token Is Generated
          |
          v
Frontend Receives Authentication Response
          |
          v
Authenticated API Requests
          |
          v
JWT Filter Validates Token
          |
          v
Authorized Resource Access

Passwords should be stored as secure hashes, and protected endpoints should enforce the appropriate authorization rules.

---

⚙️ Prerequisites

Install the following software before running the application:

- Java Development Kit (JDK) 21
- Node.js and npm
- MySQL Server
- Git
- Visual Studio Code or another suitable IDE

Verify your installations:

java -version
node -v
npm -v
git --version

---

▶️ How to Run the Project

1. Clone the Repository

git clone https://github.com/manes hvedpathak307-sys/Chicken-Delivery-System.git

Important: Replace the clone command above with the exact repository URL shown by GitHub's Code → HTTPS option before running it. Do not copy a URL containing spaces.

Then open the project folder:

cd Chicken-Delivery-System

2. Configure MySQL

Start your MySQL server and create the database required by your backend.

For example:

CREATE DATABASE chicken_delivery_db;

Use the database name configured by your actual application. If your "application.properties" specifies a different name, create that database instead.

3. Configure Backend Settings

Open:

backend/src/main/resources/application.properties

Configure the MySQL connection, JWT signing secret, and any other required settings.

Security reminder: Do not commit real database passwords, production JWT secrets, API keys, or other credentials to GitHub. Use environment variables or a local configuration file excluded by ".gitignore".

4. Run the Backend

Open a terminal in VS Code:

cd backend

On Windows Command Prompt, run:

mvnw.cmd spring-boot:run

If Maven is installed globally, you can also run:

mvn spring-boot:run

The backend is expected to start on:

http://localhost:8080

Confirm the actual port in the backend configuration and startup log.

5. Configure and Run the Frontend

Open a second terminal:

cd frontend

Install the required packages:

npm install

Verify the backend API URL in the frontend service configuration, usually:

frontend/src/services/api.js

For local development, the backend base URL is commonly:

http://localhost:8080/api

Use the exact base URL expected by your application.

Start React:

npm start

The frontend is expected to open at:

http://localhost:3000

Keep both the backend and frontend terminals running while testing the application.

---

📸 Application Screenshots

The following screenshots demonstrate the main FreshNest application pages.

1. Guest Home Page

![FreshNest Guest Home](./screenshots/01.Guest_Home.jpeg)

2. Login Page

![FreshNest Login Page](./screenshots/02.Login_Page.jpeg)

3. Create Account

![FreshNest Create Account](./screenshots/03.Create_Account.jpeg)

4. Admin Dashboard

![FreshNest Admin Dashboard](./screenshots/04.Admin_Dashboard.jpeg)

5. Admin Product Management

![FreshNest Admin Products](./screenshots/05.Admin_Products.jpeg)

6. Admin Order Management

![FreshNest Admin Orders](./screenshots/06.Admin_Orders.jpeg)

7. Admin Reports

![FreshNest Admin Reports](./screenshots/07.Admin_Reports.jpeg)

8. PDF Report

![FreshNest PDF Report](./screenshots/08.Report_pdf.jpeg)

9. Customer Home Page

![FreshNest Customer Home](./screenshots/09.User_Home.jpeg)

10. Product Catalogue

![FreshNest Products](./screenshots/10.User_Products.jpeg)

11. Shopping Cart

![FreshNest Shopping Cart](./screenshots/11.My_Cart.jpeg)

12. Checkout Page

![FreshNest Checkout](./screenshots/12.Checkout.jpeg)

13. Order Details

![FreshNest Order Details](./screenshots/13.Order_Details.jpeg)

14. My Orders

![FreshNest My Orders](./screenshots/14.User_Orders.jpeg)

15. Customer Profile

![FreshNest Customer Profile](./screenshots/15.My_Profile.jpeg)

---

🔒 Security and Configuration Notes

- Keep database credentials outside the public repository.
- Never publish real JWT signing secrets.
- Keep ".env", local secret files, build output, and dependency folders out of Git where appropriate.
- Use server-side authorization for admin-only operations.
- Validate user input on the backend.
- Use HTTPS and appropriate production security settings when deploying.

For a college project, use safe demonstration credentials and document the required local configuration without exposing actual secrets.

---

🚀 Future Enhancements

- Online Payment Gateway Integration
- Live Order Tracking
- Delivery Partner Module
- Email and SMS Notifications
- Customer Order Notifications
- Product Ratings and Reviews Improvements
- Inventory Management
- Cloud Deployment
- Automated Testing
- Improved Mobile Responsiveness

---

👨‍💻 Author

Manesh Vedpathak

Full Stack Java Developer

Technologies: React.js | Java 21 | Spring Boot | Spring Security | JWT | MySQL

GitHub: [Manesh Vedpathak](https://github.com/manes hvedpathak307-sys)

---

⭐ Support

If you find FreshNest interesting, consider starring the repository on GitHub.

Thank you for checking out FreshNest – Chicken Delivery System!