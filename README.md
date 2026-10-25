# 🐔 FreshNest – Chicken Delivery System

A modern full-stack **Chicken Delivery Web Application** built with React, Java 21, Spring Boot, and MySQL. FreshNest allows customers to browse fresh chicken products, manage shopping carts, place orders, view order details, manage delivery addresses, and maintain their profiles through a user-friendly interface.

The application also provides an Admin Dashboard for product management, order processing, return requests, and report generation with PDF export.

---

## 🚀 Project Overview

FreshNest is designed to simplify online chicken ordering and delivery management through a centralized web application.

Customers can explore chicken products, register or log in, add products to their cart, proceed to checkout, view their order history, manage delivery addresses, submit product reviews, and request returns.

Administrators can manage products, review and update customer orders, handle return requests, and generate reports, including downloadable PDF reports.

The application follows a full-stack architecture with a React frontend, a Spring Boot REST API backend, and a MySQL database.

---

## ✨ Key Features

### 🔐 Authentication and Security

- User Registration and Login
- JWT-Based Authentication
- Role-Based Access Control
- Protected Frontend Routes
- Password Hashing
- Forgot Password and Password Reset
- Authenticated API Requests
- Secure Access to Protected Resources

### 🛍️ Customer Module

Customers can:

- Browse Chicken Products
- View Product Information
- Add Products to Cart
- Update Cart Quantities
- Manage Shopping Cart
- Proceed to Checkout
- Place Orders
- View Order History
- View Order Details
- Manage Delivery Addresses
- Manage Customer Profile
- Submit Product Reviews
- Create Return Requests
- View Return Request Status

### 👨‍💼 Admin Module

Administrators can:

- Access the Admin Dashboard
- View Dashboard Statistics
- Add, Edit, and Manage Products
- View Customer Orders
- Update Order Status
- Manage Return Requests
- View Reports and Summary Information
- Generate and Download PDF Reports

### 🎨 User Interface

- FreshNest Branding
- Responsive React Interface
- Product Images
- User-Friendly Navigation
- Separate Customer and Admin Interfaces
- Dedicated Shopping Cart and Checkout Pages
- Order History and Order Details
- Customer Profile Management

---

## 🛠️ Technology Stack

### Frontend

- React.js
- JavaScript
- HTML5
- CSS3
- Axios
- React Router

### Backend

- Java 21
- Spring Boot 3.5.4
- Spring Web
- Spring Data JPA
- Spring Security
- JWT Authentication
- Maven
- REST APIs

### Database

- MySQL 8

### Development Tools

- Visual Studio Code
- MySQL Workbench / MySQL Command Line
- Postman
- Git
- GitHub
- Node.js and npm

---

## 🔄 Application Flow

### Customer Flow

```text
Guest Home Page
       |
       v
Browse Products / Login / Register
       |
       v
Customer Home Page
       |
       v
Browse Products
       |
       v
Add Products to Cart
       |
       v
Checkout
       |
       v
Place Order
       |
       v
My Orders
       |
       v
Order Details
       |
       v
Return Request
```

### Admin Flow

```text
Admin Login
     |
     v
Admin Dashboard
     |
     +---- Product Management
     |
     +---- Order Management
     |
     +---- Return Requests
     |
     +---- Reports
              |
              v
           PDF Export
```

---

## 👥 User Roles

### ADMIN

The administrator manages the application's operational activities.

- Access the Admin Dashboard
- Manage Products
- Review and Update Orders
- Handle Return Requests
- View Reports
- Generate PDF Reports

### CUSTOMER

Customers can use the application to purchase products online.

- Register and Log In
- Browse Products
- Manage Cart
- Place Orders
- Manage Delivery Addresses
- View Order History
- View Order Details
- Manage Profile
- Submit Product Reviews
- Request Returns

---

## 🏗️ Project Architecture

FreshNest uses a full-stack architecture in which the frontend communicates with the backend through REST APIs.

```text
FreshNest – Chicken Delivery System
              |
              v
       React Frontend
              |
         Axios / HTTP
              |
              v
    Spring Boot REST API
              |
      Spring Security + JWT
              |
              v
       Spring Data JPA
              |
              v
         MySQL Database
```

The frontend handles the user interface and API requests. The backend manages authentication, authorization, business logic, and database operations. MySQL stores application data.

---

## 📂 Project Structure

```text
Chicken-Delivery-System/
│
├── backend/
│   ├── .mvn/
│   │   └── wrapper/
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/
│       │   │   └── com/chickendelivery/
│       │   │       ├── config/
│       │   │       ├── controller/
│       │   │       ├── dto/
│       │   │       ├── entity/
│       │   │       ├── repository/
│       │   │       ├── security/
│       │   │       └── service/
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
```

---

## 🗄️ Database Overview

FreshNest uses MySQL to store and manage application data.

The backend includes entities and repositories for features such as:

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

The database schema and relationships are defined by the backend entity classes and application configuration.

---

## 🔌 Backend API

### Base URL

```text
http://localhost:8080/api
```

The frontend communicates with the backend through REST API endpoints. The exact endpoints depend on the controller implementation.

### 🔐 Authentication

- User Registration
- User Login
- Forgot Password
- Password Reset

### 🛍️ Customer Operations

- Product Browsing
- Cart Management
- Checkout and Order Placement
- Order History and Order Details
- Delivery Address Management
- Customer Profile Management
- Product Reviews
- Return Requests

### 👨‍💼 Admin Operations

- Dashboard Statistics
- Product Management
- Order Management
- Return Request Management
- Reports and PDF Export

---

## 🔐 JWT Authentication Flow

FreshNest uses JWT-based authentication to secure protected application features.

```text
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
Token Is Added to API Requests
          |
          v
JWT Authentication Filter
          |
          v
Token Validation and Authorization
          |
          v
Protected Resource Access
```

Passwords should be stored as secure hashes, and protected backend endpoints should enforce the appropriate authorization rules.

---

## ⚙️ Prerequisites

Install the following software before running the application:

- Java Development Kit (JDK) 21
- Node.js and npm
- MySQL Server
- Git
- Visual Studio Code or another suitable IDE

Verify your installations:

```bash
java -version
node -v
npm -v
git --version
```

---

## ▶️ How to Run the Project

### 1. Clone the Repository

Use the HTTPS URL available from your GitHub repository's **Code → HTTPS** option.

```bash
git clone https://github.com/manes hvedpathak307-sys/Chicken-Delivery-System.git
```

**Important:** Replace the example above with the exact clone URL provided by GitHub. Ensure the URL contains no spaces.

Open the project directory:

```bash
cd Chicken-Delivery-System
```

### 2. Configure MySQL

Start your MySQL server and create the database matching the name configured in your backend.

For example:

```sql
CREATE DATABASE chicken_delivery_db;
```

If `backend/src/main/resources/application.properties` specifies a different database name, use that name instead.

### 3. Configure Backend Settings

Open the following file:

```text
backend/src/main/resources/application.properties
```

Configure the required MySQL connection details and JWT signing secret.

Keep your actual database password, JWT secret, and other credentials out of the public GitHub repository. Use environment variables or a local configuration file excluded by `.gitignore`.

### 4. Run the Backend

Open a terminal in VS Code and run:

```bash
cd backend
```

On Windows Command Prompt:

```bash
mvnw.cmd spring-boot:run
```

Alternatively, if Maven is installed globally:

```bash
mvn spring-boot:run
```

The backend is expected to run at:

[http://localhost:8080](http://localhost:8080)

Confirm the actual port from your backend configuration and startup log.

### 5. Run the Frontend

Open a second terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install the required dependencies:

```bash
npm install
```

Check the backend API URL in:

```text
frontend/src/services/api.js
```

For local development, the API base URL is commonly:

```text
http://localhost:8080/api
```

Use the URL configured for your application.

Start the React frontend:

```bash
npm start
```

The frontend is expected to open at:

[http://localhost:3000](http://localhost:3000)

Keep both backend and frontend terminals running while testing the application.

---

## 📸 Application Screenshots

The following screenshots demonstrate the main FreshNest application pages.

### 1. Guest Home Page

![FreshNest Guest Home](./screenshots/01.Guest_Home.jpeg)

### 2. Login Page

![FreshNest Login Page](./screenshots/02.Login_Page.jpeg)

### 3. Create Account

![FreshNest Create Account](./screenshots/03.Create_Account.jpeg)

### 4. Admin Dashboard

![FreshNest Admin Dashboard](./screenshots/04.Admin_Dashboard.jpeg)

### 5. Admin Product Management

![FreshNest Admin Products](./screenshots/05.Admin_Products.jpeg)

### 6. Admin Order Management

![FreshNest Admin Orders](./screenshots/06.Admin_Orders.jpeg)

### 7. Admin Reports

![FreshNest Admin Reports](./screenshots/07.Admin_Reports.jpeg)

### 8. PDF Report

![FreshNest PDF Report](./screenshots/08.Report_pdf.jpeg)

### 9. Customer Home Page

![FreshNest Customer Home](./screenshots/09.User_Home.jpeg)

### 10. Product Catalogue

![FreshNest Products](./screenshots/10.User_Products.jpeg)

### 11. Shopping Cart

![FreshNest Shopping Cart](./screenshots/11.My_Cart.jpeg)

### 12. Checkout Page

![FreshNest Checkout](./screenshots/12.Checkout.jpeg)

### 13. Order Details

![FreshNest Order Details](./screenshots/13.Order_Details.jpeg)

### 14. My Orders

![FreshNest My Orders](./screenshots/14.User_Orders.jpeg)

### 15. Customer Profile

![FreshNest Customer Profile](./screenshots/15.My_Profile.jpeg)

---

## 🔒 Security and Configuration Notes

- Keep database credentials outside the public repository.
- Never publish real JWT signing secrets.
- Keep local secret files, build output, and dependency folders out of Git where appropriate.
- Enforce admin-only operations on the backend.
- Validate user input on the backend.
- Use HTTPS and appropriate production security settings when deploying.

For a college project, use safe demonstration credentials and document the required local configuration without exposing actual secrets.

---

## 🚀 Future Enhancements

- Online Payment Gateway Integration
- Live Order Tracking
- Delivery Partner Module
- Email and SMS Notifications
- Customer Order Notifications
- Improved Product Ratings and Reviews
- Inventory Management
- Cloud Deployment
- Automated Testing
- Improved Mobile Responsiveness

---

## 👨‍💻 Author

**Manesh Vedpathak**

**Full Stack Java Developer**

**Technologies:** React.js | Java 21 | Spring Boot | Spring Security | JWT | MySQL

**GitHub:** [Manesh Vedpathak](https://github.com/maneshvedpathak307-sys)

---

## ⭐ Support

If you find FreshNest interesting, consider starring the repository on GitHub.

Thank you for checking out **FreshNest – Chicken Delivery System!**