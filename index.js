const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User");
const Place = require("./models/Place");
const Booking = require("./models/Booking");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const imageDownloader = require("image-downloader");
const multer = require("multer");
const fs = require("fs");

//Creating an Express Application
const app = express();

// Middileware to enable cross-origin resource sharing in express application
app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URL,
  })
);

// Middleware to parse incoming JSON data from request body
app.use(express.json());

// Middleware to parse cookie header from http request
app.use(cookieParser());

// To serve static files to the client directly
app.use("/uploads", express.static(__dirname + "/uploads"));

// To generate random values and combined with the password before hashing
const bcryptSalt = bcrypt.genSaltSync(10);
const secretKey = "RANDOM_JWT_SECRET_KEY";

// To connect with MongoDB database
mongoose.connect(process.env.MONGO_URI);

// Function to get user information from cookies
// function getUserDataFromToken(req) {
//   return new Promise((resolve, reject) => {
//     jwt.verify(req.cookies.token, secretKey, {}, (err, userDoc) => {
//       if (err) reject(err);
//       resolve(userDoc);
//     });
//   });
// }

// To register and get login access
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (error) {
    res.status(422).json(error);
  }
});

// Login to the site, if you are already an user
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userDoc = await User.findOne({ email });
    if (userDoc) {
      const passOk = bcrypt.compareSync(password, userDoc.password);
      if (passOk) {
        jwt.sign(
          { email: userDoc.email, id: userDoc._id },
          secretKey,
          {},
          (error, token) => {
            if (error) throw error;
            res
              .cookie("token", token)
              .json({
                _id: userDoc._id,
                email: userDoc.email,
                name: userDoc.name,
              });
          }
        );
      } else {
        res.status(422).json("password incorrect");
      }
    } else {
      res.status(404).json("User not found. please enter valid details");
    }
  } catch (error) {
    res.status(400).json(error);
  }
});

// To set user details available after login
app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, secretKey, {}, async (err, userData) => {
      if (err) throw err;
      const { name, email, _id } = await User.findById(userData.id);
      res.json({ name, email, _id });
    });
  } else {
    res.json(null);
  }
});

// Logout from the website
app.post("/logout", (req, res) => {
  res.cookie("token", "").json(true);
});

// add a photo using image link
app.post("/upload-by-link", async (req, res) => {
  const { link } = req.body;
  const newName = "photo" + Date.now() + ".jpeg";
  await imageDownloader.image({
    url: link,
    dest: __dirname + "/uploads/" + newName,
  });
  res.json(newName);
});

// Middleware to handle multipart form data
const photosMiddleware = multer({ dest: "uploads/" });

// upload files to the static folder. uploaded file is available in req.files
app.post("/upload", photosMiddleware.array("photos", 100), (req, res) => {
  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const { originalname, path } = req.files[i];
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    const newPath = path + "." + ext;
    fs.renameSync(path, newPath);
    uploadedFiles.push(newPath.replace("uploads\\", ""));
  }
  res.json(uploadedFiles);
});

// To create new places
app.post("/places", (req, res) => {
  const { token } = req.cookies;
  const {
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuest,
    price,
  } = req.body;

  jwt.verify(token, secretKey, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.create({
      owner: userData.id,
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuest,
      price,
    });
    res.json(placeDoc);
  });
});

// Route to get all places registered/added by the user
app.get("/user-places", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, secretKey, {}, async (err, userData) => {
    if (err) throw err;
    const placeData = await Place.find({ owner : userData.id});
    res.json(placeData)
  })
});

// Route used in Two places in this App for getting Place details using id of the place
app.get("/places/:id", async (req, res) => {
  const { id } = req.params;
  const placeData = await Place.findById(id);
  res.json(placeData);
});

// Edit place informations in DB using id of the place
app.put("/places/:id", async (req, res) => {
  const { id } = req.params;
  const {
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuest,
    price,
  } = req.body;
  const { token } = req.cookies;
  jwt.verify(token, secretKey, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.findById(id);
    if (userData.id === placeDoc.owner.toString()) {
      placeDoc.set({
        title,
        address,
        photos: addedPhotos,
        description,
        perks,
        extraInfo,
        checkIn,
        checkOut,
        maxGuest,
        price,
      });
      await placeDoc.save();
      res.json("ok");
    }
  });
});

//Route to get all places stored in database for index page
app.get("/places", async (req, res) => {
  res.json(await Place.find());
});

//Route to book a place and store booking informations in db
app.post("/bookings", (req, res) => {
  const {token} = req.cookies;
  jwt.verify(token, secretKey, {}, async (err, userData) => {
    if (err) throw err;
    const { place, checkIn, checkOut, numberOfNights, name, phone, price } = req.body;
    const bookingData = await Booking.create({
      place, checkIn, checkOut, user: userData.id,
      numberOfNights, name, phone, price,
    });
    res.json(bookingData);
  })
});

// Route to get all bookings made by the user
app.get("/bookings", (req, res) => {
  const {token} = req.cookies;
  jwt.verify(token, secretKey, {}, async (err, userData) => {
    if (err) throw err;
    res.json(await Booking.find({ user: userData.id }).populate("place"));
  })  
});

// start a web server and listen incomming http requests on a specific port
app.listen(process.env.PORT, () => {
  console.log("Express app running...");
});
