const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const app = express();
const port = 3000;
const cors = require("cors");

const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(cors());
require('dotenv').config({ path: '.env.local'});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const jwt = require("jsonwebtoken");
const User = require("./models/user.model");
const Chat = require("./models/message.model");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.log("Error connecting to MongoDB");
  });

app.listen(port, () => {
  console.log("Server is running on 3000");
});


//endpoint to register a user to the backend
app.post("/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;
  
      //check if the email is already registered
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log("Email already registered");
        return res.status(400).json({ message: "Email already registered" });
      }
  
      //create a new User
      const newUser = new User({
        name,
        email,
        password,
      });
  
      //generate the verification token
      newUser.verificationToken = crypto.randomBytes(20).toString("hex");
  
      //save the user to the database
      await newUser.save();
  
      //send the verification email to the registered user
      sendVerificationEmail(newUser.email, newUser.verificationToken);
  
      res
        .status(200)
        .json({ message: "User registered successfully", userId: newUser._id });
    } catch (error) {
      console.log("Error registering user", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });
  const sendVerificationEmail = async (email, verificationToken) => {
    const transpoter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER,
        pass: process.env.PASS,
      },
    });
  
    const mailOptions = {
      from: process.env.FROM,
      to: email,
      subject: "Email verification",
      text: `Please click on the following link to verify your email : http://localhost:3000/verify/${verificationToken}`,
    };
  
    //send the mail
    try {
      await transpoter.sendMail(mailOptions);
    } catch (error) {
      console.log("Error sending the verification email");
    }
  };



  
//verify the user
app.get("/verify/:token", async (req, res) => {
    try {
      const token = req.params.token;
  
      const user = await User.findOne({ verificationToken: token });
      if (!user) {
        return res.status(404).json({ message: "Invalid verification token" });
      }
  
      //mark the user as verified
      user.verified = true;
      user.verificationToken = undefined;
  
      await user.save();
  
      res.status(200).json({ message: "Email verified Sucesfully" });
    } catch (error) {
      console.log("errror", error);
      res.status(500).json({ message: "Email verification failed" });
    }
  });
  
  const generateSecretKey = () => {
    const secretKey = crypto.randomBytes(32).toString("hex");
  
    return secretKey;
  };
  
  const secretKey = generateSecretKey();
  
  //endpoint to login
  app.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
  
      //check if the user exists already
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
  
      //check in password is correct
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalide password" });
      }
  
      const token = jwt.sign({ userId: user._id }, secretKey);
  
      res.status(200).json({ token });
    } catch (error) {
      res.status(500).json({ message: "login failed" });
    }
  });
  