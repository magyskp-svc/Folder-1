# System Architecture Diagram

## Overview
This project follows a simple three-layer architecture:
1. Client layer
2. Application layer
3. Data layer

## Diagram (text form)
```text
+------------------------+
|      User / Browser    |
|  - Student Form        |
|  - Records Table      |
|  - Login / Roles      |
+-----------+------------+
            |
            | HTTP Requests
            v
+------------------------+
|   Node.js + Express    |
|  - Authentication      |
|  - Role-based access   |
|  - CRUD APIs          |
|  - Security middleware |
+-----------+------------+
            |
            | Database Queries
            v
+------------------------+
|   Database Layer       |
|  - SQLite (Dev)       |
|  - PostgreSQL (Prod)  |
|  - Student Records    |
|  - Users & Roles      |
+------------------------+
```

## Component Explanation

### Client Layer
- Browser-based frontend
- HTML, CSS, JavaScript
- Displays the UI and sends requests

### Application Layer
- Express server
- Handles authentication, routing, validation, and CRUD operations
- Protects API endpoints using roles and security middleware

### Data Layer
- Stores student information and user roles
- SQLite is used in development
- PostgreSQL is recommended for production

## Deployment View
```text
User --> Browser --> Express Server --> Database
                      |                |
                      |                +--> SQLite (Dev)
                      +--> HTTPS / Hosting / Cloud --> PostgreSQL (Prod)
```

## Can this be viewed in Visio or Miro?
Yes.

### In Visio
- Copy the text diagram into a Visio diagram page
- Use basic shapes like rectangle, arrow, and database icon
- Add labels for each layer

### In Miro
- Paste the same content into a board
- Use boxes and connectors
- You can also turn it into a simple flowchart

## Suggested visual style
- Blue for frontend
- Green for backend
- Orange for database
- Red for security/authentication
