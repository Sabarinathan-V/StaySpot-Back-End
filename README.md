# Backend API Documentation

This repository contains the backend API code for [StaySpot Booking App](https://stayspot.netlify.app/).
The API is built using Node.js with Express as the web framework, and it communicates with a MongoDB database to store and retrieve data.

## Prerequisites

Before running the backend API, ensure you have the following dependencies installed on your system:

- Node.js (https://nodejs.org/)
- MongoDB (https://www.mongodb.com/)

## Getting Started

1. Clone this repository to your local machine:

  - git clone [repository_url]
  - cd [repository_name]

2. Install the required Node.js packages:
   
   - npm install

3. Set up your environment variables:
  Create a .env file in the root of the project and define the following environment variables:

  - MONGO_URI=your_mongodb_connection_string
  - FRONTEND_URL=your_frontend_url
  
  Replace your_mongodb_connection_string with the connection string to your MongoDB database, and your_frontend_url with the URL of your frontend application (for handling CORS).

4. Start the server:

  - npm start
  
  The backend API will be running on the specified port (defined in the .env file).

## Endpoints

- POST /register :
Registers a new user and returns user details as JSON.

- POST /login :
Allows existing users to log in and returns a JSON Web Token (JWT) upon successful authentication.

- GET /profile :
Retrieves the user's profile details using the JWT stored in a cookie.

- POST /logout :
Logs out the user and clears the JWT cookie.

- POST /upload-by-link : 
Downloads an image from a given URL and saves it to the server's uploads directory.

- POST /upload :
Handles multipart form data to upload images to the server's uploads directory.

- POST /places :
Creates a new place entry in the database.

- GET /user-places :
Retrieves all places registered/added by the user.

- GET /places/:id :
Retrieves place details using the place ID.

- PUT /places/:id :
Updates place information in the database using the place ID.

- GET /places :
Retrieves all places stored in the database for the index page.

- POST /bookings :
Creates a new booking entry in the database.

- GET /bookings :
Retrieves all bookings made by the user.

## Deployed API

You can access my API at [API Link](https://stayspot-backend.onrender.com).
